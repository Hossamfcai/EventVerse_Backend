const express = require('express');
const ticketTypeController = require('../controllers/ticketTypeController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createTicketTypeSchema, updateTicketTypeSchema } = require('../validators/ticketTypeValidator');
const { ROLES } = require('../config/constants');

// Mounted at /api/v1/events/:eventId/ticket-types and /api/v1/ticket-types
const router = express.Router({ mergeParams: true });

router.get('/', ticketTypeController.listForEvent);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ORGANIZER, ROLES.ADMIN),
  validate({ body: createTicketTypeSchema }),
  ticketTypeController.create
);

const standaloneRouter = express.Router();
standaloneRouter.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ORGANIZER, ROLES.ADMIN),
  validate({ body: updateTicketTypeSchema }),
  ticketTypeController.update
);
standaloneRouter.delete('/:id', authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN), ticketTypeController.remove);

module.exports = { nestedRouter: router, standaloneRouter };
