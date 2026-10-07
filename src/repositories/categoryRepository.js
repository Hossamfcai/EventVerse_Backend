const { prisma } = require('../config/database');

const categoryRepository = {
  create: (data) => prisma.category.create({ data }),
  findAll: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),
  findById: (id) => prisma.category.findUnique({ where: { id } }),
  findBySlug: (slug) => prisma.category.findUnique({ where: { slug } }),
};

module.exports = categoryRepository;
