const express = require('express');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { createBookingSchema } = require('../validators/bookingValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate({ body: createBookingSchema }), bookingController.create);
router.get('/me', bookingController.getMine);
router.get('/:id', bookingController.getById);
router.post('/:id/cancel', bookingController.cancel);

module.exports = router;
