const { prisma } = require('../config/database');
const eventRepository = require('../repositories/eventRepository');
const ApiError = require('../utils/ApiError');
const { BOOKING_STATUS, TICKET_STATUS, ROLES } = require('../config/constants');

async function assertOwnsEvent(eventId, requester) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden('You do not own this event');
  }
  return event;
}

// Per-event organizer analytics: confirmed bookings, revenue, tickets sold/checked-in.
async function getEventAnalytics(eventId, requester) {
  const event = await assertOwnsEvent(eventId, requester);

  const [bookings, tickets] = await Promise.all([
    prisma.booking.findMany({ where: { eventId, status: BOOKING_STATUS.CONFIRMED } }),
    prisma.ticket.findMany({ where: { eventId } }),
  ]);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const ticketsSold = tickets.filter((t) => t.status !== TICKET_STATUS.CANCELLED).length;
  const ticketsCheckedIn = tickets.filter((t) => t.status === TICKET_STATUS.USED).length;

  return {
    eventId,
    title: event.title,
    totalBookings: bookings.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ticketsSold,
    ticketsCheckedIn,
    checkInRate: ticketsSold > 0 ? Math.round((ticketsCheckedIn / ticketsSold) * 1000) / 10 : 0,
  };
}

// Aggregate analytics across every event owned by the organizer.
async function getOrganizerAnalytics(organizerId) {
  const events = await prisma.event.findMany({ where: { organizerId }, select: { id: true, title: true } });
  const eventIds = events.map((e) => e.id);

  const [bookings, tickets] = await Promise.all([
    prisma.booking.findMany({ where: { eventId: { in: eventIds }, status: BOOKING_STATUS.CONFIRMED } }),
    prisma.ticket.findMany({ where: { eventId: { in: eventIds } } }),
  ]);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return {
    totalEvents: events.length,
    totalBookings: bookings.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ticketsSold: tickets.filter((t) => t.status !== TICKET_STATUS.CANCELLED).length,
    ticketsCheckedIn: tickets.filter((t) => t.status === TICKET_STATUS.USED).length,
  };
}

module.exports = { getEventAnalytics, getOrganizerAnalytics };
