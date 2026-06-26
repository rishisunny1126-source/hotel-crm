module.exports = require('../utils/crudFactory')({ table:'feedback', columns:['guest_id','booking_id','rating','comments'], filterable:['rating'] });
