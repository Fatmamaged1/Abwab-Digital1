
const Portfolio = require("../models/PortfolioModel"); 
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const slugify = require("slugify");

const PORTFOLIO_ALL_KEY = "allPortfolioItems";
const PORTFOLIO_SINGLE_KEY = (id) => `portfolioItem:${id}`;
const BASE_URL = process.env.FILE_STORAGE_URL || "https://Backend.abwabdigital.com/uploads/portfolio/";

// Helper to parse JSON fields safely
const parseJSON = (data, defaultValue) => {
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error("❌ JSON parse error:", e.message);
    return defaultValue;
  }
};

const parseLocalizedField = (value, fallback = { ar: "", en: "" }) => {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value || fallback;
  } catch (err) {
    return fallback;
  }
};

// Create a portfolio item
exports.createPortfolioItem = async (req, res) => {
  try {
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      projectNameAr,
      projectNameEn,
      category,
      client,
      platform,
      region,
      technologies,
      regionResponse,
      relatedProjects,
      url,
      status,
      screenTypes,
      seo
    } = req.body;

    const parsedSeo = parseJSON(seo, []);

    const hero = {
      title: extractLocalizedField(req.body, "hero.title"),
      description: extractLocalizedField(req.body, "hero.description"),
      region: req.body["hero.region"] || "",
      downloads: Number(req.body["hero.downloads"] || 0),
      platforms: parseJSON(req.body["hero.platforms"], []),
      tech: req.files?.["hero.tech[0].icon"]
        ? req.files["hero.tech[0].icon"].map(file => ({
            icon: `${BASE_URL}${file.filename}`
          }))
        : []
    };
    
    const responsive = {
      title: extractLocalizedField(req.body, "responsive.title"),
      description: extractLocalizedField(req.body, "responsive.description"),
      image: req.body["responsive.image"] || (req.files?.["responsive.image"]?.[0]?.filename
        ? `${BASE_URL}${req.files["responsive.image"][0].filename}`
        : "")
    };
    
    const content = {
      en: {
        title: nameEn || "Untitled",
        description: descriptionEn || "No description available"
      },
      ar: {
        title: nameAr || "بدون عنوان",
        description: descriptionAr || "لا يوجد وصف"
      }
    };

    const images = req.files?.images ? req.files.images.map(file => ({
      url: `${BASE_URL}${file.filename}`,
      altText: file.originalname,
      caption: req.body.caption || ''
    })) : [];

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

    const screenshots = req.files?.screenshots ? req.files.screenshots.map(file => ({
      url: `${BASE_URL}${file.filename}`,
      altText: file.originalname
    })) : [];

    if (req.files?.["hero.tech[0].icon"]) {
      hero.tech = req.files["hero.tech[0].icon"].map(file => ({
        icon: `${BASE_URL}${file.filename}`
      }));
    }

    const newItem = new Portfolio({
      name: {
        ar: nameAr,
        en: nameEn
      },
      description: {
        ar: descriptionAr,
        en: descriptionEn
      },
      projectName: {
        ar: projectNameAr,
        en: projectNameEn
      },
      category,
      client,
      platform,
      region,
      technologies,
      regionResponse,
      content,
      seo: parsedSeo,
      url,
      status,
      screenTypes,
      hero,
      responsive,
      images,
      designScreens,
      screenshots,
      relatedProjects: relatedProjects || []
    });

    const savedItem = await newItem.save();
    await deleteCache(PORTFOLIO_ALL_KEY);

    return res.status(201).json(formatSuccessResponse(savedItem, "Portfolio item created successfully"));
  } catch (error) {
    console.error("Error creating portfolio item:", error);
    return res.status(500).json(formatErrorResponse("Failed to create portfolio item", error.message));
  }
};

// Update a portfolio item with multilingual support
exports.updatePortfolioItem = async (req, res) => {
  try {
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      projectNameAr,
      projectNameEn,
      category,
      client,
      platform,
      region,
      technologies,
      regionResponse,
      relatedProjects,
      url,
      status,
      screenTypes,
      seo
    } = req.body;

    const parsedSeo = parseJSON(seo, []);

    const content = {
      en: {
        title: nameEn || "Untitled",
        description: descriptionEn || "No description available"
      },
      ar: {
        title: nameAr || "بدون عنوان",
        description: descriptionAr || "لا يوجد وصف"
      }
    };

    const updatedItem = await Portfolio.findByIdAndUpdate(
      req.params.id,
      {
        name: {
          ar: nameAr,
          en: nameEn
        },
        description: {
          ar: descriptionAr,
          en: descriptionEn
        },
        projectName: {
          ar: projectNameAr,
          en: projectNameEn
        },
        category,
        client,
        platform,
        region,
        technologies,
        regionResponse,
        content,
        seo: parsedSeo,
        url,
        status,
        screenTypes,
        relatedProjects: relatedProjects || []
      },
      { new: true }
    ).populate("relatedProjects");

    if (!updatedItem) {
      return res.status(404).json(formatErrorResponse("Portfolio item not found"));
    }

    await setCache(PORTFOLIO_SINGLE_KEY(req.params.id), updatedItem);
    await deleteCache(PORTFOLIO_ALL_KEY);

    return res.status(200).json(formatSuccessResponse(updatedItem, "Portfolio item updated successfully"));
  } catch (error) {
    console.error("Error updating portfolio item:", error);
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
