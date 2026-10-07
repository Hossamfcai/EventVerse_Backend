const favoriteRepository = require('../repositories/favoriteRepository');
const eventRepository = require('../repositories/eventRepository');
const ApiError = require('../utils/ApiError');

async function addFavorite(userId, eventId) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');

  const existing = await favoriteRepository.findOne(userId, eventId);
  if (existing) throw ApiError.conflict('Event already in favorites');

  return favoriteRepository.create({ userId, eventId });
}

async function removeFavorite(userId, eventId) {
  const existing = await favoriteRepository.findOne(userId, eventId);
  if (!existing) throw ApiError.notFound('Favorite not found');
  await favoriteRepository.delete(existing.id);
}

async function listMyFavorites(userId) {
  return favoriteRepository.findByUser(userId);
}

module.exports = { addFavorite, removeFavorite, listMyFavorites };
