const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const mongoose = require('mongoose');

/**
 * Validation rules for Agile project management routes
 */

// MongoDB ObjectId validator
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// ==================== PROJECT VALIDATORS ====================

exports.createProjectValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Project name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

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

  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid project status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),

  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

  body('teamMembers')
    .optional()
    .isArray().withMessage('Team members must be an array')
    .custom((value) => {
      if (!value.every(isValidObjectId)) {
        throw new Error('Invalid team member ID');
      }
      return true;
    }),

  validate
];

exports.updateProjectValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Project name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date'),

  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid project status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),

  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

  validate
];

exports.getProjectValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  validate
];

exports.deleteProjectValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  validate
];

// ==================== SPRINT VALIDATORS ====================

exports.createSprintValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Sprint name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Sprint name must be between 3 and 100 characters'),

  body('project')
    .notEmpty().withMessage('Project ID is required')
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('goal')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Goal must not exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed'])
    .withMessage('Invalid sprint status'),

  validate
];

exports.updateSprintValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid sprint ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Sprint name must be between 3 and 100 characters'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date'),

  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed'])
    .withMessage('Invalid sprint status'),

  validate
];

// ==================== STORY VALIDATORS ====================

exports.createStoryValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Story title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Story title must be between 5 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),

  body('sprint')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid sprint ID'),

  body('epic')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid epic ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),

  body('storyPoints')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),

  body('status')
    .optional()
    .isIn(['backlog', 'todo', 'in-progress', 'review', 'done'])
    .withMessage('Invalid story status'),

  body('assignee')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid assignee ID'),

  validate
];

exports.updateStoryValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid story ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Story title must be between 5 and 200 characters'),

  body('status')
    .optional()
    .isIn(['backlog', 'todo', 'in-progress', 'review', 'done'])
    .withMessage('Invalid story status'),

  body('storyPoints')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),

  validate
];

// ==================== EPIC VALIDATORS ====================

exports.createEpicValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Epic title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Epic title must be between 5 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),

  body('project')
    .notEmpty().withMessage('Project ID is required')
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  body('targetDate')
    .optional()
    .isISO8601().withMessage('Target date must be a valid date'),

  body('status')
    .optional()
    .isIn(['planned', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid epic status'),

  validate
];

exports.updateEpicValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid epic ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Epic title must be between 5 and 200 characters'),

  body('status')
    .optional()
    .isIn(['planned', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid epic status'),

  validate
];

// ==================== TASK VALIDATORS ====================

exports.createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Task title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('story')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid story ID'),

  body('assignedTo')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid assignee ID'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Invalid task status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Estimated hours must be between 0 and 1000'),

  validate
];

exports.updateTaskValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid task ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Task title must be between 3 and 200 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Invalid task status'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Estimated hours must be between 0 and 1000'),

  validate
];

// ==================== COMMON VALIDATORS ====================

exports.idValidator = [
  param('id')
    .custom(isValidObjectId).withMessage('Invalid ID'),

  validate
];

exports.queryValidator = [
  query('projectId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid project ID'),

  query('sprintId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid sprint ID'),

  query('epicId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid epic ID'),

  query('storyId')
    .optional()
    .custom(isValidObjectId).withMessage('Invalid story ID'),

  query('status')
    .optional()
    .trim(),

  validate
];

module.exports = exports;
