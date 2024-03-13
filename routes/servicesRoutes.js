const express = require("express");
const path = require("path");
const multer = require("multer");
const { validationResult } = require('express-validator');
const AgencyModel = require("../models/servicesModel");
const ServicesModel = require("../models/servicesModel");
const {
  createServicesValidator,

  getServicesValidator,
  updateServicesValidator,
  deleteServicesValidator,
} = require("../validator/servicesValidator");

const {
  getServices,
  getService,
  createServices,
  updateServices,
  deleteServices,
} = require("../services/servicesServices");

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/blogs/"); // specify the folder where the uploaded files will be stored
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// Middleware functions


router.post(
  "/",
  upload.single("icon"),
  async (req, res, next) => {
    try {
      // Extract profile image filename from the multer upload
      req.body.icon = req.file ? req.file.filename : undefined;
      console.log("req.body", req.body);
      next();
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
  createServicesValidator,
  createServices
);
router.route("/:id").get(
  getServicesValidator, // Assuming getServicesValidator is your validation middleware
  async (req, res, next) => {
    // Check for validation errors from previous middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const serviceId = req.params.id;

    try {
      // Fetch the service based on the ID
      const service = await ServicesModel.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          status: "error",
          errors: [{
            type: 'not_found',
            msg: 'Service not found',
            path: 'id',
            value: serviceId,
          }],
        });
      }

      res.status(200).json({
        status: "success",
        data: service,
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        status: "error",
        errors: [{
          type: 'server_error',
          msg: `Error fetching service: ${error.message}`,
          path: 'id',
          value: serviceId,
        }],
      });
    }
  }
);


router.route("/").get(async (req, res, next) => {
  try {
    const services = await ServicesModel.find();
    res.status(200).json({
      status: "success",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

  

module.exports = router;
