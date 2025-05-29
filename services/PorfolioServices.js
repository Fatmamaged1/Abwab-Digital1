const Portfolio = require("../models/PortfolioModel"); 
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const { validationResult } = require("express-validator"); // For input validation
const slugify = require("slugify");

// Cache keys
const PORTFOLIO_ALL_KEY = "allPortfolioItems";
const PORTFOLIO_SINGLE_KEY = (id) => `portfolioItem:${id}`;
const BASE_URL = process.env.FILE_STORAGE_URL || "https://Backend.abwabdigital.com:4000/uploads/portfolio/";

exports.createPortfolioItem = async (req, res) => {
    try {
      console.log("Received Body:", req.body);
      console.log("Received Files:", req.files);
  
      const {
        name,
        description,
        projectName,
        category,
        client,
        platform,
        region,
        technologies,
        regionResponse,
        relatedProjects,
        url,
        status,
        screenTypes
      } = req.body;
  
      if (!name || !description) {
        return res.status(400).json(formatErrorResponse("Name and description are required"));
      }
  
      // Process SEO data from form-data.
      let parsedSeo = [];
      if (req.body.seo) {
        // Check if the SEO field is a string.
        if (typeof req.body.seo === "string") {
          try {
            parsedSeo = JSON.parse(req.body.seo);
            if (!Array.isArray(parsedSeo)) {
              parsedSeo = [parsedSeo];
            }
          } catch (error) {
            return res.status(400).json(formatErrorResponse("Invalid SEO data format", error.message));
          }
        } else if (typeof req.body.seo === "object") {
          // If it's already an object, ensure it's an array.
          parsedSeo = Array.isArray(req.body.seo) ? req.body.seo : [req.body.seo];
        }
      }
      // Ensure each SEO entry has required fields.
      parsedSeo = parsedSeo.map(entry => ({
        language: entry.language ? entry.language.trim() : "en",
        metaTitle: entry.metaTitle ? entry.metaTitle.trim() : (name || "Default Meta Title"),
        metaDescription: entry.metaDescription
          ? entry.metaDescription.trim()
          : (description ? description.substring(0, 160) : "Default SEO description"),
        keywords: entry.keywords ? entry.keywords.trim() : "default,service,seo",
        canonicalTag: entry.canonicalTag ? entry.canonicalTag.trim() : "",
        structuredData: entry.structuredData || {}
      }));
  
      // Process responsive fields
      const responsive = {
        image: req.body["responsive.image"] || (req.files?.["responsive.image"]?.[0]?.filename ? `${BASE_URL}${req.files["responsive.image"][0].filename}` : ""),
        description: req.body["responsive.description"] || "No description provided",
        title: req.body["responsive.title"] || "Untitled"
      };
  
      if (!responsive.image) {
        return res.status(400).json(formatErrorResponse("responsive.image is required. Please upload at least one image."));
      }
      if (!responsive.description) {
        return res.status(400).json(formatErrorResponse("responsive.description is required."));
      }
      if (!responsive.title) {
        return res.status(400).json(formatErrorResponse("responsive.title is required."));
      }
  
      // Process content fields
      const content = {
        en: {
          title: req.body.content?.en?.title || name || "Untitled",
          description: req.body.content?.en?.description || description || "No description available"
        },
        ar: {
          title: req.body.content?.ar?.title || req.body.nameAr || name || "بدون عنوان",
          description: req.body.content?.ar?.description || req.body.descriptionAr || description || "لا يوجد وصف"
        }
      };
  
      // Process hero data
      const hero = {
        title: req.body.hero?.title || req.body["hero.title"] || "Default Hero Title",
        description: req.body.hero?.description || req.body["hero.description"] || "Default Hero Description",
        region: req.body.hero?.region || req.body["hero.region"] || "Default Region",
        downloads: req.body.hero?.downloads || req.body["hero.downloads"] || 0,
        platforms: req.body.hero?.platforms || req.body["hero.platforms"] || [],
        tech: req.body.hero?.tech || []
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
        caption: req.body.caption || ''
      })) : [];
      if (!images.length) {
        return res.status(400).json(formatErrorResponse("At least one image is required."));
      }
  
      // Process designScreens (web and app)
      const designScreens = {
        web: req.files?.["designScreens.web"]?.map(file => ({
          url: `${BASE_URL}${file.filename}`,
          altText: file.originalname
        })) || [],
        app: req.files?.["designScreens.app"]?.map(file => ({
          url: `${BASE_URL}${file.filename}`,
          altText: file.originalname
        })) || []
      };
  
      // Process screenshots
      const screenshots = req.files?.screenshots ? req.files.screenshots.map(file => ({
        url: `${BASE_URL}${file.filename}`,
        altText: file.originalname
      })) : [];
  
      // Process hero.tech icons
      if (req.files?.["hero.tech[0].icon"]) {
        hero.tech = req.files["hero.tech[0].icon"].map(file => ({
          icon: `${BASE_URL}${file.filename}`
        }));
      }
  
      // Create new Portfolio item with SEO data from parsedSeo
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
        seo: parsedSeo,
        content,
        images,
        designScreens,
        screenshots,
        url: finalUrl,
        status,
        screenTypes,
        relatedProjects: relatedProjects || []
      });
  
      const savedItem = await newPortfolioItem.save();
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



