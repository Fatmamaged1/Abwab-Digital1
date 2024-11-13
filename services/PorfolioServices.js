const Portfolio = require("../models/PortfolioModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

// Create a new portfolio item
exports.createPortfolioItem = async (req, res) => {
  try {
    const { title, description, category, client, startDate, endDate } =
      req.body;

    // If images are uploaded as URLs, use req.body. Otherwise, handle file upload
      // Map files to generate URLs
      const images = req.files.map(file => ({
        url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
        altText: file.originalname,
        caption: req.body.caption || 'Default caption', // Optional caption if needed
    })); // Assuming images array is sent as URLs

    const newPortfolioItem = new Portfolio({
      title,
      description,
      images,
      category,
      client,
      startDate,
      endDate,
    });
    const savedItem = await newPortfolioItem.save();
    return res
      .status(201)
      .json(
        formatSuccessResponse(savedItem, "Portfolio item created successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        formatErrorResponse("Failed to create portfolio item", error.message)
      );
  }
};

// Get all portfolio items
exports.getAllPortfolioItems = async (req, res) => {
  try {
    const items = await Portfolio.find();
    return res
      .status(200)
      .json(
        formatSuccessResponse(items, "Portfolio items retrieved successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        formatErrorResponse("Failed to retrieve portfolio items", error.message)
      );
  }
};

// Get a single portfolio item by ID
exports.getPortfolioItemById = async (req, res) => {
  try {
    const item = await Portfolio.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json(formatErrorResponse("Portfolio item not found"));
    return res
      .status(200)
      .json(
        formatSuccessResponse(item, "Portfolio item retrieved successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        formatErrorResponse("Failed to retrieve portfolio item", error.message)
      );
  }
};

// Update a portfolio item
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { title, description, category, client, startDate, endDate } =
      req.body;
    const images = req.body.images || [];

    const updatedItem = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { title, description, images, category, client, startDate, endDate },
      { new: true }
    );

    if (!updatedItem)
      return res
        .status(404)
        .json(formatErrorResponse("Portfolio item not found"));
    return res
      .status(200)
      .json(
        formatSuccessResponse(
          updatedItem,
          "Portfolio item updated successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        formatErrorResponse("Failed to update portfolio item", error.message)
      );
  }
};

// Delete a portfolio item
exports.deletePortfolioItem = async (req, res) => {
  try {
    const deletedItem = await Portfolio.findByIdAndDelete(req.params.id);
    if (!deletedItem)
      return res
        .status(404)
        .json(formatErrorResponse("Portfolio item not found"));
    return res
      .status(200)
      .json(formatSuccessResponse(null, "Portfolio item deleted successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        formatErrorResponse("Failed to delete portfolio item", error.message)
      );
  }
};
