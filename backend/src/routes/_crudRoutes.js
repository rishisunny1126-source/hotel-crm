const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
// roles: { write:[...], remove:[...] }  (read = any authenticated)
module.exports = (controller, roles = {}) => {
  const r = express.Router();
  r.use(auth);
  const w = roles.write || ['admin','manager'];
  const d = roles.remove || ['admin'];
  r.get('/', controller.list);
  r.get('/:id', controller.get);
  r.post('/', authorize(...w), controller.create);
  r.put('/:id', authorize(...w), controller.update);
  if (controller.remove) r.delete('/:id', authorize(...d), controller.remove);
  return r;
};