exports.getAllPortfolioItems = async (req, res) => {
    try {
      // Extract requested language from query (default to "en")
      const language = req.query.language || "en";
  
      // Fetch portfolio items including the 'seo' field
      const items = await Portfolio.find().select("name description images category seo");
  
      // Process each item to retrieve SEO data for the requested language.
      const processedItems = items.map(item => {
        const obj = item.toObject();
        if (Array.isArray(obj.seo) && obj.seo.length > 0) {
          // Retrieve SEO data for requested language; fallback to first if not found.
          const seoData = obj.seo.find(seo => seo.language === language) || obj.seo[0];
          obj.seo = seoData;
        } else {
          // If no SEO data exists, you could either leave it empty or set default values.
          obj.seo = {
            language,
            metaTitle: "Default Meta Title",
            metaDescription: "Default meta description for the portfolio item.",
            keywords: "default,portfolio,seo",
            canonicalTag: "",
            structuredData: {}
          };
        }
        return obj;
      });
  
      // Optionally, you can also provide a "global" SEO object for the entire portfolio page.
      const globalSeo = {
        language,
        metaTitle: language === "en" ? "Our Portfolio" : "محفظتنا",
        metaDescription: language === "en"
          ? "Discover our diverse portfolio projects."
          : "اكتشف مشاريعنا المتنوعة.",
        keywords: language === "en" ? "portfolio, projects, design" : "محفظة, مشاريع, تصميم",
        canonicalTag: "",
        structuredData: {}
      };
  
      return res.status(200).json(
        formatSuccessResponse(
          { globalSeo, portfolioItems: processedItems },
          "Portfolio items retrieved successfully"
        )
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        formatErrorResponse("Failed to retrieve portfolio items", error.message)
      );
    }
  };
  
  


exports.getPortfolioItemById = async (req, res) => {
    try {
      // Extract requested language from query (default to "en")
      const language = req.query.language || "en";
  
      // Fetch the portfolio item and populate references
      const item = await Portfolio.findById(req.params.id).populate("hero category");
      if (!item) {
        return res.status(404).json(formatErrorResponse("Portfolio item not found"));
      }
  
      // Convert the document to a plain object
      const itemObj = item.toObject();
  
      // Retrieve SEO data for requested language, fallback to first if not found.
      if (Array.isArray(itemObj.seo) && itemObj.seo.length > 0) {
        const seoData = itemObj.seo.find(seo => seo.language === language) || itemObj.seo[0];
        itemObj.seo = seoData;
      } else {
        itemObj.seo = {};
      }
  
      // Fetch related projects with the same category, excluding the current item
      const relatedProjects = await Portfolio.find({
        category: item.category,
        _id: { $ne: item._id }
      }).select("name description images category")
        .sort({ createdAt: -1 })
        .limit(4);
  
      // Attach related projects to the item object
      const responseData = {
        ...itemObj,
        relatedProjects
      };
  
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
