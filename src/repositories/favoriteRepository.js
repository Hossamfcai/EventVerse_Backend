const { prisma } = require('../config/database');

const favoriteRepository = {
  create: (data) => prisma.favorite.create({ data }),
  delete: (id) => prisma.favorite.delete({ where: { id } }),
  findOne: (userId, eventId) => prisma.favorite.findUnique({ where: { userId_eventId: { userId, eventId } } }),
  findByUser: (userId) =>
    prisma.favorite.findMany({ where: { userId }, include: { event: true }, orderBy: { createdAt: 'desc' } }),
};

module.exports = favoriteRepository;
