const About = require("../models/aboutModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Cache keys
const CACHE_KEY_ALL = "about:all";
const CACHE_KEY_PREFIX_ID = "about:id:";

// Get All About Page Data (with Redis cache)
exports.getAllAbout = async (req, res) => {
  try {
    // Extract language from query parameters; default to "en" if not provided.
    const language = req.query.language || "en";

    // Fetch data from DB, populating related fields
    const aboutData = await About.find()
      .populate("portfolio", "name description images category")
      .populate("home", "whyChooseUs technologyStack")
      .populate("services", "category description");

    if (!aboutData.length)
      return res.status(404).json(formatErrorResponse("No data found"));

    // Process each About document to retrieve SEO data for the requested language.
    const processedAboutData = aboutData.map(homeData => {
      // Convert the document to a plain object.
      const updatedData = homeData.toObject();

      // Find the SEO entry matching the requested language,
      // fallback to the first SEO entry if not found, or an empty object if no SEO exists.
      const seoData =
        (updatedData.seo && updatedData.seo.find(entry => entry.language === language)) ||
        (updatedData.seo && updatedData.seo[0]) ||
        {};
      updatedData.seo = seoData;
      return updatedData;
    });

    // Set data in cache and respond
    await setCache(CACHE_KEY_ALL, processedAboutData);
    return res
      .status(200)
      .json(formatSuccessResponse(processedAboutData, "Data fetched successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Server error", error));
  }
};

// Get About Page Data by ID (with Redis cache)
exports.getAboutById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_KEY_PREFIX_ID}${id}`;

    // Check if data is cached
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res
        .status(200)
        .json(
          formatSuccessResponse(
            cachedData,
            "Data fetched successfully from cache"
          )
        );
    }

    // Fetch data from DB, populating related fields
    const aboutData = await About.findById(id)
      .populate("services")
      .populate("portfolio");

    if (!aboutData)
      return res
        .status(404)
        .json(formatErrorResponse("No data found with the provided ID"));

    // Set data in cache and respond
    await setCache(cacheKey, aboutData);
    res
      .status(200)
      .json(formatSuccessResponse(aboutData, "Data fetched successfully"));
  } catch (error) {
    res.status(500).json(formatErrorResponse("Server error", error));
  }
};

// Create or Update About Page
exports.createOrUpdateAbout = async (req, res) => {
  const { hero, stats, values, features, services, home, portfolio, seo } = req.body;
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    let aboutData = await About.findOne();

    // Process hero data
    const processedHero = {
      title: hero?.title || (aboutData?.hero?.title ?? ""),
      description: hero?.description || (aboutData?.hero?.description ?? ""),
      image: req.files["hero"]?.[0]?.filename
        ? `/uploads/about/${req.files["hero"][0].filename}`
        : aboutData?.hero?.image ?? "",
    };

    // Process values data
    const processedValues = values
      ? values.map((value, index) => ({
          ...value,
          icon: req.files[`values[${index}][icon]`]
            ? `/uploads/about/${req.files[`values[${index}][icon]`][0].filename}`
            : value.icon ?? aboutData?.values?.[index]?.icon ?? "",
        }))
      : aboutData?.values ?? [];

    // Process features data
    const processedFeatures = features
      ? features.map((feature, index) => ({
          ...feature,
          icon: req.files[`features[${index}][icon]`]
            ? `/uploads/about/${req.files[`features[${index}][icon]`][0].filename}`
            : feature.icon ?? aboutData?.features?.[index]?.icon ?? "",
        }))
      : aboutData?.features ?? [];

    // Process SEO data:
    let processedSeo = [];
    let seoData = seo;
    // If seo is a string (e.g., a JSON string), parse it
    if (typeof seo === 'string') {
      try {
        seoData = JSON.parse(seo);
      } catch (parseError) {
        console.error("Error parsing SEO data:", parseError);
        return res.status(400).json(formatErrorResponse("Invalid SEO data format"));
      }
    }
    if (seoData && Array.isArray(seoData) && seoData.length > 0) {
      processedSeo = seoData.map(entry => ({
        language: entry.language.trim(),
        metaTitle: entry.metaTitle.trim(),
        metaDescription: entry.metaDescription.trim(),
        keywords: entry.keywords.trim(),
        canonicalTag: entry.canonicalTag ? entry.canonicalTag.trim() : "",
        structuredData: entry.structuredData || {}
      }));
    } else if (aboutData?.seo && aboutData.seo.length > 0) {
      processedSeo = aboutData.seo;
    } else {
      // Optional: set default SEO data if desired
      processedSeo = [
        {
          language: "en",
          metaTitle: "Default Title",
          metaDescription: "Default Description",
          keywords: "default,seo",
          canonicalTag: "",
          structuredData: {}
        }
      ];
    }

    if (aboutData) {
      // Update existing About document
      aboutData.hero = processedHero;
      aboutData.stats = stats || aboutData.stats;
      aboutData.values = processedValues || aboutData.values;
      aboutData.features = processedFeatures || aboutData.features;
      aboutData.services = services || aboutData.services;
      aboutData.home = home || aboutData.home;
      aboutData.portfolio = portfolio || aboutData.portfolio;
      aboutData.seo = processedSeo;

      await aboutData.save();

      // Invalidate cache if needed
      await deleteCache(CACHE_KEY_ALL);

      return res
        .status(200)
        .json(formatSuccessResponse(aboutData, "About page updated successfully"));
    }

    // Create new About document
    aboutData = new About({
      hero: processedHero,
      stats,
      values: processedValues,
      features: processedFeatures,
      services,
      portfolio,
      home,
      seo: processedSeo,
    });

    await aboutData.save();

    // Invalidate cache if needed
    await deleteCache(CACHE_KEY_ALL);

    return res
      .status(201)
      .json(formatSuccessResponse(aboutData, "About page created successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Server error", error.message));
  }
};
// Delete About Page Data by ID (with Redis invalidation)
exports.deleteAboutById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_KEY_PREFIX_ID}${id}`;

    const aboutData = await About.findByIdAndDelete(id);
    if (!aboutData)
      return res
        .status(404)
        .json(formatErrorResponse("No data found with the provided ID"));

    // Invalidate cache
    await deleteCache(CACHE_KEY_ALL);
    await deleteCache(cacheKey);

    res
      .status(200)
      .json(
        formatSuccessResponse(aboutData, "About page data deleted successfully")
      );
  } catch (error) {
    res.status(500).json(formatErrorResponse("Server error", error));
  }
};

// Update About Page Data by ID (with Redis invalidation)
exports.updateAboutById = async (req, res) => {
  const { id } = req.params;
  const { hero, stats, values, features, services, technologies, portfolio, footer } = req.body;

  try {
    const aboutData = await About.findById(id);

    if (!aboutData)
      return res
        .status(404)
        .json(formatErrorResponse("No data found with the provided ID"));

    // Update data
    aboutData.hero = hero || aboutData.hero;
    aboutData.stats = stats || aboutData.stats;
    aboutData.values = values || aboutData.values;
    aboutData.features = features || aboutData.features;
    aboutData.services = services || aboutData.services;
    aboutData.technologies = technologies || aboutData.technologies;
    aboutData.portfolio = portfolio || aboutData.portfolio;
    aboutData.footer = footer || aboutData.footer;

    await aboutData.save();

    // Invalidate cache
    await deleteCache(CACHE_KEY_ALL);
    await deleteCache(`${CACHE_KEY_PREFIX_ID}${id}`);

    res
      .status(200)
      .json(
        formatSuccessResponse(aboutData, "About page data updated successfully")
      );
  } catch (error) {
    console.error(error);
    res.status(500).json(formatErrorResponse("Server error", error.message));
  }
};
