const ticketTypeRepository = require('../repositories/ticketTypeRepository');
const eventRepository = require('../repositories/eventRepository');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

async function assertOwnsEvent(eventId, requester) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden('You do not own this event');
  }
  return event;
}

async function createTicketType(eventId, requester, payload) {
  await assertOwnsEvent(eventId, requester);
  return ticketTypeRepository.create({
    eventId,
    name: payload.name,
    price: payload.price,
    totalQuantity: payload.totalQuantity,
    availableQuantity: payload.totalQuantity,
    salesStart: payload.salesStart,
    salesEnd: payload.salesEnd,
  });
}

async function updateTicketType(id, requester, payload) {
  const ticketType = await ticketTypeRepository.findById(id);
  if (!ticketType) throw ApiError.notFound('Ticket type not found');
  await assertOwnsEvent(ticketType.eventId, requester);

  const data = { ...payload };
  // If totalQuantity increases, grow availableQuantity by the same delta.
  if (payload.totalQuantity != null && payload.totalQuantity !== ticketType.totalQuantity) {
    const delta = payload.totalQuantity - ticketType.totalQuantity;
    data.availableQuantity = Math.max(ticketType.availableQuantity + delta, 0);
  }

  return ticketTypeRepository.update(id, data);
}

async function deleteTicketType(id, requester) {
  const ticketType = await ticketTypeRepository.findById(id);
  if (!ticketType) throw ApiError.notFound('Ticket type not found');
  await assertOwnsEvent(ticketType.eventId, requester);
  await ticketTypeRepository.delete(id);
}

async function listByEvent(eventId) {
  return ticketTypeRepository.findByEvent(eventId);
}

module.exports = { createTicketType, updateTicketType, deleteTicketType, listByEvent };
