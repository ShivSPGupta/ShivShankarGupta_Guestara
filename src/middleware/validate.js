/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[property];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

module.exports = validate;
