const categoryRepository = require('../repositories/categoryRepository');
const slugify = require('../utils/slugify');
const ApiError = require('../utils/ApiError');

async function createCategory({ name }) {
  const slug = slugify(name);
  const existing = await categoryRepository.findBySlug(slug);
  if (existing) throw ApiError.conflict('Category already exists');
  return categoryRepository.create({ name, slug });
}

async function listCategories() {
  return categoryRepository.findAll();
}

module.exports = { createCategory, listCategories };
