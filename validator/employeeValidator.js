const { check, body } = require("express-validator");
const slugify = require("slugify");

// Import the Employee model
const EmployeeModel = require("../models/employeeModel");
const validatorMiddleware = require("../middleware/validatorMiddleware");

// Validation middleware for creating an employee
exports.createEmployeeValidator = [
  body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  body("position")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Position is required"),
  body("skills").optional().isArray().withMessage("Skills should be an array"),
  body("profileImage")
    .optional()
    .isURL()
    .withMessage("Invalid URL for profileImage"),
  body("hireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid hireDate format"),
  body("department")
    .optional()
    .isString()
    .withMessage("Department should be a string"),
  body("manager").optional().isMongoId().withMessage("Invalid manager ID"),
  validatorMiddleware,
];

// Validation middleware for updating an employee
exports.updateEmployeeValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Name is required"),
  body("position")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Position is required"),
  body("skills").optional().isArray().withMessage("Skills should be an array"),
  body("profileImage")
    .optional()
    .isURL()
    .withMessage("Invalid URL for profileImage"),
  body("hireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid hireDate format"),
  body("department")
    .optional()
    .isString()
    .withMessage("Department should be a string"),
  body("manager").optional().isMongoId().withMessage("Invalid manager ID"),
  validatorMiddleware,
];

// Validation middleware for deleting an employee
exports.deleteEmployeeValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];
