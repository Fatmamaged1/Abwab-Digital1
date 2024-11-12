// controllers/homeController.js
const Home = require('../models/homeModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Controller to create initial homepage data
exports.createHome = async (req, res) => {
  try {
    // Check if a Home document already exists
    const existingHome = await Home.findOne();
    if (existingHome) {
      return res.status(400).json(formatErrorResponse("Homepage data already exists"));
    }

    // Create a new Home document
    const homeData = new Home(req.body);
    const savedHomeData = await homeData.save();

    return res.status(201).json(formatSuccessResponse(savedHomeData, "Homepage data created successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error creating homepage data", error.message));
  }
};

// Controller to retrieve homepage data
exports.getHomeData = async (req, res) => {
  try {
    const homeData = await Home.findOne();
    if (!homeData) {
      return res.status(404).json(formatErrorResponse("Homepage data not found"));
    }
    return res.json(formatSuccessResponse(homeData, "Homepage data retrieved successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error retrieving homepage data", error.message));
  }
};

// Controller to update homepage data
exports.updateHomeData = async (req, res) => {
  try {
    let homeData = await Home.findOne();
    if (!homeData) {
      homeData = new Home(req.body); // Create a new document if none exists
    } else {
      homeData.set(req.body); // Update the existing document
    }
    const savedData = await homeData.save();
    return res.json(formatSuccessResponse(savedData, "Homepage data updated successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error updating homepage data", error.message));
  }
};
