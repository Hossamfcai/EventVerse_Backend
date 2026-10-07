const { prisma } = require("../config/database");

// Repository layer isolates MongoDB/Prisma-specific query construction so
// controllers/services never build raw Mongo filters directly.
const eventRepository = {
  create: (data) =>
    prisma.event.create({ data, include: { category: true, organizer: true } }),

  update: (id, data) =>
    prisma.event.update({
      where: { id },
      data,
      include: { category: true, organizer: true },
    }),

  delete: (id) => prisma.event.delete({ where: { id } }),

  findById: (id) =>
    prisma.event.findUnique({
      where: { id },
      include: { category: true, organizer: true, ticketTypes: true },
    }),

  findBySlug: (slug) =>
    prisma.event.findUnique({
      where: { slug },
      include: { category: true, organizer: true, ticketTypes: true },
    }),

  findMany: ({ where, orderBy, skip, take }) =>
    prisma.event.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: true, ticketTypes: true },
    }),

  count: (where) => prisma.event.count({ where }),

  // Events that are still "live" (not already CANCELED/ARCHIVED) and are
  // therefore candidates for the automatic archive sweep. Final eligibility
  // (date + endTime has actually passed) is decided in the service layer via
  // getEventEndDateTime, since endTime is a plain string and can't be
  // compared directly in a Mongo query.
  findArchiveCandidates: () =>
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "UPCOMING"] } },
      select: { id: true, date: true, endTime: true },
    }),
  archiveByIds: (ids) =>
    prisma.event.updateMany({
      where: { id: { in: ids } },
      data: { status: "ARCHIVED" },
    }),

  findByOrganizer: ({ organizerId, skip, take }) =>
    prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { category: true, ticketTypes: true },
    }),

  countByOrganizer: (organizerId) =>
    prisma.event.count({ where: { organizerId } }),
};

module.exports = eventRepository;
