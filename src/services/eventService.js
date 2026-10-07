const eventRepository = require("../repositories/eventRepository");
const categoryRepository = require("../repositories/categoryRepository");
const ApiError = require("../utils/ApiError");
const slugify = require("../utils/slugify");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { EVENT_STATUS, ROLES } = require("../config/constants");

// Haversine formula: great-circle distance between two lat/lng points in km.
// Used for the optional nearby-event discovery filter. For larger scale this
// would move to a MongoDB $geoNear/2dsphere geospatial index, but this keeps
// the required plain latitude/longitude fields as the source of truth.
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function generateUniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await eventRepository.findBySlug(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function createEvent(organizerId, payload) {
  const category = await categoryRepository.findById(payload.categoryId);
  if (!category) throw ApiError.badRequest("Invalid categoryId");

  const slug = await generateUniqueSlug(payload.title);

  return eventRepository.create({
    organizerId,
    categoryId: payload.categoryId,
    title: payload.title,
    slug,
    description: payload.description,
    imageUrl: payload.imageUrl,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    venue: payload.venue,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    status: payload.status || EVENT_STATUS.UPCOMING,
  });
}

async function getEventById(id) {
  const event = await eventRepository.findById(id);
  if (!event) throw ApiError.notFound("Event not found");
  return event;
}

async function updateEvent(id, requester, payload) {
  const event = await eventRepository.findById(id);
  if (!event) throw ApiError.notFound("Event not found");

  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden("You do not own this event");
  }

  if (payload.categoryId) {
    const category = await categoryRepository.findById(payload.categoryId);
    if (!category) throw ApiError.badRequest("Invalid categoryId");
  }

  const data = { ...payload };
  if (payload.title && payload.title !== event.title) {
    data.slug = await generateUniqueSlug(payload.title);
  }

  return eventRepository.update(id, data);
}

async function deleteEvent(id, requester) {
  const event = await eventRepository.findById(id);
  if (!event) throw ApiError.notFound("Event not found");

  if (requester.role !== ROLES.ADMIN && requester.id !== event.organizerId) {
    throw ApiError.forbidden("You do not own this event");
  }

  await eventRepository.delete(id);
}

// Public event discovery: search, category, date range, price range, and
// optional nearby (latitude/longitude/radius) filtering. Only published
// events are returned; a cancelled event is never surfaced here.
async function listEvents(query) {
  const { page, limit, skip } = parsePagination(query);

  const where = { status: EVENT_STATUS.PUBLISHED };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { venue: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.category) {
    where.categoryId = query.category;
  }
  if (query.location) {
    where.address = { contains: query.location, mode: "insensitive" };
  }
  if (query.date) {
    const day = new Date(query.date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: day, lt: nextDay };
  }

  let orderBy = { date: "asc" };
  if (query.sort === "newest") orderBy = { createdAt: "desc" };
  if (query.sort === "date_desc") orderBy = { date: "desc" };

  // Price filtering happens against ticketTypes; fetch a candidate set then filter.
  const useNearby =
    query.latitude != null && query.longitude != null && query.radius != null;
  const useNearbyOrPrice =
    useNearby || query.minPrice != null || query.maxPrice != null;

  if (!useNearbyOrPrice) {
    const [events, total] = await Promise.all([
      eventRepository.findMany({ where, orderBy, skip, take: limit }),
      eventRepository.count(where),
    ]);
    return { events, meta: buildMeta({ page, limit, total }) };
  }

  // Fetch a broader candidate window, then apply in-memory price/nearby filters + manual pagination.
  const candidates = await eventRepository.findMany({
    where,
    orderBy,
    skip: 0,
    take: 500,
  });

  let filtered = candidates;

  if (query.minPrice != null || query.maxPrice != null) {
    filtered = filtered.filter((event) => {
      const prices = event.ticketTypes.map((t) => t.price);
      if (prices.length === 0) return false;
      const min = Math.min(...prices);
      if (query.minPrice != null && min < query.minPrice) return false;
      if (query.maxPrice != null && min > query.maxPrice) return false;
      return true;
    });
  }

  if (useNearby) {
    filtered = filtered
      .map((event) => ({
        event,
        distance: distanceKm(
          query.latitude,
          query.longitude,
          event.latitude,
          event.longitude,
        ),
      }))
      .filter((e) => e.distance <= query.radius)
      .sort((a, b) => a.distance - b.distance)
      .map((e) => ({
        ...e.event,
        distanceKm: Math.round(e.distance * 10) / 10,
      }));
  }

  const total = filtered.length;
  const events = filtered.slice(skip, skip + limit);

  return { events, meta: buildMeta({ page, limit, total }) };
}

async function listOrganizerEvents(organizerId, query) {
  const { page, limit, skip } = parsePagination(query);
  const [events, total] = await Promise.all([
    eventRepository.findByOrganizer({ organizerId, skip, take: limit }),
    eventRepository.countByOrganizer(organizerId),
  ]);
  return { events, meta: buildMeta({ page, limit, total }) };
}

module.exports = {
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  listEvents,
  listOrganizerEvents,
  distanceKm,
};
