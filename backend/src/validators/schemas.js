const Joi = require('joi');
const ROLES = ['admin','manager','front_desk','housekeeping','accounts','corporate_coordinator'];
const ENQ_STATUS = ['new','contacted','interested','follow_up_pending','confirmed','cancelled','lost'];
const SOURCES = ['call','whatsapp','walk_in','email','website','ota','referral','other'];
const ROOM_STATUS = ['available','reserved','occupied','cleaning','maintenance'];
const id = Joi.string().uuid();

module.exports = {
  register: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20).allow('', null),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid(...ROLES).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  enquiryCreate: Joi.object({
    guest_name: Joi.string().min(2).max(120).required(),
    mobile: Joi.string().pattern(/^[0-9+\-\s]{7,20}$/).required(),
    email: Joi.string().email().allow('', null),
    city: Joi.string().max(80).allow('', null),
    source: Joi.string().valid(...SOURCES).default('call'),
    room_type: Joi.string().max(40).allow('', null),
    guests_count: Joi.number().integer().min(1).default(1),
    check_in_date: Joi.date().iso().allow(null),
    check_out_date: Joi.date().iso().min(Joi.ref('check_in_date')).allow(null),
    budget: Joi.number().min(0).allow(null),
    special_requirements: Joi.string().allow('', null),
    assigned_staff_id: id.allow(null),
  }),
  enquiryStatus: Joi.object({ status: Joi.string().valid(...ENQ_STATUS).required() }),
  enquiryAssign: Joi.object({ assigned_staff_id: id.required() }),

  followupCreate: Joi.object({
    enquiry_id: id.required(),
    scheduled_date: Joi.date().iso().required(),
    scheduled_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
    notes: Joi.string().allow('', null),
    priority: Joi.string().valid('low','medium','high','urgent').default('medium'),
    assigned_staff_id: id.allow(null),
  }),

  roomCreate: Joi.object({
    room_number: Joi.string().max(10).required(),
    room_type: Joi.string().max(40).required(),
    capacity: Joi.number().integer().min(1).required(),
    rate: Joi.number().min(0).required(),
    floor: Joi.number().integer().allow(null),
    status: Joi.string().valid(...ROOM_STATUS).default('available'),
  }),
  roomStatus: Joi.object({ status: Joi.string().valid(...ROOM_STATUS).required() }),

  bookingCreate: Joi.object({
    guest_id: id.required(),
    room_id: id.required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')),
    duration_hours: Joi.number().valid(12, 24, 48, 72, 168),
    amount: Joi.number().min(0).default(0),
  }).or('check_out_date', 'duration_hours'),
  bookingFromEnquiry: Joi.object({
    room_id: id.required(),
    check_in_date: Joi.date().iso().allow(null),
    duration_hours: Joi.number().valid(12, 24, 48, 72, 168).allow(null),
    amount: Joi.number().min(0).allow(null),
  }),

  complaintCreate: Joi.object({
    guest_id: id.allow(null),
    booking_id: id.allow(null),
    title: Joi.string().min(2).max(160).required(),
    description: Joi.string().allow('', null),
    priority: Joi.string().valid('low','medium','high','urgent').default('medium'),
    assigned_to: id.allow(null),
  }),
  feedbackCreate: Joi.object({
    guest_id: id.allow(null),
    booking_id: id.allow(null),
    rating: Joi.number().integer().min(1).max(5).required(),
    comments: Joi.string().allow('', null),
  }),
};
