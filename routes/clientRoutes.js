const express = require("express");
const path = require("path");
const multer = require("multer");
const {
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
router.get("/", async (req, res) => {
  try {
    const clients = await getClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

// Get a specific client by ID
router.get("/:id", getClient, async (req, res) => {
  try {
    const client = await getClient(req.params.id);
    if (!client) {
      res.status(404).json({ status: "error", message: "Client not found" });
      return;
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

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
