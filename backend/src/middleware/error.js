const ApiError = require('../utils/ApiError');
// Centralized error handler -> consistent JSON envelope
module.exports = function errorHandler(err, req, res, _next) {
  let e = err;
  // Map known PostgreSQL errors
  if (err.code === '23505') e = ApiError.conflict('Duplicate value violates unique constraint');
  if (err.code === '23503') e = ApiError.badRequest('Referenced record does not exist');
  if (err.code === '23P01') e = ApiError.conflict('Booking conflict: room already booked for these dates');
  if (err.code === '23514') e = ApiError.badRequest('Value violates a data constraint');

  const status = e.statusCode || 500;
  const body = {
    success: false,
    error: { message: e.message || 'Internal server error', details: e.details || null },
  };
  if (process.env.NODE_ENV !== 'production' && status === 500) body.error.stack = err.stack;
  if (status === 500) console.error(err);
  res.status(status).json(body);
};
