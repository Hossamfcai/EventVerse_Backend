const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Standalone delete-by-id route; creation/listing is nested under /events/:eventId/reviews
const router = express.Router();

router.delete('/:id', authenticate, reviewController.remove);

module.exports = router;
