const { z } = require("zod");

// Mapbox-selected location payload. Coordinates must be valid, real-world values;
// the frontend's Mapbox selection does not replace this backend validation.
const locationSchema = z.object({
  venue: z.string().min(2).max(200),
  address: z.string().min(2).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const createEventSchema = z
  .object({
    title: z.string().min(3).max(150),
    description: z.string().min(10),
    categoryId: z.string().min(1),
    imageUrl: z.string().url().optional(),
    date: z.coerce.date(),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    status: z.enum(["PUBLISHED", "UPCOMING", "CANCELED"]).optional(),
  })
  .merge(locationSchema);

const updateEventSchema = createEventSchema.partial();

const listEventsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = {
  locationSchema,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  idParamSchema,
};
