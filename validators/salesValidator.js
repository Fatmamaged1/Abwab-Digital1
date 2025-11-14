const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

/**
 * Validation rules for Sales/CRM routes
 */

// ==================== LEAD VALIDATORS ====================

exports.createLeadValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Lead name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Lead name must be between 2 and 200 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Please provide a valid phone number'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),

  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'])
    .withMessage('Invalid lead status'),

  body('source')
    .optional()
    .isIn(['website', 'referral', 'social-media', 'email-campaign', 'cold-call', 'other'])
    .withMessage('Invalid lead source'),

  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated value must be a positive number'),

  body('assignedTo')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid assignee ID'),

  validate
];

exports.updateLeadValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid lead ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Lead name must be between 2 and 200 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'])
    .withMessage('Invalid lead status'),

  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated value must be a positive number'),

  validate
];

// ==================== OPPORTUNITY VALIDATORS ====================

exports.createOpportunityValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Opportunity title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),

  body('lead')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid lead ID'),

  body('value')
    .notEmpty().withMessage('Opportunity value is required')
    .isFloat({ min: 0 }).withMessage('Value must be a positive number'),

  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),

  body('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'])
    .withMessage('Invalid opportunity stage'),

  body('expectedCloseDate')
    .optional()
    .isISO8601().withMessage('Expected close date must be a valid date'),

  body('assignedTo')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid assignee ID'),

  validate
];

exports.updateOpportunityValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid opportunity ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),

  body('value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Value must be a positive number'),

  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),

  body('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'])
    .withMessage('Invalid opportunity stage'),

  validate
];

// ==================== ACTIVITY VALIDATORS ====================

exports.createActivityValidator = [
  body('type')
    .trim()
    .notEmpty().withMessage('Activity type is required')
    .isIn(['call', 'email', 'meeting', 'note', 'task'])
    .withMessage('Invalid activity type'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Activity subject is required')
    .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('leadId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid lead ID'),

  body('opportunityId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid opportunity ID'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date'),

  body('status')
    .optional()
    .isIn(['planned', 'completed', 'cancelled'])
    .withMessage('Invalid activity status'),

  validate
];

exports.updateActivityValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid activity ID'),

  body('subject')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters'),

  body('status')
    .optional()
    .isIn(['planned', 'completed', 'cancelled'])
    .withMessage('Invalid activity status'),

  validate
];

// ==================== CAMPAIGN VALIDATORS ====================

exports.createCampaignValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Campaign name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Campaign name must be between 3 and 200 characters'),

  body('type')
    .optional()
    .isIn(['email', 'social-media', 'ads', 'event', 'content', 'other'])
    .withMessage('Invalid campaign type'),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed'])
    .withMessage('Invalid campaign status'),

  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('targetAudience')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Target audience must not exceed 500 characters'),

  validate
];

exports.updateCampaignValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid campaign ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Campaign name must be between 3 and 200 characters'),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed'])
    .withMessage('Invalid campaign status'),

  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

  validate
];

// ==================== COMMON VALIDATORS ====================

exports.idValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid ID'),

  validate
];

exports.queryValidator = [
  query('leadId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid lead ID'),

  query('opportunityId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid opportunity ID'),

  query('status')
    .optional()
    .trim(),

  query('type')
    .optional()
    .trim(),

  validate
];

module.exports = exports;
