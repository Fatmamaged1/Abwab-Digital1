const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const ClientModel = require("../models/clientModel"); // Updated import

// Middleware to upload client image
exports.uploadClientImage = uploadSingleImage("image");

// Middleware to resize the uploaded image
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `client-${uuidv4()}-${Date.now()}.jpeg`;

  // Resize and save the image
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/clients/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.profileImage = filename;

  next();
});

// CRUD operations using factory pattern for Client
exports.getClients = factory.getAll(ClientModel, "Client");
exports.getClient = factory.getOne(ClientModel, "Client");
exports.createClient = factory.createOne(ClientModel, "Client");
exports.updateClient = factory.updateOne(ClientModel, "Client");
exports.deleteClient = factory.deleteOne(ClientModel, "Client");
