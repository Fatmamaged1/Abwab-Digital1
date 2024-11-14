const Portfolio = require("../models/PortfolioModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

// Create a new portfolio item
exports.createPortfolioItem = async (req, res) => {
    try {
        const { name, description, startDate, endDate, category, client, status, budget, currency, teamMembers } = req.body;

        // Process uploaded files
        const images = req.files['images'] ? req.files['images'].map(file => ({
            url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || ''
        })) : [];

        const designScreens = {
            web: req.files['designScreens.web'] ? req.files['designScreens.web'].map(file => ({
                url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.caption || ''
            })) : [],
            app: req.files['designScreens.app'] ? req.files['designScreens.app'].map(file => ({
                url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.caption || ''
            })) : []
        };

        const newPortfolioItem = new Portfolio({
            name,
            description,
            startDate,
            endDate,
            images,
            designScreens,
            category,
            client,
            status,
            budget,
            currency,
            teamMembers
        });

        const savedItem = await newPortfolioItem.save();
        return res.status(201).json(formatSuccessResponse(savedItem, "Portfolio item created successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to create portfolio item", error.message));
    }
};

// Get all portfolio items
exports.getAllPortfolioItems = async (req, res) => {
    try {
        const items = await Portfolio.find().populate("teamMembers");
        return res.status(200).json(formatSuccessResponse(items, "Portfolio items retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio items", error.message));
    }
};

// Get a single portfolio item by ID
exports.getPortfolioItemById = async (req, res) => {
    try {
        const item = await Portfolio.findById(req.params.id).populate("teamMembers");
        if (!item) return res.status(404).json(formatErrorResponse("Portfolio item not found"));
        return res.status(200).json(formatSuccessResponse(item, "Portfolio item retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio item", error.message));
    }
};

// Update a portfolio item
exports.updatePortfolioItem = async (req, res) => {
    try {
        const { name, description, startDate, endDate, category, client, status, budget, currency, teamMembers } = req.body;

        const images = req.files['images'] ? req.files['images'].map(file => ({
            url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || ''
        })) : [];

        const designScreens = {
            web: req.files['designScreens.web'] ? req.files['designScreens.web'].map(file => ({
                url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.caption || ''
            })) : [],
            app: req.files['designScreens.app'] ? req.files['designScreens.app'].map(file => ({
                url: `http://localhost:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.caption || ''
            })) : []
        };

        const updatedItem = await Portfolio.findByIdAndUpdate(
            req.params.id,
            { name, description, startDate, endDate, images, designScreens, category, client, status, budget, currency, teamMembers },
            { new: true }
        ).populate("teamMembers");

        if (!updatedItem) return res.status(404).json(formatErrorResponse("Portfolio item not found"));
        return res.status(200).json(formatSuccessResponse(updatedItem, "Portfolio item updated successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to update portfolio item", error.message));
    }
};

// Delete a portfolio item
exports.deletePortfolioItem = async (req, res) => {
    try {
        const deletedItem = await Portfolio.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json(formatErrorResponse("Portfolio item not found"));
        return res.status(200).json(formatSuccessResponse(null, "Portfolio item deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to delete portfolio item", error.message));
    }
};
