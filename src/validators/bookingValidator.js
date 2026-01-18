const Joi = require("joi");

const createBookingSchema = Joi.object({
  item_id: Joi.number().integer().required().messages({
    "any.required": "Item ID is required",
    "number.base": "Item ID must be a number",
  }),

  booking_date: Joi.date().iso().min("now").required().messages({
    "any.required": "Booking date is required",
    "date.min": "Booking date cannot be in the past",
    "date.format": "Booking date must be in YYYY-MM-DD format",
  }),

  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "any.required": "Start time is required",
      "string.pattern.base": "Start time must be in HH:MM format",
    }),

  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "any.required": "End time is required",
      "string.pattern.base": "End time must be in HH:MM format",
    }),

  customer_name: Joi.string().min(2).max(255).required().messages({
    "any.required": "Customer name is required",
    "string.min": "Customer name must be at least 2 characters",
  }),

  customer_email: Joi.string().email().allow(null, "").optional().messages({
    "string.email": "Invalid email format",
  }),

  customer_phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be 10-15 digits",
    }),

  addons: Joi.array().items(Joi.number().integer()).optional().default([]),

  notes: Joi.string().allow(null, "").optional(),
}).custom((value, helpers) => {
  // Custom validation: end_time must be after start_time
  const start = value.start_time.split(":");
  const end = value.end_time.split(":");

  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);

  if (endMinutes <= startMinutes) {
    return helpers.error("any.invalid", {
      message: "End time must be after start time",
    });
  }

  return value;
});

const availableSlotsQuerySchema = Joi.object({
  date: Joi.date().iso().required().messages({
    "any.required": "Date is required",
    "date.format": "Date must be in YYYY-MM-DD format",
  }),
});

module.exports = {
  createBookingSchema,
  availableSlotsQuerySchema,
};
