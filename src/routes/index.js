const express = require('express');
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const categoryRoutes = require('./categoryRoutes');
const bookingRoutes = require('./bookingRoutes');
const ticketRoutes = require('./ticketRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const reviewRoutes = require('./reviewRoutes');
const organizerRoutes = require('./organizerRoutes');
const { standaloneRouter: ticketTypeStandaloneRoutes } = require('./ticketTypeRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/categories', categoryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tickets', ticketRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/organizer', organizerRoutes);
router.use('/ticket-types', ticketTypeStandaloneRoutes);

module.exports = router;
