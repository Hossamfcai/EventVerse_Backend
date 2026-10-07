const express = require('express');
const eventController = require('../controllers/eventController');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} = require('../validators/eventValidator');
const { createReviewSchema } = require('../validators/reviewValidator');
const { ROLES } = require('../config/constants');
const { nestedRouter: ticketTypeNestedRoutes } = require('./ticketTypeRoutes');

const router = express.Router();

router.get('/', validate({ query: listEventsQuerySchema }), eventController.list);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ORGANIZER, ROLES.ADMIN),
  validate({ body: createEventSchema }),
  eventController.create
);
router.get('/:id', eventController.getById);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ORGANIZER, ROLES.ADMIN),
  validate({ body: updateEventSchema }),
  eventController.update
);
router.delete('/:id', authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN), eventController.remove);

// Nested ticket types: GET/POST /api/v1/events/:eventId/ticket-types
router.use('/:eventId/ticket-types', ticketTypeNestedRoutes);

// Nested reviews: GET/POST /api/v1/events/:eventId/reviews
router.get('/:eventId/reviews', reviewController.listForEvent);
router.post(
  '/:eventId/reviews',
  authenticate,
  validate({ body: createReviewSchema }),
  reviewController.create
);

module.exports = router;
