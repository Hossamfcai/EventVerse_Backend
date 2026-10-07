const reviewService = require('../services/reviewService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.params.eventId, req.body);
  success(res, 201, review);
});

const listForEvent = asyncHandler(async (req, res) => {
  const result = await reviewService.listEventReviews(req.params.eventId);
  success(res, 200, result);
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user);
  success(res, 200, { message: 'Review deleted' });
});

module.exports = { create, listForEvent, remove };
