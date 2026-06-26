const ApiError = require('../utils/ApiError');
// Usage: authorize('admin','manager')
module.exports = function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role))
      return next(ApiError.forbidden('Insufficient role permissions'));
    next();
  };
};
