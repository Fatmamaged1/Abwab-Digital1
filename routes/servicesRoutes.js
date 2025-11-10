const express = require("express");
const { check } = require("express-validator");
const upload = require("../middleware/upload");
const serviceController = require("../controllers/servicesController");
const { protect } = require("../middleware/auth");
const router = express.Router();

// Common upload configuration
const serviceUpload = upload.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "sectionImages", maxCount: 10 },
  { name: "importanceImages", maxCount: 10 },  
  { name: "implementProcessImages", maxCount: 20 },
  { name: "packageImages", maxCount: 10 }
]);

// Public routes
router.get("/", serviceController.getAllServices);
router.get("/slug/:slug", serviceController.getServiceBySlug);
router.get("/:id", serviceController.getServiceById);
router.get("/details/:id", serviceController.getAllServicesDataById); // Changed from /All/:id to /details/:id

// Protected routes
router.use(protect);

router.post(
  "/",
  serviceUpload,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ],
  serviceController.createService
);


router.patch(
  "/:id",
  serviceUpload,
  [
    check('title', 'Title cannot be empty').optional().not().isEmpty(),
    check('description', 'Description cannot be empty').optional().not().isEmpty()
  ],
  serviceController.updateService
);

router.delete("/:id", serviceController.deleteService);

module.exports = router;