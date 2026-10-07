const { prisma } = require('../config/database');
const bookingRepository = require('../repositories/bookingRepository');
const ticketTypeRepository = require('../repositories/ticketTypeRepository');
const ApiError = require('../utils/ApiError');
const { generateQrToken, generateTicketCode } = require('../utils/qrcode');
const {
  BOOKING_STATUS,
  TICKET_STATUS,
  EVENT_STATUS,
  ROLES,
} = require('../config/constants');

/**
 * Core booking workflow (see plan section 11/12/13):
 *   authenticate -> validate event -> validate ticket type -> check event status
 *   -> check sales period -> check available quantity -> calculate total on server
 *   -> MongoDB transaction (create booking, create tickets, decrement inventory) -> commit
 *
 * Requires the configured MongoDB deployment to support multi-document
 * transactions (replica set / MongoDB Atlas). If the underlying deployment
 * does not support transactions, prisma.$transaction will throw and the
 * whole operation aborts with nothing partially written.
 */
async function createBooking(userId, { eventId, ticketTypeId, quantity }) {
  const ticketType = await ticketTypeRepository.findById(ticketTypeId);
  if (!ticketType || ticketType.eventId !== eventId) {
    throw ApiError.badRequest('Invalid ticket type for this event');
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw ApiError.notFound('Event not found');

  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This event is not open for bookings');
  }

  const now = new Date();
  if (ticketType.salesStart && now < ticketType.salesStart) {
    throw ApiError.badRequest('Ticket sales have not started yet');
  }
  if (ticketType.salesEnd && now > ticketType.salesEnd) {
    throw ApiError.badRequest('Ticket sales have ended');
  }

  if (ticketType.availableQuantity < quantity) {
    throw ApiError.badRequest('Not enough tickets available');
  }

  // Server always calculates the price - never trust a client-supplied total.
  const totalAmount = Math.round(ticketType.price * quantity * 100) / 100;

  const result = await prisma.$transaction(async (tx) => {
    // Atomic, conditional decrement: only succeeds if enough stock still
    // remains at the moment of the write. This is what actually prevents
    // overselling under concurrent requests, independent of the read above.
    const decrement = await ticketTypeRepository.decrementAvailability(tx, ticketTypeId, quantity);
    if (decrement.count === 0) {
      throw ApiError.conflict('Not enough tickets available');
    }

    const booking = await tx.booking.create({
      data: {
        userId,
        eventId,
        ticketTypeId,
        quantity,
        totalAmount,
        status: BOOKING_STATUS.CONFIRMED,
      },
    });

    const ticketsData = Array.from({ length: quantity }).map(() => ({
      bookingId: booking.id,
      userId,
      eventId,
      ticketTypeId,
      code: generateTicketCode(),
      qrToken: generateQrToken(),
      status: TICKET_STATUS.VALID,
    }));

    await tx.ticket.createMany({ data: ticketsData });
    const tickets = await tx.ticket.findMany({ where: { bookingId: booking.id } });

    return { booking, tickets };
  });

  return result;
}

async function getBookingById(id, requester) {
  const booking = await bookingRepository.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== booking.userId) {
    throw ApiError.forbidden('You do not own this booking');
  }
  return booking;
}

async function listMyBookings(userId, { page, limit, skip }) {
  const [bookings, total] = await Promise.all([
    bookingRepository.findByUser({ userId, skip, take: limit }),
    bookingRepository.countByUser(userId),
  ]);
  return { bookings, total };
}

// Cancels a booking, restores ticket-type inventory, and invalidates issued tickets.
// Runs in a transaction so the booking, its tickets, and inventory stay consistent.
async function cancelBooking(id, requester) {
  const booking = await bookingRepository.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== booking.userId) {
    throw ApiError.forbidden('You do not own this booking');
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw ApiError.badRequest('Booking is already cancelled');
  }

  return prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: BOOKING_STATUS.CANCELLED } });
    await tx.ticket.updateMany({
      where: { bookingId: id },
      data: { status: TICKET_STATUS.CANCELLED },
    });
    await tx.ticketType.update({
      where: { id: booking.ticketTypeId },
      data: { availableQuantity: { increment: booking.quantity } },
    });
    return tx.booking.findUnique({ where: { id }, include: { tickets: true } });
  });
}

module.exports = { createBooking, getBookingById, listMyBookings, cancelBooking };
