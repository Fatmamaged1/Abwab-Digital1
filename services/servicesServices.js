const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const AgencyModel = require("../models/servicesModel.js");
//const blogModel = require("../models/blogModel.js"); // This line is unnecessary if not used

// Assume you have a 'ServicesModel' imported from somewhere
const ServicesModel = require("../models/servicesModel.js"); // Replace with the correct path and file name

// Middleware to upload blog image
exports.uploadServicesImage = uploadSingleImage("image");

// Middleware to resize the uploaded image
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `blog-${uuidv4()}-${Date.now()}.jpeg`;

  // Resize and save the image
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/blogs/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.image = filename;

  next();
});

// CRUD operations using factory pattern
exports.getServices = factory.getAll(AgencyModel, "Agency");
exports.getService = factory.getOne(AgencyModel, "Agency");
exports.createServices = factory.createOne(AgencyModel, "Agency");
exports.updateServices = factory.updateOne(AgencyModel, "Agency");
exports.deleteServices = factory.deleteOne(AgencyModel, "Agency");