const { body, check } = require("express-validator");
const mongoose = require("mongoose");
const validatorMiddleware = require("../middleware/validatorMiddleware");
const Testimonial = require("../models/testimonialModel");

exports.createTestimonialValidator = [
  check("client")
    .isMongoId()
    .withMessage("Invalid Client ID format")
    .custom(async (value) => {
      // Check if the referenced client exists in the database
      const clientExists = await mongoose
        .model("Client")
        .exists({ _id: value });
      if (!clientExists) {
        throw new Error("Client not found");
      }
      return true;
    }),
  body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  body("content")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Content is required"),
  body("rating")
    .optional()
    .isNumeric()
    .withMessage("Rating should be a number"),
  body("icon").optional().isURL().withMessage("Invalid URL for icon"),
];

exports.updateTestimonialValidator = [
  check("id").isMongoId().withMessage("Invalid Testimonial ID format"),
  body("client")
    .optional()
    .isMongoId()
    .withMessage("Invalid Client ID format")
    .custom(async (value) => {
      if (value) {
        // Check if the referenced client exists in the database
        const clientExists = await mongoose
          .model("Client")
          .exists({ _id: value });
        if (!clientExists) {
          throw new Error("Client not found");
        }
      }
      return true;
    }),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Name is required"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Content is required"),
  body("rating")
    .optional()
    .isNumeric()
    .withMessage("Rating should be a number"),
  body("icon").optional().isURL().withMessage("Invalid URL for icon"),
  validatorMiddleware,
];
exports.getTestimonialValidator = [
  check("id").isMongoId().withMessage("Invalid Testimonial ID format"),
];


exports.deleteTestimonialValidator = [
  check("id").isMongoId().withMessage("Invalid Testimonial ID format"),
];
