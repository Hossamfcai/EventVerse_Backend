const reviewRepository = require('../repositories/reviewRepository');
const eventRepository = require('../repositories/eventRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

async function createReview(userId, eventId, { rating, comment }) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');

  const existing = await reviewRepository.findOne(userId, eventId);
  if (existing) throw ApiError.conflict('You have already reviewed this event');

  return reviewRepository.create({ userId, eventId, rating, comment });
}

async function listEventReviews(eventId) {
  const [reviews, agg] = await Promise.all([
    reviewRepository.findByEvent(eventId),
    reviewRepository.aggregateForEvent(eventId),
  ]);
  return {
    reviews,
    averageRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    reviewCount: agg._count.rating,
  };
}

async function deleteReview(id, requester) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');
  if (requester.role !== ROLES.ADMIN && requester.id !== review.userId) {
    throw ApiError.forbidden('You do not own this review');
  }
  await reviewRepository.delete(id);
}

module.exports = { createReview, listEventReviews, deleteReview };
