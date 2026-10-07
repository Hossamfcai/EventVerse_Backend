const ApiError = require('../utils/ApiError');

// Validates req.body/query/params against a Zod schema map: { body?, query?, params? }.
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      const details = err.errors
        ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
        : undefined;
      next(ApiError.badRequest('Validation failed', details));
    }
  };
}

module.exports = validate;
