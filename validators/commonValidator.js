const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

/**
 * Common validation rules used across multiple routes
 */

// ==================== ID VALIDATORS ====================

exports.mongoIdValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid ID format'),

  validate
];

exports.multipleIdsValidator = [
  body('ids')
    .isArray({ min: 1 }).withMessage('IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every(isValidObjectId)) {
        throw new Error('One or more invalid IDs');
      }
      return true;
    }),

  validate
];

// ==================== PAGINATION VALIDATORS ====================

exports.paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .trim()
    .matches(/^-?[a-zA-Z0-9_.]+$/).withMessage('Invalid sort format'),

  validate
];

// ==================== SEARCH VALIDATORS ====================

exports.searchValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Search query must be between 1 and 200 characters'),

  query('fields')
    .optional()
    .trim(),

  validate
];

// ==================== DATE RANGE VALIDATORS ====================

exports.dateRangeValidator = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  validate
];

// ==================== FILE UPLOAD VALIDATORS ====================

exports.imageUploadValidator = [
  body('file')
    .optional()
    .custom((value, { req }) => {
      if (!req.file) return true;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('File must be an image (JPEG, PNG, GIF, or WebP)');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('Image size must not exceed 5MB');
      }

      return true;
    }),

  validate
];

exports.documentUploadValidator = [
  body('file')
    .optional()
    .custom((value, { req }) => {
      if (!req.file) return true;

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('File must be a document (PDF, DOC, DOCX, XLS, or XLSX)');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        throw new Error('Document size must not exceed 10MB');
      }

      return true;
    }),

  validate
];

// ==================== EMAIL VALIDATORS ====================

exports.emailValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),

  validate
];

exports.emailArrayValidator = [
  body('emails')
    .isArray({ min: 1 }).withMessage('Emails must be a non-empty array')
    .custom((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.every(email => emailRegex.test(email))) {
        throw new Error('One or more invalid email addresses');
      }
      return true;
    }),

  validate
];

// ==================== STATUS VALIDATORS ====================

exports.statusValidator = (allowedStatuses) => [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(allowedStatuses).withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),

  validate
];

// ==================== BILINGUAL FIELD VALIDATORS ====================

exports.bilingualFieldValidator = (fieldName, required = true) => [
  body(fieldName)
    .custom((value, { req }) => {
      if (!value && required) {
        throw new Error(`${fieldName} is required`);
      }

      if (value) {
        if (typeof value !== 'object') {
          throw new Error(`${fieldName} must be an object with 'ar' and 'en' properties`);
        }

        if (!value.ar || !value.en) {
          throw new Error(`${fieldName} must contain both 'ar' (Arabic) and 'en' (English) values`);
        }

        if (typeof value.ar !== 'string' || typeof value.en !== 'string') {
          throw new Error(`Both 'ar' and 'en' must be strings`);
        }
      }

      return true;
    }),

  validate
];

// ==================== CUSTOM FIELD VALIDATORS ====================

exports.phoneValidator = [
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Please provide a valid phone number')
    .isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters'),

  validate
];

exports.urlValidator = [
  body('url')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid URL'),

  validate
];

exports.slugValidator = [
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase letters, numbers, and hyphens only'),

  validate
];

// ==================== ARRAY VALIDATORS ====================

exports.tagsValidator = [
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((value) => {
      if (!value.every(tag => typeof tag === 'string' && tag.trim().length > 0)) {
        throw new Error('All tags must be non-empty strings');
      }
      if (value.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      return true;
    }),

  validate
];

// ==================== NUMBER VALIDATORS ====================

exports.positiveNumberValidator = (fieldName) => [
  body(fieldName)
    .optional()
    .isFloat({ min: 0 }).withMessage(`${fieldName} must be a positive number`),

  validate
];

exports.percentageValidator = (fieldName) => [
  body(fieldName)
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage(`${fieldName} must be between 0 and 100`),

  validate
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a custom validator for ObjectId fields
 */
exports.createObjectIdValidator = (fieldName, required = false) => {
  const validator = body(fieldName);

  if (required) {
    return [
      validator
        .notEmpty().withMessage(`${fieldName} is required`)
        .custom(isValidObjectId).withMessage(`Invalid ${fieldName}`),
      validate
    ];
  }

  return [
    validator
      .optional()
      .custom(isValidObjectId).withMessage(`Invalid ${fieldName}`),
    validate
  ];
};

/**
 * Create a custom enum validator
 */
exports.createEnumValidator = (fieldName, allowedValues, required = false) => {
  const validator = body(fieldName);

  if (required) {
    return [
      validator
        .notEmpty().withMessage(`${fieldName} is required`)
        .isIn(allowedValues).withMessage(`${fieldName} must be one of: ${allowedValues.join(', ')}`),
      validate
    ];
  }

  return [
    validator
      .optional()
      .isIn(allowedValues).withMessage(`${fieldName} must be one of: ${allowedValues.join(', ')}`),
    validate
  ];
};

/**
 * Create a custom length validator
 */
exports.createLengthValidator = (fieldName, min, max, required = false) => {
  const validator = body(fieldName).trim();

  if (required) {
    return [
      validator
        .notEmpty().withMessage(`${fieldName} is required`)
        .isLength({ min, max }).withMessage(`${fieldName} must be between ${min} and ${max} characters`),
      validate
    ];
  }

  return [
    validator
      .optional()
      .isLength({ min, max }).withMessage(`${fieldName} must be between ${min} and ${max} characters`),
    validate
  ];
};

module.exports = exports;
