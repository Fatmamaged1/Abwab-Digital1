const express = require('express');
const path = require('path');
const multer = require('multer');
const { validationResult } = require('express-validator');
const technologyModel=require("../models/technologiesModel")
const router = express.Router();
const {
  getTechnologyValidator,
  createTechnologyValidator,
  updateTechnologyValidator,
  deleteTechnologyValidator,
} = require('../validator/technologiesValidator');
const {
  getTechnologies,
  getTechnology,
  createTechnology,
  updateTechnology,
  deleteTechnology,
} = require('../services/technologiesServices');
//const technologiesModel = require('../models/technologiesModel');

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/blogs/'));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });




// Other routes...

// Error handling middleware
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: 'error',
    errors: [{ field: 'general', message: error.message }],
  });
});
// Create a technology
router.post('/', createTechnologyValidator,createTechnology );

// Get a technology by ID
router.get("/:id", getTechnologyValidator, async (req, res, next) => {
  try {
    const technologyId = req.params.id;
    // Fetch the technology based on the ID
    const technology = await technologyModel.findById(technologyId);
    if (!technology) {
      return res.status(404).json({
        status: "error",
        errors: [{
          type: 'not_found',
          msg: 'Technology not found',
          path: 'id',
          value: technologyId,
        }],
      });
    }
    res.status(200).json({
      status: "success",
      data: technology,
    });
  } catch (error) {
    console.error("Error fetching technology:", error);
    res.status(500).json({
      status: "error",
      errors: [{
        type: 'server_error',
        msg: `Error fetching technology: ${error.message}`,
        path: 'id',
        value: req.params.id,
      }],
    });
  }
});

// Get all technologies
router.get("/", async (req, res, next) => {
  try {
    const technologies = await technologyModel.find();
    res.status(200).json({
      status: "success",
      data: technologies,
    });
  } catch (error) {
    console.error("Error fetching technologies:", error);
    res.status(500).json({
      status: "error",
      errors: [{
        type: 'server_error',
        msg: `Error fetching technologies: ${error.message}`,
      }],
    });
  }
});



// Update a technology by ID
router.put('/:id',  updateTechnologyValidator, async (req, res) => {
  try {
    const updatedTechnology = await updateTechnology(req.params.id, req.body);
    if (!updatedTechnology) {
      res.status(404).json({ status: 'error', message: 'Technology not found' });
      return;
    }
    res.json(updatedTechnology);
  } catch (error) {
    res.status(400).json({ status: 'error', error: { statusCode: 400, message: error.message } });
  }
});

// Delete a technology by ID
router.delete('/:id', deleteTechnologyValidator, async (req, res) => {
  try {
    const deletedTechnology = await deleteTechnology(req.params.id);
    if (!deletedTechnology) {
      res.status(404).json({ status: 'error', message: 'Technology not found' });
      return;
    }
    res.json({ status: 'success', message: 'Technology deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: { statusCode: 500, message: error.message } });
  }
});

module.exports = router;
