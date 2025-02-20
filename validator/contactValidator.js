const mongoose = require("mongoose");
const { check, body, validationResult } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../middleware/validatorMiddleware");
const  contact= require("../models/contactModel"); // Replace with the actual path to your schema file


// Validation middleware for Contact schema
exports.createContactValidator = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),
  
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  
  check("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number format"),

  validatorMiddleware, // تمرير الأخطاء إلى الميدلوير النهائي
];

exports.getContactValidator = [
    check("id").isMongoId().withMessage("Invalid ID format"),
    validatorMiddleware,
  ];
  
  exports.updateContactValidator = [
    check("id").isMongoId().withMessage("Invalid ID format"),
    body("title")
      .optional()
      .custom((val, { req }) => {
        req.body.slug = slugify(val);
        return true;
      }),
    validatorMiddleware,
  ];
  
  exports.deleteContactValidator = [
    check("id").isMongoId().withMessage("Invalid ID format"),
    validatorMiddleware,
  ];
// Add a custom error formatter to provide more specific error messages
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      [error.param]: error.msg,
    }));

    return res.status(400).json({ errors: formattedErrors });
  }

  next();
};
