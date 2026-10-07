const ticketService = require('../services/ticketService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');

const getMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { tickets, total } = await ticketService.listMyTickets(req.user.id, { page, limit, skip });
  success(res, 200, tickets, buildMeta({ page, limit, total }));
});

const getById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id, req.user);
  success(res, 200, ticket);
});

const getQr = asyncHandler(async (req, res) => {
  const result = await ticketService.getTicketQr(req.params.id, req.user);
  success(res, 200, result);
});

const validate = asyncHandler(async (req, res) => {
  const result = await ticketService.validateTicket(req.body.qrToken, req.user);
  success(res, 200, result);
});

const checkIn = asyncHandler(async (req, res) => {
  const ticket = await ticketService.checkInTicket(req.params.id, req.user);
  success(res, 200, ticket);
});

module.exports = { getMine, getById, getQr, validate, checkIn };
