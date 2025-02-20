const Portfolio = require("../models/PortfolioModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const slugify = require("slugify");

// Cache keys
const PORTFOLIO_ALL_KEY = "allPortfolioItems";
const PORTFOLIO_SINGLE_KEY = (id) => `portfolioItem:${id}`;

// Create a new portfolio item with SEO support
exports.createPortfolioItem = async (req, res) => {
    try {
        const { name, description, category, client, platform, region, technologies, content } = req.body;

        // SEO Fields
        const seo = {
            metaTitle: req.body.metaTitle || name,
            metaDescription: req.body.metaDescription || description.substring(0, 160),
            canonical: req.body.canonical || "",
        };

        // SEO-Friendly URL (slug)
        const url = slugify(name, { lower: true, strict: true });

        // Process uploaded images
        const images = req.files?.images ? req.files.images.map(file => ({
            url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || '',
        })) : [];

        // Process design screens for web and app
        const designScreensProcessed = {
            web: req.files?.['designScreens.web'] ? req.files['designScreens.web'].map(file => ({
                url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.webDesignCaption || '',
            })) : [],
            app: req.files?.['designScreens.app'] ? req.files['designScreens.app'].map(file => ({
                url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.appDesignCaption || '',
            })) : [],
        };

        // Process screenshots
        const screenshots = req.files?.screenshots ? req.files.screenshots.map(file => ({
            url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
        })) : [];

        console.log('Files received:', req.files);  // Debugging line

        const newPortfolioItem = new Portfolio({
            name,
            description,
            category,
            client,
            platform,
            region,
            technologies,
            content: {
                en: {
                    title: name,
                    description,
                },
                ar: {
                    title: req.body.nameAr || name,  // Arabic translation
                    description: req.body.descriptionAr || description,
                },
            },
            seo,
            url,
            images,
            designScreens: designScreensProcessed,
            screenshots,
            relatedProjects: req.body.relatedProjects || [],
        });

        const savedItem = await newPortfolioItem.save();

        // Clear the cache
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
            return res.status(200).json(formatSuccessResponse(cachedItems, "Portfolio items retrieved from cache"));
        }

        const items = await Portfolio.find().populate("relatedProjects");
        await setCache(PORTFOLIO_ALL_KEY, items);

        return res.status(200).json(formatSuccessResponse(items, "Portfolio items retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio items", error.message));
    }
};

// Get a single portfolio item with caching
exports.getPortfolioItemById = async (req, res) => {
    const cacheKey = PORTFOLIO_SINGLE_KEY(req.params.id);
    try {
        const cachedItem = await getCache(cacheKey);
        if (cachedItem) {
            return res.status(200).json(formatSuccessResponse(cachedItem, "Portfolio item retrieved from cache"));
        }

        const item = await Portfolio.findById(req.params.id).populate("relatedProjects");
        if (!item) return res.status(404).json(formatErrorResponse("Portfolio item not found"));

        await setCache(cacheKey, item);

        return res.status(200).json(formatSuccessResponse(item, "Portfolio item retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio item", error.message));
    }
};

// Update a portfolio item with SEO updates
exports.updatePortfolioItem = async (req, res) => {
    try {
        const { name, description, category, client, platform, region, technologies, content, designScreens } = req.body;

        // Update SEO data
        const seo = {
            metaTitle: req.body.metaTitle || name,
            metaDescription: req.body.metaDescription || description.substring(0, 160),
            canonical: req.body.canonical || "",
        };

        // SEO-Friendly URL (slug)
        const url = slugify(name, { lower: true, strict: true });

        // Process images
        const images = req.files?.images ? req.files.images.map(file => ({
            url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || '',
        })) : [];

        // Process design screens for web and app
        const designScreensProcessed = {
            web: req.files?.webDesign ? req.files.webDesign.map(file => ({
                url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.webDesignCaption || '',
            })) : [],
            app: req.files?.appDesign ? req.files.appDesign.map(file => ({
                url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
                altText: file.originalname,
                caption: req.body.appDesignCaption || '',
            })) : [],
        };

        // Process screenshots
        const screenshots = req.files?.screenshots ? req.files.screenshots.map(file => ({
            url: `http://91.108.102.81:4000/uploads/portfolio/${file.filename}`,
            altText: file.originalname,
        })) : [];

        const updatedItem = await Portfolio.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                category,
                client,
                platform,
                region,
                technologies,
                content: {
                    en: {
                        title: name,
                        description,
                    },
                    ar: {
                        title: req.body.nameAr || name,
                        description: req.body.descriptionAr || description,
                    },
                },
                seo,
                url,
                images,
                designScreens: designScreensProcessed,
                screenshots,
                relatedProjects: req.body.relatedProjects || [],
            },
            { new: true }
        ).populate("relatedProjects");

        if (!updatedItem) return res.status(404).json(formatErrorResponse("Portfolio item not found"));

        // Update cache
        await setCache(PORTFOLIO_SINGLE_KEY(req.params.id), updatedItem);
        await deleteCache(PORTFOLIO_ALL_KEY);

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

        // Clear cache
        await deleteCache(PORTFOLIO_SINGLE_KEY(req.params.id));
        await deleteCache(PORTFOLIO_ALL_KEY);

        return res.status(200).json(formatSuccessResponse(null, "Portfolio item deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to delete portfolio item", error.message));
    }
};
