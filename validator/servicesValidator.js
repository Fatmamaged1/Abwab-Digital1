const mongoose = require("mongoose");
const { check, body, validationResult } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../middleware/validatorMiddleware");
const  service= require("../models/servicesModel"); 

exports.createServicesValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Service name is required")
    .isString()
    .withMessage("Service name must be a string"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Service description is required")
    .isString()
    .withMessage("Service description must be a string"),
  body("technologies")
    .optional()
    .isArray()
    .withMessage("Technologies must be an array of strings"),
  body("team.projectManagers")
    .optional()
    .isArray()
    .withMessage("Project Managers must be an array of employee IDs"),
  body("team.developers")
    .optional()
    .isArray()
    .withMessage("Developers must be an array of employee IDs"),
  body("team.designers")
    .optional()
    .isArray()
    .withMessage("Designers must be an array of employee IDs"),
  body("team.testers")
    .optional()
    .isArray()
    .withMessage("Testers must be an array of employee IDs"),
  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid start date"),
  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid end date"),
  body("status")
    .optional()
    .isIn(["Pending", "Active", "Completed"])
    .withMessage("Invalid status"),
  body("client").optional().isMongoId().withMessage("Invalid client ID"),
  validatorMiddleware,
];
exports.createClientValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Client name is required")
    .isString()
    .withMessage("Client name must be a string"),
  body("industry")
    .optional()
    .isString()
    .withMessage("Industry must be a string"),
  body("contacts")
    .optional()
    .isArray()
    .withMessage("Contacts must be an array of contact IDs"),
  body("projects")
    .optional()
    .isArray()
    .withMessage("Projects must be an array of service IDs"),
  validatorMiddleware,
];
exports.createContactValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Contact name is required")
    .isString()
    .withMessage("Contact name must be a string"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Contact email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("phone").optional().isString().withMessage("Phone must be a string"),
  validatorMiddleware,
];

exports.getServicesValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];

exports.updateServicesValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  body("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteServicesValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];

// Add a custom error formatter to provide more specific error messages
exports.handleValidationErrors = (req, res, next) => {
  console.error(req.body);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      [error.param]: error.msg,
    }));

    return res.status(400).json({ errors: formattedErrors });
  }

  next();
};
