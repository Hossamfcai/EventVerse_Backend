/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventverse.dev' },
    update: {},
    create: {
      name: 'Demo Organizer',
      email: 'organizer@eventverse.dev',
      password: passwordHash,
      role: 'ORGANIZER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@eventverse.dev' },
    update: {},
    create: {
      name: 'Demo Attendee',
      email: 'user@eventverse.dev',
      password: passwordHash,
      role: 'USER',
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: { name: 'Technology', slug: 'technology' },
  });

  const event = await prisma.event.upsert({
    where: { slug: 'cairo-tech-summit-2026' },
    update: {},
    create: {
      organizerId: organizer.id,
      categoryId: category.id,
      title: 'Cairo Tech Summit 2026',
      slug: 'cairo-tech-summit-2026',
      description: 'A gathering of developers, founders, and product teams across Egypt.',
      date: new Date('2026-11-15T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Cairo International Convention Center',
      address: 'Nasr City, Cairo, Egypt',
      latitude: 30.0444,
      longitude: 31.2357,
      status: 'PUBLISHED',
    },
  });

  await prisma.ticketType.upsert({
    where: { id: '000000000000000000000001' },
    update: {},
    create: {
      id: '000000000000000000000001',
      eventId: event.id,
      name: 'General Admission',
      price: 25,
      totalQuantity: 200,
      availableQuantity: 200,
    },
  }).catch(async () => {
    // Fallback if a fixed ObjectId collides / isn't valid for this Mongo instance.
    const existing = await prisma.ticketType.findFirst({ where: { eventId: event.id } });
    if (!existing) {
      await prisma.ticketType.create({
        data: { eventId: event.id, name: 'General Admission', price: 25, totalQuantity: 200, availableQuantity: 200 },
      });
    }
  });

  console.log('Seed complete:');
  console.log('  Organizer login: organizer@eventverse.dev / Password123!');
  console.log('  User login:      user@eventverse.dev / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
