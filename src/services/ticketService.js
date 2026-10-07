const ticketRepository = require('../repositories/ticketRepository');
const eventRepository = require('../repositories/eventRepository');
const ApiError = require('../utils/ApiError');
const { generateQrDataUrl } = require('../utils/qrcode');
const { TICKET_STATUS, ROLES } = require('../config/constants');

async function listMyTickets(userId, { page, limit, skip }) {
  const [tickets, total] = await Promise.all([
    ticketRepository.findByUser({ userId, skip, take: limit }),
    ticketRepository.countByUser(userId),
  ]);
  return { tickets, total };
}

async function getTicketById(id, requester) {
  const ticket = await ticketRepository.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== ticket.userId) {
    throw ApiError.forbidden('You do not own this ticket');
  }
  return ticket;
}

async function getTicketQr(id, requester) {
  const ticket = await getTicketById(id, requester);
  const dataUrl = await generateQrDataUrl(ticket.qrToken);
  return { ticketId: ticket.id, qrDataUrl: dataUrl };
}

// Validates a scanned QR token without checking it in - used to preview ticket
// details at a gate before committing the check-in.
async function validateTicket(qrToken, requester) {
  const ticket = await ticketRepository.findByQrToken(qrToken);
  if (!ticket) throw ApiError.notFound('Ticket not found or invalid QR code');

  const event = await eventRepository.findById(ticket.eventId);
  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden('You are not authorized to validate tickets for this event');
  }

  return {
    ticket,
    valid: ticket.status === TICKET_STATUS.VALID,
    reason: ticket.status !== TICKET_STATUS.VALID ? `Ticket status is ${ticket.status}` : null,
  };
}

// Checks a ticket in. Only a VALID ticket can be checked in, and only once -
// the status flip to USED prevents re-use / duplicate check-ins of the same QR code.
async function checkInTicket(id, requester) {
  const ticket = await ticketRepository.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const event = await eventRepository.findById(ticket.eventId);
  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden('You are not authorized to check in tickets for this event');
  }

  if (ticket.status === TICKET_STATUS.USED) {
    throw ApiError.conflict('Ticket has already been checked in');
  }
  if (ticket.status === TICKET_STATUS.CANCELLED) {
    throw ApiError.badRequest('This ticket was cancelled and cannot be checked in');
  }

  return ticketRepository.updateStatus(id, { status: TICKET_STATUS.USED, checkedInAt: new Date() });
}

module.exports = { listMyTickets, getTicketById, getTicketQr, validateTicket, checkInTicket };
