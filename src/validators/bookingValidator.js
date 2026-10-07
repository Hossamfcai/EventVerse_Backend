const { z } = require('zod');

const createBookingSchema = z.object({
  eventId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
  // Note: totalAmount is intentionally NOT accepted from the client.
  // The server always calculates the price itself.
});

module.exports = { createBookingSchema };
