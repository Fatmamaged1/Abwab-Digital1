const express = require("express");
const path = require("path");
const multer = require("multer");
const {
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
router.get("/", async (req, res) => {
  try {
    const contacts = await getContacts();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

// Get a specific contact by ID
router.get("/:id", getContact, async (req, res) => {
  try {
    const contact = await getContact(req.params.id);
    if (!contact) {
      res.status(404).json({ status: "error", message: "Contact not found" });
      return;
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

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
