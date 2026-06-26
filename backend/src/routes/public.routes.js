const r = require('express').Router();
const c = require('../controllers/public.controller');
r.get('/booking/:id', c.booking);
r.post('/feedback', c.feedback);
module.exports = r;
