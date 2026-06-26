const ApiError = require('../utils/ApiError');
const { verifyAccess } = require('../utils/token');

// Validates JWT access token, attaches req.user
module.exports = function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized('Missing access token'));
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch (e) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};
