module.exports = require('../utils/crudFactory')({ table:'users', columns:['name','email','phone','role','is_active'], searchable:['name','email'], filterable:['role','is_active'] });
