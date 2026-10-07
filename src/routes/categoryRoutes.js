const express = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createCategorySchema } = require('../validators/categoryValidator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', categoryController.list);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createCategorySchema }),
  categoryController.create
);

module.exports = router;
