const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const ContactModel = require("../models/contactModel.js"); // Updated import

// Middleware to upload contact image
exports.uploadContactImage = uploadSingleImage("image");

// Middleware to resize the uploaded image
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `contact-${uuidv4()}-${Date.now()}.jpeg`;

  // Resize and save the image
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/contacts/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.profileImage = filename;

  next();
});

// CRUD operations using factory pattern for Contact
exports.getContacts = factory.getAll(ContactModel, "Contact");
exports.getContact = factory.getOne(ContactModel, "Contact");

exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // حفظ جهة الاتصال في قاعدة البيانات
    const newContact = await ContactModel.create({ name, email, phone, message });

    res.status(201).json({
      status: "success",
      data: newContact,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
exports.updateContact = factory.updateOne(ContactModel, "Contact");
exports.deleteContact = factory.deleteOne(ContactModel, "Contact");
