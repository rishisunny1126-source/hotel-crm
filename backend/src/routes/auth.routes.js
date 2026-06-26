const r = require('express').Router();
const c = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const S = require('../validators/schemas');

r.post('/login', validate(S.login), c.login);
r.post('/refresh', c.refresh);
r.post('/logout', c.logout);
r.get('/me', auth, c.me);
r.post('/register', auth, authorize('admin'), validate(S.register), c.register);
module.exports = r;
