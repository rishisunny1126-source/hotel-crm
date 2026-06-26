const jwt = require('jsonwebtoken');
const { jwt: cfg } = require('../config/env');

const signAccess = (payload) =>
  jwt.sign(payload, cfg.secret, { expiresIn: cfg.expiresIn });
const signRefresh = (payload) =>
  jwt.sign(payload, cfg.refreshSecret, { expiresIn: cfg.refreshExpiresIn });
const verifyAccess = (t) => jwt.verify(t, cfg.secret);
const verifyRefresh = (t) => jwt.verify(t, cfg.refreshSecret);

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
