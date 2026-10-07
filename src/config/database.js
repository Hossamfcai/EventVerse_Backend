const { PrismaClient } = require('@prisma/client');
const { nodeEnv } = require('./env');

// Single shared Prisma client instance (repository layer depends on this).
// MongoDB multi-document transactions (used by the booking workflow) require
// the configured DATABASE_URL to point at a replica set or MongoDB Atlas cluster.
const prisma = new PrismaClient({
  log: nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

async function connectDatabase() {
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log('[database] Connected to MongoDB via Prisma');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
