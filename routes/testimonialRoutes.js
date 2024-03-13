const express = require("express");
const multer = require("multer");
const path = require("path");
const { validationResult } = require('express-validator');
const TestimonialModel = require("../models/testimonialModel.js");
const {
  getTestimonialValidator,
  createTestimonialValidator,
  updateTestimonialValidator,
  deleteTestimonialValidator,
} = require("../validator/testimonialValidator"); // Import testimonial validators
const {
  getTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../services/testimonialServices"); // Import testimonial services

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/testimonials/"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "icon-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// Error handling middleware
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: "error" + error.statusCode,
    errors: [{ field: "general", message: error.message }],
    data: req.body,
  });
});

// Create a testimonial
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
  createTestimonialValidator,
  createTestimonial
);

// Get all testimonials
router.route("/").get(async (req, res, next) => {
  try {
    const testimonials= await TestimonialModel.find();
    res.status(200).json({
      status: "success",
      data: testimonials,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

// Get a specific testimonial by ID
router.route("/:id").get(
  getTestimonialValidator, // Assuming getTestimonialValidator is your validation middleware
  async (req, res, next) => {
    // Check for validation errors from previous middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const testimonialId = req.params.id;

    try {
      // Fetch the testimonial based on the ID
      const testimonial = await TestimonialModel.findById(testimonialId);

      if (!testimonial) {
        return res.status(404).json({
          status: "error",
          errors: [{
            type: 'not_found',
            msg: 'Testimonial not found',
            path: 'id',
            value: testimonialId,
          }],
        });
      }

      res.status(200).json({
        status: "success",
        data: testimonial,
      });
    } catch (error) {
      console.error("Error fetching testimonial:", error);
      res.status(500).json({
        status: "error",
        errors: [{
          type: 'server_error',
          msg: `Error fetching testimonial: ${error.message}`,
          path: 'id',
          value: testimonialId,
        }],
      });
    }
  }
);


// Update a testimonial by ID
router.put("/:id", updateTestimonialValidator, async (req, res) => {
  try {
    const updatedTestimonial = await updateTestimonial(req.params.id, req.body);
    if (!updatedTestimonial) {
      res
        .status(404)
        .json({ status: "error", message: "Testimonial not found" });
      return;
    }
    res.json(updatedTestimonial);
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { statusCode: 400, message: error.message },
    });
  }
});

// Delete a testimonial by ID
router.delete("/:id", deleteTestimonialValidator, async (req, res) => {
  try {
    const deletedTestimonial = await deleteTestimonial(req.params.id);
    if (!deletedTestimonial) {
      res
        .status(404)
        .json({ status: "error", message: "Testimonial not found" });
      return;
    }
    res.json({
      status: "success",
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: { statusCode: 500, message: error.message },
    });
  }
});

module.exports = router;
