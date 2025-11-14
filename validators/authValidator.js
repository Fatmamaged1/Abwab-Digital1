const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');

/**
 * Validation rules for authentication routes
 */

exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u0600-\u06FF]+$/).withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),

  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(['user', 'manager', 'admin', 'accountant', 'finance_manager', 'sales_manager', 'hr_manager', 'project_manager'])
    .withMessage('Invalid role'),

  validate
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),

  validate
];

exports.forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  validate
];

exports.resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('resetCode')
    .trim()
    .notEmpty().withMessage('Reset code is required')
    .isLength({ min: 4, max: 10 }).withMessage('Reset code must be between 4 and 10 characters'),

  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  validate
];

exports.changePasswordValidator = [
  body('currentPassword')
    .trim()
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),

  validate
];

exports.updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u0600-\u06FF]+$/).withMessage('Name can only contain letters and spaces'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Please provide a valid phone number'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  validate
];

module.exports = exports;
