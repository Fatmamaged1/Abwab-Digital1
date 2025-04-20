const express = require("express");
const upload = require("../middleware/upload");
const serviceController = require("../services/servicesServices");

const router = express.Router();

// Accept multiple files for icons
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "techUsedInServiceIcons", maxCount: 5 },
    { name: "distingoshesUsIcons", maxCount: 5 },
    { name: "designPhaseImage", maxCount: 1 },
  ]),
  serviceController.createService
);

// Get all services
router.get("/", serviceController.getAllServices);

// Get service by ID
router.get("/:id", serviceController.getServiceById);

// Delete a service
router.delete("/:id", serviceController.deleteService);
// update service
router.put("/:id", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "techUsedInServiceIcons", maxCount: 5 },
  { name: "distingoshesUsIcons", maxCount: 5 },
  { name: "designPhaseImage", maxCount: 1 },
]), serviceController.updateService);
module.exports = router;
