const express = require("express");
const path = require("path");
const multer = require("multer");
const { validationResult } = require('express-validator');
const ClientModel =require("../models/clientModel");
const {
  getClientValidator,
  createClientValidator,
  updateClientValidator,
  deleteClientValidator,
} = require("../validator/clientValidator"); // Import client validators
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require("../services/clientServices"); // Import client services

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/client/"));
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

// Create a client with profile image upload
router.post(
  "/",
  upload.single("profileImage"),
  async (req, res, next) => {
    try {
      // Extract profile image filename from the multer upload
      req.body.profileImage = req.file ? req.file.filename : undefined;
      next();
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
  createClientValidator,
  createClient
);

// Get all clients
router.route("/").get(async (req, res, next) => {
  try {
    const clients = await ClientModel.find();
    res.status(200).json({
      status: "success",
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

// Get a specific client by ID
router.route("/:id").get(
  getClientValidator, // Assuming getClientValidator is your validation middleware
  async (req, res, next) => {
    // Check for validation errors from previous middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const clientId = req.params.id;

    try {
      // Fetch the client based on the ID
      const client = await ClientModel.findById(clientId);

      if (!client) {
        return res.status(404).json({
          status: "error",
          errors: [{
            type: 'not_found',
            msg: 'Client not found',
            path: 'id',
            value: clientId,
          }],
        });
      }

      res.status(200).json({
        status: "success",
        data: client,
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({
        status: "error",
        errors: [{
          type: 'server_error',
          msg: `Error fetching client: ${error.message}`,
          path: 'id',
          value: clientId,
        }],
      });
    }
  }
);


// Update a client by ID
router.put("/:id", updateClientValidator, async (req, res) => {
  try {
    const updatedClient = await updateClient(req.params.id, req.body);
    if (!updatedClient) {
      res.status(404).json({ status: "error", message: "Client not found" });
      return;
    }
    res.json(updatedClient);
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { statusCode: 400, message: error.message },
    });
  }
});

// Delete a client by ID
router.delete("/:id", deleteClientValidator, async (req, res) => {
  try {
    const deletedClient = await deleteClient(req.params.id);
    if (!deletedClient) {
      res.status(404).json({ status: "error", message: "Client not found" });
      return;
    }
    res.json({ status: "success", message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: { statusCode: 500, message: error.message },
    });
  }
});

module.exports = router;
