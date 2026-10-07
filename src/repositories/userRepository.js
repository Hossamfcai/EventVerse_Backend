const { prisma } = require('../config/database');

const userRepository = {
  create: (data) => prisma.user.create({ data }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
};

module.exports = userRepository;
