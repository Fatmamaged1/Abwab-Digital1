const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const ProjectModel = require("../models/projectModel"); // Updated import

// Middleware to upload project image
exports.uploadProjectImage = uploadSingleImage("image");

// Middleware to resize the uploaded image
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `project-${uuidv4()}-${Date.now()}.jpeg`;

  // Resize and save the image
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/projects/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.profileImage = filename;

  next();
});

// CRUD operations using factory pattern for Project
exports.getProjects = factory.getAll(ProjectModel, "Project");
exports.getProject = factory.getOne(ProjectModel, "Project");
exports.createProject = factory.createOne(ProjectModel, "Project");
exports.updateProject = factory.updateOne(ProjectModel, "Project");
exports.deleteProject = factory.deleteOne(ProjectModel, "Project");
