const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  success(res, 201, category);
});

const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  success(res, 200, categories);
});

module.exports = { create, list };
