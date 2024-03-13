const express = require("express");
const path = require("path");
const multer = require("multer");
const { validationResult } = require('express-validator');
const ContactModel = require("../models/contactModel.js");

const {
  getContactValidator,
  createContactValidator,
  updateContactValidator,
  deleteContactValidator,
} = require("../validator/contactValidator"); // Import contact validators
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require("../services/contactServices"); // Import contact services

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/contact/"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profileImage-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// Error handling middleware
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: "error",
    errors: [{ field: "general", message: error.message }],
  });
});

// Create a contact with profile image upload
router.post(
  "/",

  createContactValidator,
  createContact
);

// Get all contacts
router.route("/").get(async (req, res, next) => {
  try {
    const contacts= await ContactModel.find();
    res.status(200).json({
      status: "success",
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

// Get a specific contact by ID
router.route("/:id").get(
  getContactValidator, // Assuming getContactValidator is your validation middleware
  async (req, res, next) => {
    // Check for validation errors from previous middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const contactId = req.params.id;

    try {
      // Fetch the contact based on the ID
      const contact = await ContactModel.findById(contactId);

      if (!contact) {
        return res.status(404).json({
          status: "error",
          errors: [{
            type: 'not_found',
            msg: 'Contact not found',
            path: 'id',
            value: contactId,
          }],
        });
      }

      res.status(200).json({
        status: "success",
        data: contact,
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({
        status: "error",
        errors: [{
          type: 'server_error',
          msg: `Error fetching contact: ${error.message}`,
          path: 'id',
          value: contactId,
        }],
      });
    }
  }
);


// Update a contact by ID
router.put("/:id", updateContactValidator, async (req, res) => {
  try {
    const updatedContact = await updateContact(req.params.id, req.body);
    if (!updatedContact) {
      res.status(404).json({ status: "error", message: "Contact not found" });
      return;
    }
    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { statusCode: 400, message: error.message },
    });
  }
});

// Delete a contact by ID
router.delete("/:id", deleteContactValidator, async (req, res) => {
  try {
    const deletedContact = await deleteContact(req.params.id);
    if (!deletedContact) {
      res.status(404).json({ status: "error", message: "Contact not found" });
      return;
    }
    res.json({ status: "success", message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: { statusCode: 500, message: error.message },
    });
  }
});

module.exports = router;
