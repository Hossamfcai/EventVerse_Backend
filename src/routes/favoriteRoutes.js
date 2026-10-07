const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', favoriteController.listMine);
router.post('/:eventId', favoriteController.add);
router.delete('/:eventId', favoriteController.remove);

module.exports = router;
