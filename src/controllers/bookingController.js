const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');

const create = asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(req.user.id, req.body);
  success(res, 201, result);
});

const getMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { bookings, total } = await bookingService.listMyBookings(req.user.id, { page, limit, skip });
  success(res, 200, bookings, buildMeta({ page, limit, total }));
});

const getById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  success(res, 200, booking);
});

const cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user);
  success(res, 200, booking);
});

module.exports = { create, getMine, getById, cancel };
