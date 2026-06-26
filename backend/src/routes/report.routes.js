const r = require('express').Router();
const c = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
r.use(auth, authorize('admin','manager','accounts'));
r.get('/:type', c.generate);
module.exports = r;
