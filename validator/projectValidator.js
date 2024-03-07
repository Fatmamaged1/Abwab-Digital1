const { check, body, validationResult } = require("express-validator");
const validatorMiddleware = require("../middleware/validatorMiddleware");

// Validation for creating a project
exports.createProjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required and should not be empty"),
  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid startDate format"),
  body("images").optional().isArray().withMessage("Images should be an array"),
  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid endDate format"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("TeamMembers should be an array of Employee IDs"),
  body("budget")
    .optional()
    .isNumeric()
    .withMessage("Budget should be a number"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "RUB", "AED", "EGP", "SAR"])
    .withMessage("Invalid currency"),
  body("client").optional().isString().withMessage("Client should be a string"),
  body("status")
    .optional()
    .isIn(["Planning", "Development", "Testing", "Completed", "Other"])
    .withMessage("Invalid status"),
  validatorMiddleware, // Middleware to handle validation errors
];

// Validation for updating a project
exports.updateProjectValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name should not be empty"),
  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid startDate format"),
  body("images").optional().isArray().withMessage("Images should be an array"),
  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid endDate format"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("TeamMembers should be an array of Employee IDs"),
  body("budget")
    .optional()
    .isNumeric()
    .withMessage("Budget should be a number"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "RUB", "AED", "EGP", "SAR"])
    .withMessage("Invalid currency"),
  body("client").optional().isString().withMessage("Client should be a string"),
  body("status")
    .optional()
    .isIn(["Planning", "Development", "Testing", "Completed", "Other"])
    .withMessage("Invalid status"),
  validatorMiddleware,
];

// Validation for getting a client
exports.getProjectValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];

// Validation for deleting a project
exports.deleteProjectValidator = [
  body("id").isMongoId().withMessage("Invalid project ID"),
  validatorMiddleware,
];
exports.handleValidationErrors = (req, res, next) => {
  console.log("Handling Validation Errors");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      [error.param]: error.msg,
    }));

    return res.status(400).json({ errors: formattedErrors });
  }

  next();
};
