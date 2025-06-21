
const Portfolio = require("../models/PortfolioModel"); 
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const slugify = require("slugify");
const ApiError = require("../utils/apiError");
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

  
  



exports.getPortfolioItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const language = req.query.lang || "en";

    const item = await Portfolio.findById(id).populate("relatedProjects");
    if (!item) {
      return next(new ApiError("Portfolio item not found", 404));
    }

    const itemObj = item.toObject();

    // دالة استخراج النص حسب اللغة
    function extractLocalizedField(field, lang) {
      if (!field) return "";
      if (typeof field === "object" && field[lang]) return field[lang];
      return typeof field === "string" ? field : "";
    }

    // استخراج الحقول متعددة اللغات
    itemObj.projectName = extractLocalizedField(itemObj.projectName, language);
    itemObj.name = extractLocalizedField(itemObj.name, language);
    itemObj.description = extractLocalizedField(itemObj.description, language);

    // hero
    if (itemObj.hero) {
      itemObj.hero.title = extractLocalizedField(itemObj.hero.title, language);
      itemObj.hero.description = extractLocalizedField(itemObj.hero.description, language);
    }

    // responsive
    if (itemObj.responsive) {
      itemObj.responsive.title = extractLocalizedField(itemObj.responsive.title, language);
      itemObj.responsive.description = extractLocalizedField(itemObj.responsive.description, language);
    }

    // relatedProjects
    if (itemObj.relatedProjects && Array.isArray(itemObj.relatedProjects)) {
      itemObj.relatedProjects = itemObj.relatedProjects.map((proj) => {
        return {
          _id: proj._id,
          image: proj.image,
          name: extractLocalizedField(proj.name, language),
          description: extractLocalizedField(proj.description, language),
        };
      });
    }

    res.status(200).json({
      success: true,
      message: "Portfolio item fetched successfully",
      data: itemObj,
    });
  } catch (error) {
    next(new ApiError("Failed to fetch portfolio item", 500, error));
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
