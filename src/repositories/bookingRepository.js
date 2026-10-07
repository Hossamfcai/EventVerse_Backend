const { prisma } = require('../config/database');

const bookingRepository = {
  findById: (id) =>
    prisma.booking.findUnique({
      where: { id },
      include: { event: true, ticketType: true, tickets: true },
    }),

  findByUser: ({ userId, skip, take }) =>
    prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { event: true, ticketType: true, tickets: true },
    }),

  countByUser: (userId) => prisma.booking.count({ where: { userId } }),

  findByEventForOrganizer: (eventId) =>
    prisma.booking.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: { user: true, ticketType: true },
    }),

  updateStatus: (id, status) => prisma.booking.update({ where: { id }, data: { status } }),
};

module.exports = bookingRepository;
