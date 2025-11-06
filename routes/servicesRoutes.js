const express = require("express");
const upload = require("../middleware/upload");
const serviceController = require("../services/servicesServices");

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "sectionImages", maxCount: 10 },      // For header sections
    { name: "importanceImages", maxCount: 10 },   // For importance sections
    { name: "implementProcessImages", maxCount: 20 },
    { name: "packageImages", maxCount: 10 }
  ]),
  serviceController.createService
);

// Get all services
router.get("/", serviceController.getAllServices);
router.get('/slug/:slug', serviceController.getServiceBySlug);

// Get service by ID
router.get("/:id", serviceController.getServiceById);
router.get("/All/:id", serviceController.getAllServicesDataById);

// Delete a service
router.delete("/:id", serviceController.deleteService);
// Update service with multiple image types
router.patch("/:id", upload.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "sectionImages", maxCount: 10 }, // Support up to 10 section images
  { name: "implementProcessImages", maxCount: 20 }, // Support up to 20 process images (4 processes × 5 sections each)
  { name: "packageImages", maxCount: 10 }, // Support up to 10 package images
]), serviceController.updateService);
module.exports = router;
