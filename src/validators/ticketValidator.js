const { z } = require('zod');

const validateTicketSchema = z.object({
  qrToken: z.string().min(1),
});

module.exports = { validateTicketSchema };
