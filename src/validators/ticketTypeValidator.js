const { z } = require('zod');

const createTicketTypeSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().nonnegative(),
  totalQuantity: z.number().int().positive(),
  salesStart: z.coerce.date().optional(),
  salesEnd: z.coerce.date().optional(),
});

const updateTicketTypeSchema = createTicketTypeSchema.partial();

module.exports = { createTicketTypeSchema, updateTicketTypeSchema };
