const ApiError = require('../utils/ApiError');
// Validates req[source] against a Joi schema
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req[source] = value;
  next();
};
