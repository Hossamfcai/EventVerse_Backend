const { prisma } = require('../config/database');

const ticketTypeRepository = {
  create: (data) => prisma.ticketType.create({ data }),
  update: (id, data) => prisma.ticketType.update({ where: { id }, data }),
  delete: (id) => prisma.ticketType.delete({ where: { id } }),
  findById: (id) => prisma.ticketType.findUnique({ where: { id } }),
  findByEvent: (eventId) => prisma.ticketType.findMany({ where: { eventId } }),

  // Atomically decrements availableQuantity only if enough stock remains.
  // Used inside the booking transaction to prevent overselling under concurrency:
  // the WHERE clause (availableQuantity >= quantity) means a losing concurrent
  // request updates zero documents rather than driving the count negative.
  decrementAvailability: (tx, ticketTypeId, quantity) =>
    tx.ticketType.updateMany({
      where: { id: ticketTypeId, availableQuantity: { gte: quantity } },
      data: { availableQuantity: { decrement: quantity } },
    }),
};

module.exports = ticketTypeRepository;
