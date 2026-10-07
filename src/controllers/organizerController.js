const bookingRepository = require('../repositories/bookingRepository');
const analyticsService = require('../services/analyticsService');
const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const listBookingsForEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'You do not own this event' } });
  }
  const bookings = await bookingRepository.findByEventForOrganizer(req.params.id);
  success(res, 200, bookings);
});

const getEventAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getEventAnalytics(req.params.id, req.user);
  success(res, 200, analytics);
});

const getOrganizerAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getOrganizerAnalytics(req.user.id);
  success(res, 200, analytics);
});

module.exports = { listBookingsForEvent, getEventAnalytics, getOrganizerAnalytics };
