const config = require('../config/env');
const ApiError = require('../utils/ApiError');

// Central error handler. Keeps stack traces out of production responses and
// normalizes Prisma / validation errors into a consistent JSON shape.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || 'Internal server error');
  }

  if (config.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      details: error.details || undefined,
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

module.exports = { errorHandler, notFoundHandler };
