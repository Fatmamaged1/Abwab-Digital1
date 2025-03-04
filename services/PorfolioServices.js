const Portfolio = require("../models/PortfolioModel"); 
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const { validationResult } = require("express-validator"); // For input validation
const slugify = require("slugify");

// Cache keys
const PORTFOLIO_ALL_KEY = "allPortfolioItems";
const PORTFOLIO_SINGLE_KEY = (id) => `portfolioItem:${id}`;
const BASE_URL = process.env.FILE_STORAGE_URL || "http://91.108.102.81:4000/uploads/portfolio/";

exports.createPortfolioItem = async (req, res) => {
    try {
        console.log("Received Body:", req.body);
        console.log("Received Files:", req.files);

        const { name, description, projectName, category, client, platform, region, technologies, regionResponse, relatedProjects, url, status, screenTypes } = req.body;

        if (!name || !description) {
            return res.status(400).json(formatErrorResponse("Name and description are required"));
        } const seo = {
            metaTitle: req.body.metaTitle || name,
            metaDescription: req.body.metaDescription || description?.substring(0, 160) || "Default SEO description",
            canonical: req.body.canonical || "",
        };

        const responsive = {
            image: req.body["responsive.image"] || (req.files?.["responsive.image"]?.[0]?.filename ? `${BASE_URL}${req.files["responsive.image"][0].filename}` : ""),
            description: req.body["responsive.description"] || "No description provided",
            title: req.body["responsive.title"] || "Untitled",
        };
        
        // Ensure required fields are present
        if (!responsive.image) {
            return res.status(400).json(formatErrorResponse("responsive.image is required. Please upload at least one image."));
        }
        
        if (!responsive.description) {
            return res.status(400).json(formatErrorResponse("responsive.description is required."));
        }
        
        if (!responsive.title) {
            return res.status(400).json(formatErrorResponse("responsive.title is required."));
        };
        
        const content = {
            en: {
                title: req.body.content?.en?.title || name || "Untitled",
                description: req.body.content?.en?.description || description || "No description available",
            },
            ar: {
                title: req.body.content?.ar?.title || req.body.nameAr || name || "بدون عنوان",
                description: req.body.content?.ar?.description || req.body.descriptionAr || description || "لا يوجد وصف",
            },
        };

        const hero = {
            title: req.body.hero?.title || req.body["hero.title"] || "Default Hero Title",
            description: req.body.hero?.description || req.body["hero.description"] || "Default Hero Description",
            region: req.body.hero?.region || req.body["hero.region"] || "Default Region",
            downloads: req.body.hero?.downloads || req.body["hero.downloads"] || 0,
            platforms: req.body.hero?.platforms || req.body["hero.platforms"] || [],
            tech: req.body.hero?.tech || [],
        };

        console.log("Final Hero Object:", hero);

        if (!hero.title || !hero.description || !hero.region) {
            return res.status(400).json(formatErrorResponse("Hero fields (title, description, region) are required."));
        }

        const finalUrl = url || (req.files?.images?.[0]?.url || "");
        if (!finalUrl) {
            return res.status(400).json(formatErrorResponse("A valid URL is required."));
        }

        // Process uploaded images
        const images = req.files?.images ? req.files.images.map(file => ({
            url: `${BASE_URL}${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || '',
        })) : [];

        if (!images.length) {
            return res.status(400).json(formatErrorResponse("At least one image is required."));
        }

        // Process designScreens (web and app)
        const designScreens = {
            web: req.files?.["designScreens.web"]?.map(file => ({
                url: `${BASE_URL}${file.filename}`,
                altText: file.originalname,
            })) || [],
            app: req.files?.["designScreens.app"]?.map(file => ({
                url: `${BASE_URL}${file.filename}`,
                altText: file.originalname,
            })) || [],
        };

        // Process screenshots
        const screenshots = req.files?.screenshots ? req.files.screenshots.map(file => ({
            url: `${BASE_URL}${file.filename}`,
            altText: file.originalname,
        })) : [];

        // Process hero.tech icons
        if (req.files?.["hero.tech[0].icon"]) {
            hero.tech = req.files["hero.tech[0].icon"].map(file => ({
                icon: `${BASE_URL}${file.filename}`,
            }));
        }

        const newPortfolioItem = new Portfolio({
            name,
            description,
            projectName,
            category,
            client,
            platform,
            region,
            technologies,
            hero,
            regionResponse,
            responsive,
            seo,
            content,
            images,
            designScreens,
            screenshots,
            url: finalUrl,
            status,
            screenTypes,
            relatedProjects: relatedProjects || [],
        });

        const savedItem = await newPortfolioItem.save();

        // Clear cache
        await deleteCache("PORTFOLIO_ALL_KEY");

        return res.status(201).json(formatSuccessResponse(savedItem, "Portfolio item created successfully"));
    } catch (error) {
        console.error("Portfolio Creation Error:", error);
        return res.status(500).json(formatErrorResponse("Failed to create portfolio item", error.message));
    }
};


// Update a portfolio item with SEO updates
exports.updatePortfolioItem = async (req, res) => {
    try {
        const { name, description, projectName, category, client, platform, region, technologies, content, hero, regionResponse } = req.body;

        // Update SEO data
        const seo = {
            metaTitle: req.body.metaTitle || name,
            metaDescription: req.body.metaDescription || description,
            canonical: req.body.canonical || "",
        };

        // SEO-Friendly URL (slug)
     //   const url = slugify(name, { lower: true, strict: true });

        const updatedItem = await Portfolio.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                projectName,
                category,
                client,
                platform,
                region,
                technologies,
                hero,
                regionResponse,
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



// Get all portfolio items with caching
exports.getAllPortfolioItems = async (req, res) => {
    try {
        // Fetch portfolio items with only hero and category fields
        const items = await Portfolio.find()
            .select("name description images category"); // Select only hero and category fields
           // Populate if they are references

        return res.status(200).json(formatSuccessResponse(items, "Portfolio items retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio items", error.message));
    }
};


exports.getPortfolioItemById = async (req, res) => {
    //const cacheKey = PORTFOLIO_SINGLE_KEY(req.params.id);
    try {
      

        // Fetch the portfolio item
        const item = await Portfolio.findById(req.params.id).populate("hero category");
        if (!item) return res.status(404).json(formatErrorResponse("Portfolio item not found"));

        // Fetch related projects with the same category, excluding the current item
        const relatedProjects = await Portfolio.find({
            category: item.category, // Match category
            _id: { $ne: item._id } // Exclude the current item
        }).select("name description images category"); // Select necessary fields

        // Attach related projects to the item
        const responseData = {
            ...item.toObject(),
            relatedProjects
        };

        // Cache the response
       // await setCache(cacheKey, responseData);

        return res.status(200).json(formatSuccessResponse(responseData, "Portfolio item retrieved successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to retrieve portfolio item", error.message));
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
