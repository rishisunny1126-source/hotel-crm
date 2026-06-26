module.exports = require('../utils/crudFactory')({ table:'housekeeping_tasks', columns:['room_id','status','assigned_to','notes','completed_at'], filterable:['status','assigned_to'] });
