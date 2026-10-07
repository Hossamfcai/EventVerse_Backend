const ticketTypeService = require('../services/ticketTypeService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const ticketType = await ticketTypeService.createTicketType(req.params.eventId, req.user, req.body);
  success(res, 201, ticketType);
});

const update = asyncHandler(async (req, res) => {
  const ticketType = await ticketTypeService.updateTicketType(req.params.id, req.user, req.body);
  success(res, 200, ticketType);
});

const remove = asyncHandler(async (req, res) => {
  await ticketTypeService.deleteTicketType(req.params.id, req.user);
  success(res, 200, { message: 'Ticket type deleted' });
});

const listForEvent = asyncHandler(async (req, res) => {
  const ticketTypes = await ticketTypeService.listByEvent(req.params.eventId);
  success(res, 200, ticketTypes);
});

module.exports = { create, update, remove, listForEvent };
