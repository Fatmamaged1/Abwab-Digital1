const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const serviceController = require("../services/servicesServices");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/services")); // Dynamic path
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

// Validation middleware (example for title and description)
const validateServiceInput = (req, res, next) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Title and description are required.",
    });
  }

  next();
};

// Define routes
router.get("/", serviceController.getAllServices); // Get all services
router.get("/:id", serviceController.getServiceById); // Get service by ID

router.post(
  "/",
  upload.fields([
    { name: "icon", maxCount: 10 },
    { name: "image", maxCount: 10 },
  ]),
  validateServiceInput, // Validate required fields
  serviceController.createService
);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 }, // Upload image
    { name: "icon", maxCount: 1 }, // Upload icon
  ]),
  validateServiceInput, // Validate input
  serviceController.updateService
);

router.delete("/:id", serviceController.deleteService); // Delete service

module.exports = router;
