const Joi = require("joi");

// Pricing config schemas for different pricing types

const staticPricingSchema = Joi.object({
  base_price: Joi.number().min(0).required().messages({
    "number.base": "Base price must be a number",
    "number.min": "Base price cannot be negative",
    "any.required": "Base price is required for static pricing",
  }),
});

const tieredPricingSchema = Joi.object({
  tiers: Joi.array()
    .items(
      Joi.object({
        max_units: Joi.number().min(0).required().messages({
          "any.required": "Max units is required for each tier",
        }),
        price: Joi.number().min(0).required().messages({
          "any.required": "Price is required for each tier",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one tier is required for tiered pricing",
      "any.required": "Tiers array is required for tiered pricing",
    }),
});

const complimentaryPricingSchema = Joi.object({});

const discountedPricingSchema = Joi.object({
  base_price: Joi.number().min(0).required().messages({
    "any.required": "Base price is required for discounted pricing",
  }),
  discount: Joi.object({
    type: Joi.string().valid("percentage", "flat").required().messages({
      "any.only": 'Discount type must be either "percentage" or "flat"',
      "any.required": "Discount type is required",
    }),
    value: Joi.number().min(0).required().messages({
      "any.required": "Discount value is required",
    }),
  }).required(),
});

const dynamicPricingSchema = Joi.object({
  time_windows: Joi.array()
    .items(
      Joi.object({
        start: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .messages({
            "string.pattern.base": "Start time must be in HH:MM format",
            "any.required": "Start time is required",
          }),
        end: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .messages({
            "string.pattern.base": "End time must be in HH:MM format",
            "any.required": "End time is required",
          }),
        price: Joi.number().min(0).required().messages({
          "any.required": "Price is required for each time window",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one time window is required",
      "any.required": "Time windows array is required for dynamic pricing",
    }),
});

// Main item schemas

const createItemSchema = Joi.object({
  category_id: Joi.number().integer().allow(null).optional(),

  subcategory_id: Joi.number().integer().allow(null).optional(),

  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Item name is required",
    "any.required": "Item name is required",
  }),

  description: Joi.string().allow(null, "").optional(),

  image: Joi.string().uri().allow(null, "").optional(),

  pricing_type: Joi.string()
    .valid("static", "tiered", "complimentary", "discounted", "dynamic")
    .required()
    .messages({
      "any.only":
        "Pricing type must be one of: static, tiered, complimentary, discounted, dynamic",
      "any.required": "Pricing type is required",
    }),

  pricing_config: Joi.when("pricing_type", {
    switch: [
      { is: "static", then: staticPricingSchema },
      { is: "tiered", then: tieredPricingSchema },
      { is: "complimentary", then: complimentaryPricingSchema },
      { is: "discounted", then: discountedPricingSchema },
      { is: "dynamic", then: dynamicPricingSchema },
    ],
  }).required(),

  tax_applicable: Joi.boolean().allow(null).optional(),

  tax_percentage: Joi.number().min(0).max(100).allow(null).optional(),

  is_bookable: Joi.boolean().default(false),

  availability_config: Joi.when("is_bookable", {
    is: true,
    then: Joi.object({
      days: Joi.array()
        .items(
          Joi.string().valid(
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          )
        )
        .optional(),
      time_slots: Joi.array()
        .items(
          Joi.object({
            start: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required(),
            end: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required(),
          })
        )
        .optional(),
    }).allow(null),
    otherwise: Joi.any().allow(null),
  }),

  is_active: Joi.boolean().default(true),

  addons: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(null, "").optional(),
        price: Joi.number().min(0).required(),
        is_mandatory: Joi.boolean().default(false),
      })
    )
    .optional(),
}).custom((value, helpers) => {
  // Custom validation: must have either category_id OR subcategory_id, not both
  if (!value.category_id && !value.subcategory_id) {
    return helpers.error("any.invalid", {
      message: "Item must belong to either category or subcategory",
    });
  }
  if (value.category_id && value.subcategory_id) {
    return helpers.error("any.invalid", {
      message: "Item cannot belong to both category and subcategory",
    });
  }
  return value;
});

const updateItemSchema = Joi.object({
  category_id: Joi.number().integer().allow(null).optional(),
  subcategory_id: Joi.number().integer().allow(null).optional(),
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().allow(null, "").optional(),
  image: Joi.string().uri().allow(null, "").optional(),
  pricing_type: Joi.string()
    .valid("static", "tiered", "complimentary", "discounted", "dynamic")
    .optional(),
  pricing_config: Joi.object().optional(),
  tax_applicable: Joi.boolean().allow(null).optional(),
  tax_percentage: Joi.number().min(0).max(100).allow(null).optional(),
  is_bookable: Joi.boolean().optional(),
  availability_config: Joi.object().allow(null).optional(),
  is_active: Joi.boolean().optional(),
});

const priceQuerySchema = Joi.object({
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "Time must be in HH:MM format",
    }),

  duration: Joi.number().min(0).optional(),

  units: Joi.number().min(0).optional(),

  addons: Joi.alternatives()
    .try(Joi.array().items(Joi.number().integer()), Joi.string())
    .optional(),
});

const itemQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string()
    .valid("name", "created_at", "updated_at")
    .default("name"),
  order: Joi.string().valid("ASC", "DESC", "asc", "desc").default("ASC"),
  search: Joi.string().allow("").optional(),
  category_id: Joi.number().integer().optional(),
  subcategory_id: Joi.number().integer().optional(),
  pricing_type: Joi.string()
    .valid("static", "tiered", "complimentary", "discounted", "dynamic")
    .optional(),
  active: Joi.string().valid("true", "false").optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  priceQuerySchema,
  itemQuerySchema,
};
