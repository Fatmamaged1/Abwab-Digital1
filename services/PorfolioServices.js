
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
const extractLocalizedField = (body, prefix) => {
  return {
    en: body[`${prefix}.en`] || '',
    ar: body[`${prefix}.ar`] || ''
  };
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
console.log(req.body);

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
    const body = req.body;

    // دعم الأسماء الثنائية (dot notation)
    const nameEn = body.nameEn || body["name.en"];
    const nameAr = body.nameAr || body["name.ar"];
    const descriptionEn = body.descriptionEn || body["description.en"];
    const descriptionAr = body.descriptionAr || body["description.ar"];
    const projectNameEn = body.projectNameEn || body["projectName.en"];
    const projectNameAr = body.projectNameAr || body["projectName.ar"];
    const heroTitleEn = body["hero.title.en"];
    const heroTitleAr = body["hero.title.ar"];
    const heroDescriptionEn = body["hero.description.en"];
    const heroDescriptionAr = body["hero.description.ar"];
    const responsiveTitleEn = body["responsive.title.en"];
    const responsiveTitleAr = body["responsive.title.ar"];
    const responsiveDescriptionEn = body["responsive.description.en"];
    const responsiveDescriptionAr = body["responsive.description.ar"];

    const parsedSeo = parseJSON(body.seo, []);

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
        name: { en: nameEn, ar: nameAr },
        description: { en: descriptionEn, ar: descriptionAr },
        projectName: { en: projectNameEn, ar: projectNameAr },
        hero: {
          title: { en: heroTitleEn, ar: heroTitleAr },
          description: { en: heroDescriptionEn, ar: heroDescriptionAr },
          platforms: body["hero.platforms"],
          region: body["hero.region"],
          downloads: body["hero.downloads"]
        },
        responsive: {
          title: { en: responsiveTitleEn, ar: responsiveTitleAr },
          description: { en: responsiveDescriptionEn, ar: responsiveDescriptionAr }
        },
        category: body.category,
        client: body.client,
        platform: body.platform,
        region: body.region,
        technologies: body.technologies,
        regionResponse: body.regionResponse,
        screenTypes: body.screenTypes,
        relatedProjects: body.relatedProjects || [],
        content,
        seo: parsedSeo,
        url: body.url,
        status: body.status
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
    const language = req.query.language || "en";
    const items = await Portfolio.find().select("name description images category seo");

    const processedItems = items.map(item => {
      const obj = item.toObject();

      // استخراج الترجمة المناسبة للاسم والوصف
      obj.name = extractLocalizedField(obj.name, language);
      obj.description = extractLocalizedField(obj.description, language);

      // معالجة بيانات الـ SEO
      if (Array.isArray(obj.seo) && obj.seo.length > 0) {
        const seoData = obj.seo.find(seo => seo.language === language) || obj.seo[0];
        obj.seo = seoData;
      } else {
        obj.seo = {
          language,
          metaTitle: "Default Meta Title",
          metaDescription: "Default meta description.",
          keywords: "default,portfolio",
          canonicalTag: "",
          structuredData: {}
        };
      }

      return obj;
    });

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
    const language = req.query.language || "en";
    const item = await Portfolio.findById(req.params.id).populate("hero category");

    if (!item) {
      return res.status(404).json(formatErrorResponse("Portfolio item not found"));
    }

    const toLang = (field) => {
      if (typeof field === 'object' && field !== null && field[language]) return field[language];
      return field; // fallback
    };

    const itemObj = item.toObject();

    // Extract main fields
    itemObj.name = toLang(itemObj.name);
    itemObj.description = toLang(itemObj.description);
    itemObj.projectName = toLang(itemObj.projectName);

    // Hero fields
    if (itemObj.hero) {
      itemObj.hero.title = toLang(itemObj.hero.title);
      itemObj.hero.description = toLang(itemObj.hero.description);
    }

    // Responsive fields
    if (itemObj.responsive) {
      itemObj.responsive.title = toLang(itemObj.responsive.title);
      itemObj.responsive.description = toLang(itemObj.responsive.description);
    }

    // Category name
    if (itemObj.category) {
      itemObj.category.name = toLang(itemObj.category.name);
    }

    // SEO
    if (Array.isArray(itemObj.seo)) {
      const seo = itemObj.seo.find((s) => s.language === language) || itemObj.seo[0];
      itemObj.seo = seo || {};
    }

    // Get related projects
    const relatedProjects = await Portfolio.find({
      category: item.category,
      _id: { $ne: item._id }
    }).select("name description images category")
    .populate("category") 
      .sort({ createdAt: -1 })
      .limit(4);

    const processedRelated = relatedProjects.map(project => {
      const obj = project.toObject();
      return {
        ...obj,
        name: toLang(obj.name),
        description: toLang(obj.description),
        category: obj.category && obj.category.name ? String(toLang(obj.category.name)) : undefined,

      };
    });

    return res.status(200).json(
      formatSuccessResponse(
        { ...itemObj, relatedProjects: processedRelated },
        "Portfolio item retrieved successfully"
      )
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      formatErrorResponse("Failed to retrieve portfolio item", error.message)
    );
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
