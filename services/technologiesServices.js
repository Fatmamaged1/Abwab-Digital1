const { v4: uuidv4 } = require("uuid").v4;
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const TechnologyModel = require("../models/technologiesModel.js");
exports.uploadBlogImage = uploadSingleImage("image");

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
    .toFile(`uploads/technologies/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.image = filename;

  next();
});

// CRUD operations using factory pattern
exports.getTechnologies = factory.getAll(TechnologyModel, "technology");
exports.getTechnology = factory.getOne(TechnologyModel,"technology");

exports.createTechnology = factory.createOne(TechnologyModel,"technology");
exports.updateTechnology= factory.updateOne(TechnologyModel,"technology");

exports.deleteTechnology = factory.deleteOne(TechnologyModel,"technology");