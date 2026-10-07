const favoriteService = require('../services/favoriteService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const add = asyncHandler(async (req, res) => {
  const favorite = await favoriteService.addFavorite(req.user.id, req.params.eventId);
  success(res, 201, favorite);
});

const remove = asyncHandler(async (req, res) => {
  await favoriteService.removeFavorite(req.user.id, req.params.eventId);
  success(res, 200, { message: 'Removed from favorites' });
});

const listMine = asyncHandler(async (req, res) => {
  const favorites = await favoriteService.listMyFavorites(req.user.id);
  success(res, 200, favorites);
});

module.exports = { add, remove, listMine };
