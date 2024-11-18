const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const serviceController = require("../services/servicesServices");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/services");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

// Define routes
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  serviceController.createService
);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  serviceController.updateService
);

router.delete("/:id", serviceController.deleteService);

module.exports = router;
