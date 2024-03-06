const slugify = require("slugify");
const { check, body, validationResult } = require("express-validator");
const validatorMiddleware = require("../middleware/validatorMiddleware");

exports.getAllBlogsValidator = [
  check("page").optional().isInt(),
  check("limit").optional().isInt(),
  validatorMiddleware,
];
exports.createBlogValidator = [
  check("title")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters")
    .notEmpty()
    .withMessage("Title is required")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("description")
    .notEmpty()
    .withMessage("Blog description is required")
    .isLength({ max: 20000000 })
    .withMessage("Too long description"),
  validatorMiddleware,
];

exports.getBlogValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];

exports.updateBlogValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  body("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteBlogValidator = [
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
