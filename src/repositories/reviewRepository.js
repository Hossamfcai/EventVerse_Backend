const { prisma } = require('../config/database');

const reviewRepository = {
  create: (data) => prisma.review.create({ data, include: { user: true } }),
  findByEvent: (eventId) =>
    prisma.review.findMany({ where: { eventId }, include: { user: true }, orderBy: { createdAt: 'desc' } }),
  findOne: (userId, eventId) => prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } }),
  delete: (id) => prisma.review.delete({ where: { id } }),
  aggregateForEvent: (eventId) =>
    prisma.review.aggregate({ where: { eventId }, _avg: { rating: true }, _count: { rating: true } }),
};

module.exports = reviewRepository;
