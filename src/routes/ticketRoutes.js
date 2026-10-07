const express = require('express');
const ticketController = require('../controllers/ticketController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTicketSchema } = require('../validators/ticketValidator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get('/me', ticketController.getMine);
router.get('/:id', ticketController.getById);
router.get('/:id/qr', ticketController.getQr);
router.post(
  '/validate',
  authorize(ROLES.ORGANIZER, ROLES.ADMIN),
  validate({ body: validateTicketSchema }),
  ticketController.validate
);
router.post('/:id/check-in', authorize(ROLES.ORGANIZER, ROLES.ADMIN), ticketController.checkIn);

module.exports = router;
