const { prisma } = require('../config/database');

const ticketRepository = {
  findById: (id) => prisma.ticket.findUnique({ where: { id }, include: { event: true, ticketType: true } }),
  findByQrToken: (qrToken) =>
    prisma.ticket.findUnique({ where: { qrToken }, include: { event: true, ticketType: true, user: true } }),
  findByUser: ({ userId, skip, take }) =>
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { event: true, ticketType: true },
    }),
  countByUser: (userId) => prisma.ticket.count({ where: { userId } }),
  updateStatus: (id, data) => prisma.ticket.update({ where: { id }, data }),
};

module.exports = ticketRepository;
