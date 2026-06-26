const r = require('express').Router();
const c = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
r.use(auth);
r.get('/summary', c.summary);
r.get('/charts', c.charts);
r.get('/activity', c.activity);
module.exports = r;
