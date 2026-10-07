const express = require('express');
const eventController = require('../controllers/eventController');
const organizerController = require('../controllers/organizerController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN));

router.get('/events', eventController.listOrganizerEvents);
router.get('/events/:id', eventController.getOrganizerEventById);
router.get('/events/:id/bookings', organizerController.listBookingsForEvent);
router.get('/events/:id/analytics', organizerController.getEventAnalytics);
router.get('/analytics', organizerController.getOrganizerAnalytics);

module.exports = router;
