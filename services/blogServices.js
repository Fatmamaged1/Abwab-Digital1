const { v4: uuidv4 } = require("uuid").v4;
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory");
const blogModel = require("../models/blogModel");
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
    .toFile(`uploads/blogs/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.image = filename;

  next();
});

// CRUD operations using factory pattern
exports.getBlogs = factory.getAll(blogModel, "blogs");
exports.getBlog = factory.getOne(blogModel);

exports.createBlog = factory.createOne(blogModel);
exports.updateBlog = factory.updateOne(blogModel);

exports.deleteBlog = factory.deleteOne(blogModel);
