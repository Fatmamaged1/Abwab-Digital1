const slugify = require("slugify");
const { check, body, validationResult } = require("express-validator");
const validatorMiddleware = require("../middleware/validatorMiddleware");

exports.getAllTechnologiesValidator = [
  check("page").optional().isInt(),
  check("limit").optional().isInt(),
  validatorMiddleware,
];
exports.getTechnologyValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];

exports.createTechnologyValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("category")
    .optional()
    .isIn(["Backend", "Frontend", "Mobile", "Database", "DevOps", "Other"])
    .withMessage("Invalid category"),
  body("version")
    .optional()
    .matches(/^[0-9]+\.[0-9]+\.[0-9]+$/)
    .withMessage("Invalid version format"),
  body("releaseDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid release date"),
  body("documentation")
    .optional()
    .isString()
    .withMessage("Documentation must be a string"),
  body("contributors")
    .optional()
    .isArray()
    .withMessage("Contributors must be an array"),
  body("contributors.*.name")
    .optional()
    .isString()
    .withMessage("Contributor name must be a string"),
  body("contributors.*.email")
    .optional()
    .isEmail()
    .withMessage("Invalid contributor email"),
  body("contributors.*.role")
    .optional()
    .isIn(["Developer", "Designer", "Tester", "Other"])
    .withMessage("Invalid contributor role"),
  body("dependencies")
    .optional()
    .isArray()
    .withMessage("Dependencies must be an array"),
  body("frameworks")
    .optional()
    .isArray()
    .withMessage("Frameworks must be an array"),
  body("languages")
    .optional()
    .isArray()
    .withMessage("Languages must be an array"),
  body("platforms")
    .optional()
    .isArray()
    .withMessage("Platforms must be an array"),
  body("repositories")
    .optional()
    .isArray()
    .withMessage("Repositories must be an array"),
  body("repositories.*.name")
    .optional()
    .isString()
    .withMessage("Repository name must be a string"),
  body("repositories.*.url")
    .optional()
    .isURL()
    .withMessage("Invalid repository URL"),
  body("repositories.*.type")
    .optional()
    .isIn(["Git", "SVN", "Mercurial", "Other"])
    .withMessage("Invalid repository type"),
  body("popularity")
    .optional()
    .isObject()
    .withMessage("Popularity must be an object"),
  body("popularity.rank")
    .optional()
    .isInt()
    .withMessage("Popularity rank must be an integer"),
  body("popularity.stars")
    .optional()
    .isInt()
    .withMessage("Stars must be an integer"),
  body("popularity.forks")
    .optional()
    .isInt()
    .withMessage("Forks must be an integer"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("projects")
    .optional()
    .isArray()
    .withMessage("Projects must be an array"),
  body("projects.*.name")
    .optional()
    .isString()
    .withMessage("Project name must be a string"),
  body("projects.*.startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid project start date"),
  body("projects.*.endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid project end date"),
  body("projects.*.teamMembers")
    .optional()
    .isArray()
    .withMessage("Team members must be an array"),
  body("projects.*.budget")
    .optional()
    .isNumeric()
    .withMessage("Budget must be a number"),
  body("projects.*.client")
    .optional()
    .isString()
    .withMessage("Client must be a string"),
  body("projects.*.status")
    .optional()
    .isIn(["Planning", "Development", "Testing", "Completed", "Other"])
    .withMessage("Invalid project status"),
  body("employees")
    .optional()
    .isArray()
    .withMessage("Employees must be an array"),
  body("employees.*.name")
    .optional()
    .isString()
    .withMessage("Employee name must be a string"),
  body("employees.*.position")
    .optional()
    .isString()
    .withMessage("Employee position must be a string"),
  body("employees.*.skills")
    .optional()
    .isArray()
    .withMessage("Employee skills must be an array"),
  body("employees.*.profileImage")
    .optional()
    .isString()
    .withMessage("Employee profile image must be a string"),
  body("employees.*.hireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid hire date"),
  body("employees.*.department")
    .optional()
    .isString()
    .withMessage("Employee department must be a string"),
  body("employees.*.manager")
    .optional()
    .isMongoId()
    .withMessage("Invalid manager ID"),
  body("lastUpdated")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid last updated date"),
  body("license").optional().isString().withMessage("License must be a string"),
  body("website").optional().isURL().withMessage("Invalid website URL"),
  body("community")
    .optional()
    .isString()
    .withMessage("Community must be a string"),
  body("rating").optional().isNumeric().withMessage("Rating must be a number"),
  body("tutorials")
    .optional()
    .isArray()
    .withMessage("Tutorials must be an array"),
  body("compatibility")
    .optional()
    .isArray()
    .withMessage("Compatibility must be an array"),
  body("usageExamples")
    .optional()
    .isArray()
    .withMessage("Usage examples must be an array"),
  body("relatedTechnologies")
    .optional()
    .isArray()
    .withMessage("Related technologies must be an array"),
  body("relatedTechnologies.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid related technology ID"),
  validatorMiddleware,
];

exports.updateTechnologyValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  body("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];
exports.deleteTechnologyValidator = [
  check("id").isMongoId().withMessage("Invalid ID format"),
  validatorMiddleware,
];
