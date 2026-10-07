const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

// Ensures the current user owns the resource (by organizerId/userId) or is an admin.
function requireOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      if (!ownerId) return next(ApiError.notFound());
      if (req.user.role === ROLES.ADMIN || req.user.id === ownerId) {
        return next();
      }
      return next(ApiError.forbidden('You do not own this resource'));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireOwnerOrAdmin };
