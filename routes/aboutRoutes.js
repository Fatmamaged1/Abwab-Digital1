const express = require("express");
const {
  getAllAbout,
  getAboutById,
  createOrUpdateAbout,
  deleteAboutById,
  updateAboutById,
} = require("../services/aboutServices");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = "uploads/about";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = file.originalname.replace(/\s+/g, "-"); // Replace spaces with dashes
    cb(null, `${uniqueSuffix}-${originalName}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Routes
router.get("/", getAllAbout); // Get all about page data
router.get("/:id", getAboutById); // Get about page data by ID

// Upload fields dynamically
router.post(
  "/",
  upload.fields([
    { name: "hero", maxCount: 1 }, // Main image
    { name: "values[0][icon]", maxCount: 1 },
    { name: "values[1][icon]", maxCount: 1 },
    { name: "values[2][icon]", maxCount: 1 },
    { name: "features[0][icon]", maxCount: 1 },
    { name: "features[1][icon]", maxCount: 1 },
    { name: "features[2][icon]", maxCount: 1 },
    { name: "features[3][icon]", maxCount: 1 },
    { name: "features[4][icon]", maxCount: 1 }
  ]),
  createOrUpdateAbout
); // Create or update about page

router.put(
  "/:id",
  upload.fields([
    { name: "hero", maxCount: 1 },
    { name: "values[0][icon]", maxCount: 1 },
    { name: "values[1][icon]", maxCount: 1 },
    { name: "values[2][icon]", maxCount: 1 },
    { name: "features[0][icon]", maxCount: 1 },
    { name: "features[1][icon]", maxCount: 1 },
    { name: "features[2][icon]", maxCount: 1 },
    { name: "features[3][icon]", maxCount: 1 },
    { name: "features[4][icon]", maxCount: 1 }
  ]),
  updateAboutById
); // Update specific about page by ID

router.delete("/:id", deleteAboutById); // Delete about page by ID

module.exports = router;
