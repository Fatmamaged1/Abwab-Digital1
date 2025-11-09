  const mongoose = require("mongoose");
  const { check, body, validationResult } = require("express-validator");
  const validatorMiddleware = require("../middleware/validatorMiddleware");

exports.createServicesValidator = [
  body("slug.en").optional().isString().withMessage("slug.en must be a string"),
  body("slug.ar").optional().isString().withMessage("slug.ar must be a string"),

  body("seo.language").optional().isIn(["en", "ar"]).withMessage("seo.language must be 'en' or 'ar'"),
  body("seo.metaTitle").optional().isString().withMessage("seo.metaTitle must be a string"),
  body("seo.metaDescription").optional().isString().withMessage("seo.metaDescription must be a string"),
  body("seo.keywords").optional().isString().withMessage("seo.keywords must be a string"),
  body("seo.canonicalTag").optional().isString().withMessage("seo.canonicalTag must be a string"),
  body("seo.structuredData").optional().custom(v => {
    if (typeof v === 'string') {
      try { const p = JSON.parse(v); return typeof p === 'object' && p !== null; } catch { return false; }
    }
    return typeof v === 'object';
  }).withMessage("seo.structuredData must be an object or JSON string of object"),

  // At least one of sections or implementProcess with non-empty array (after parsing) is required
  body().custom((_, { req }) => {
    const parseArr = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
      }
      return [];
    };
    const s = parseArr(req.body.sections);
    const ip = parseArr(req.body.implementProcess);
    if (!s.length && !ip.length) {
      throw new Error('At least one section or implement process is required');
    }
    return true;
  }),

  body("sections").optional().custom(v => {
    if (typeof v === 'string') { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }
    return Array.isArray(v);
  }).withMessage("sections must be an array or JSON string of array"),
  body("sections.*.title.en").optional().isString(),
  body("sections.*.title.ar").optional().isString(),
  body("sections.*.description.en").optional().isString(),
  body("sections.*.description.ar").optional().isString(),
  body("sections.*.image.url").optional().isString(),
  body("sections.*.image.alt.en").optional().isString(),
  body("sections.*.image.alt.ar").optional().isString(),
  body("sections.*.subsections").optional().custom(v => Array.isArray(v)).withMessage("sections.*.subsections must be an array"),
  body("sections.*.subsections.*.title.en").optional().isString(),
  body("sections.*.subsections.*.title.ar").optional().isString(),
  body("sections.*.subsections.*.description.en").optional().isString(),
  body("sections.*.subsections.*.description.ar").optional().isString(),
  body("sections.*.subsections.*.image.url").optional().isString(),
  body("sections.*.subsections.*.image.alt.en").optional().isString(),
  body("sections.*.subsections.*.image.alt.ar").optional().isString(),
  body("sections.*.order").optional().isNumeric(),
  body("sections.*.isActive").optional().isBoolean(),

  body("implementProcess").optional().custom(v => {
    if (typeof v === 'string') { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }
    return Array.isArray(v);
  }).withMessage("implementProcess must be an array or JSON string of array"),
  body("implementProcess.*.title.en").optional().isString(),
  body("implementProcess.*.title.ar").optional().isString(),
  body("implementProcess.*.description.en").optional().isString(),
  body("implementProcess.*.description.ar").optional().isString(),
  body("implementProcess.*.sections").optional().custom(v => Array.isArray(v)).withMessage("implementProcess.*.sections must be an array"),
  body("implementProcess.*.sections.*.title.en").optional().isString(),
  body("implementProcess.*.sections.*.title.ar").optional().isString(),
  body("implementProcess.*.sections.*.description.en").optional().isString(),
  body("implementProcess.*.sections.*.description.ar").optional().isString(),
  body("implementProcess.*.sections.*.image.url").optional().isString(),
  body("implementProcess.*.sections.*.image.alt.en").optional().isString(),
  body("implementProcess.*.sections.*.image.alt.ar").optional().isString(),
  body("implementProcess.*.sections.*.subsections").optional().isArray(),

  body("bannerImage.url").optional().isString(),
  body("bannerImage.alt.en").optional().isString(),
  body("bannerImage.alt.ar").optional().isString(),

  body("projects").optional().custom(v => {
    if (typeof v === 'string') { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }
    return Array.isArray(v);
  }).withMessage("projects must be an array or JSON string of array"),
  body("projects.*.projectId").optional().isMongoId().withMessage("projects.*.projectId must be a valid Mongo ID"),
  body("projects.*.name.en").optional().isString(),
  body("projects.*.name.ar").optional().isString(),
  body("projects.*.description.en").optional().isString(),
  body("projects.*.description.ar").optional().isString(),
  body("projects.*.image.url").optional().isString(),
  body("projects.*.image.alt.en").optional().isString(),
  body("projects.*.image.alt.ar").optional().isString(),
  body("projects.*.features").optional().isArray(),
  body("projects.*.features.*.en").optional().isString(),
  body("projects.*.features.*.ar").optional().isString(),
  body("projects.*.packages").optional().isArray(),
  body("projects.*.packages.*.title.en").optional().isString(),
  body("projects.*.packages.*.title.ar").optional().isString(),
  body("projects.*.packages.*.description.en").optional().isString(),
  body("projects.*.packages.*.description.ar").optional().isString(),
  body("projects.*.packages.*.price").optional().isString(),
  body("projects.*.packages.*.features").optional().isArray(),
  body("projects.*.packages.*.features.*.en").optional().isString(),
  body("projects.*.packages.*.features.*.ar").optional().isString(),

  body("packages").optional().custom(v => {
    if (typeof v === 'string') { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }
    return Array.isArray(v);
  }).withMessage("packages must be an array or JSON string of array"),
  body("packages.*.title.en").optional().isString(),
  body("packages.*.title.ar").optional().isString(),
  body("packages.*.description.en").optional().isString(),
  body("packages.*.description.ar").optional().isString(),
  body("packages.*.image.url").optional().isString(),
  body("packages.*.image.alt.en").optional().isString(),
  body("packages.*.image.alt.ar").optional().isString(),
  body("packages.*.price.amount").optional().isNumeric(),
  body("packages.*.price.currency").optional().isIn(["USD", "EUR", "RUB", "AED", "EGP", "SAR"]).withMessage("Invalid currency"),
  body("packages.*.price.period").optional().isIn(["month", "year", "one-time"]).withMessage("Invalid period"),
  body("packages.*.features").optional().isArray(),
  body("packages.*.features.*.en").optional().isString(),
  body("packages.*.features.*.ar").optional().isString(),
  body("packages.*.isPopular").optional().isBoolean(),
  body("packages.*.isActive").optional().isBoolean(),
  body("packages.*.order").optional().isNumeric(),

  body("faq").optional().custom(v => {
    if (typeof v === 'string') { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }
    return Array.isArray(v);
  }).withMessage("faq must be an array or JSON string of array"),
  body("faq.*.title.en").optional().isString(),
  body("faq.*.title.ar").optional().isString(),
  body("faq.*.description.en").optional().isString(),
  body("faq.*.description.ar").optional().isString(),
  body("faq.*.questions").optional().isArray(),
  body("faq.*.questions.*.question.en").optional().isString(),
  body("faq.*.questions.*.question.ar").optional().isString(),
  body("faq.*.questions.*.answer.en").optional().isString(),
  body("faq.*.questions.*.answer.ar").optional().isString(),
  body("faq.*.questions.*.order").optional().isNumeric(),
  body("faq.*.questions.*.isActive").optional().isBoolean(),

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
