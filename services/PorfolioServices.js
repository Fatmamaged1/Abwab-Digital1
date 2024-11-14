const Portfolio = require("../models/PortfolioModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Cache keys
const PORTFOLIO_ALL_KEY = "allPortfolioItems";
const PORTFOLIO_SINGLE_KEY = id => `portfolioItem:${id}`;

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

        // Clear the cached list of all portfolio items since a new one was added
        await deleteCache(PORTFOLIO_ALL_KEY);

        return res.status(201).json(formatSuccessResponse(savedItem, "Portfolio item created successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to create portfolio item", error.message));
    }
};

// Get all portfolio items with caching
exports.getAllPortfolioItems = async (req, res) => {
    try {
        const cachedItems = await getCache(PORTFOLIO_ALL_KEY);
        if (cachedItems) {
            return res.status(200).json(formatSuccessResponse(cachedItems, "Portfolio items retrieved successfully from cache"));
        }

        const items = await Portfolio.find().populate("teamMembers");
        await setCache(PORTFOLIO_ALL_KEY, items);  // Cache the result

        return res.status(200).json(formatSuccessResponse(items, "Portfolio items retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio items", error.message));
    }
};

// Get a single portfolio item by ID with caching
exports.getPortfolioItemById = async (req, res) => {
    const cacheKey = PORTFOLIO_SINGLE_KEY(req.params.id);
    try {
        const cachedItem = await getCache(cacheKey);
        if (cachedItem) {
            return res.status(200).json(formatSuccessResponse(cachedItem, "Portfolio item retrieved successfully from cache"));
        }

        const item = await Portfolio.findById(req.params.id).populate("teamMembers");
        if (!item) return res.status(404).json(formatErrorResponse("Portfolio item not found"));

        await setCache(cacheKey, item);  // Cache the result

        return res.status(200).json(formatSuccessResponse(item, "Portfolio item retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio item", error.message));
    }
};

// Update a portfolio item and clear relevant caches
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

        // Update the cache
        await setCache(PORTFOLIO_SINGLE_KEY(req.params.id), updatedItem);
        await deleteCache(PORTFOLIO_ALL_KEY); // Clear cached list of all items

        return res.status(200).json(formatSuccessResponse(updatedItem, "Portfolio item updated successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to update portfolio item", error.message));
    }
};

// Delete a portfolio item and clear relevant caches
exports.deletePortfolioItem = async (req, res) => {
    try {
        const deletedItem = await Portfolio.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json(formatErrorResponse("Portfolio item not found"));

        // Clear caches related to this item
        await deleteCache(PORTFOLIO_SINGLE_KEY(req.params.id));
        await deleteCache(PORTFOLIO_ALL_KEY);

        return res.status(200).json(formatSuccessResponse(null, "Portfolio item deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to delete portfolio item", error.message));
    }
};
