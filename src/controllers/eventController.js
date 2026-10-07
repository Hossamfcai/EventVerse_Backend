const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/pagination');

const create = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user.id, req.body);
  success(res, 201, event);
});

const list = asyncHandler(async (req, res) => {
  const { events, meta } = await eventService.listEvents(req.query);
  success(res, 200, events, meta);
});

const getById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  success(res, 200, event);
});

const update = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.user, req.body);
  success(res, 200, event);
});

const remove = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.user);
  success(res, 200, { message: 'Event deleted' });
});

const listOrganizerEvents = asyncHandler(async (req, res) => {
  const { events, meta } = await eventService.listOrganizerEvents(req.user.id, req.query);
  success(res, 200, events, meta);
});

const getOrganizerEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'You do not own this event' } });
  }
  success(res, 200, event);
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  listOrganizerEvents,
  getOrganizerEventById,
  parsePagination,
};
