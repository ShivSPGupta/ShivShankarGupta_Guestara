const Joi = require("joi");

// Validation schemas for Category

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 2 characters",
    "string.max": "Category name cannot exceed 255 characters",
    "any.required": "Category name is required",
  }),

  image: Joi.string().uri().allow(null, "").optional().messages({
    "string.uri": "Image must be a valid URL",
  }),

  description: Joi.string().allow(null, "").optional(),

  tax_applicable: Joi.boolean().default(false).messages({
    "boolean.base": "Tax applicable must be true or false",
  }),

  tax_percentage: Joi.when("tax_applicable", {
    is: true,
    then: Joi.number().min(0).max(100).required().messages({
      "number.base": "Tax percentage must be a number",
      "number.min": "Tax percentage cannot be negative",
      "number.max": "Tax percentage cannot exceed 100",
      "any.required": "Tax percentage is required when tax is applicable",
    }),
    otherwise: Joi.number().min(0).max(100).allow(null).optional(),
  }),

  is_active: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),

  image: Joi.string().uri().allow(null, "").optional(),

  description: Joi.string().allow(null, "").optional(),

  tax_applicable: Joi.boolean().optional(),

  tax_percentage: Joi.number().min(0).max(100).allow(null).optional(),

  is_active: Joi.boolean().optional(),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  sortBy: Joi.string()
    .valid("name", "created_at", "updated_at")
    .default("name"),

  order: Joi.string().valid("ASC", "DESC", "asc", "desc").default("ASC"),

  search: Joi.string().allow("").optional(),

  active: Joi.string().valid("true", "false").optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  querySchema,
};