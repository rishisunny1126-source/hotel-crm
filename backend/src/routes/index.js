const router = require('express').Router();
const crud = require('./_crudRoutes');

router.use('/auth', require('./auth.routes'));
router.use('/public', require('./public.routes'));
router.use('/users', crud(require('../controllers/user.controller'), { write:['admin'], remove:['admin'] }));
router.use('/guests', crud(require('../controllers/guest.controller'),
  { write:['admin','manager','front_desk'] }));
router.use('/enquiries', require('./enquiry.routes'));
router.use('/follow-ups', require('./followup.routes'));
router.use('/rooms', require('./room.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/self-checkins', crud(require('../controllers/selfCheckin.controller'),
  { write:['admin','manager','front_desk'] }));
router.use('/room-service', crud(require('../controllers/roomService.controller'),
  { write:['admin','manager','front_desk','housekeeping'] }));
router.use('/housekeeping', crud(require('../controllers/housekeeping.controller'),
  { write:['admin','manager','housekeeping'] }));
router.use('/feedback', crud(require('../controllers/feedback.controller'),
  { write:['admin','manager','front_desk'] }));
router.use('/complaints', crud(require('../controllers/complaint.controller'),
  { write:['admin','manager','front_desk'] }));
router.use('/corporate-bookings', crud(require('../controllers/corporate.controller'),
  { write:['admin','manager','corporate_coordinator'] }));
router.use('/group-bookings', crud(require('../controllers/groupBooking.controller'),
  { write:['admin','manager','corporate_coordinator'] }));
router.use('/shift-handovers', crud(require('../controllers/shiftHandover.controller'),
  { write:['admin','manager','front_desk','housekeeping','accounts'] }));
router.use('/payments', require('./payment.routes'));
router.use('/rate-plans', require('./ratePlan.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
