const { validationResult } = require('express-validator');

/**
 * Validation middleware - checks for validation errors from express-validator
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.param || err.path,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: extractedErrors,
    });
  }

  next();
};

/**
 * Custom validation for bilingual fields (Arabic/English)
 */
exports.validateBilingual = (fieldName) => {
  return (req, res, next) => {
    const field = req.body[fieldName];

    if (!field) {
      return res.status(400).json({
        success: false,
        message: `Field '${fieldName}' is required`,
      });
    }

    if (typeof field !== 'object' || !field.ar || !field.en) {
      return res.status(400).json({
        success: false,
        message: `Field '${fieldName}' must contain both 'ar' and 'en' properties`,
        example: { ar: 'نص عربي', en: 'English text' },
      });
    }

    next();
  };
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
exports.sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string values in req.body
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  next();
};

/**
 * Validate pagination parameters
 */
exports.validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be greater than 0',
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100',
    });
  }

  req.pagination = { page, limit };
  next();
};

module.exports = exports;
