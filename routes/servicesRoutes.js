const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const serviceController = require("../services/servicesServices");

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/services"); // Save files to 'uploads/services'
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// CRUD routes with image upload support
router.post("/", upload.array("images", 5), serviceController.createService);
router.put("/:id", upload.array("images", 5), serviceController.updateService);
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);
router.delete("/:id", serviceController.deleteService);

module.exports = router;
