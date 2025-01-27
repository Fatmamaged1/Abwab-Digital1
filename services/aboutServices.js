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
    // Check if data is cached
    const cachedData = await getCache(CACHE_KEY_ALL);
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
    const aboutData = await About.find()
      .populate("services")
      .populate("portfolio");

    if (!aboutData.length)
      return res.status(404).json(formatErrorResponse("No data found"));

    // Set data in cache and respond
    await setCache(CACHE_KEY_ALL, aboutData);
    res
      .status(200)
      .json(formatSuccessResponse(aboutData, "Data fetched successfully"));
  } catch (error) {
    res.status(500).json(formatErrorResponse("Server error", error));
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
// Create or Update About Page
exports.createOrUpdateAbout = async (req, res) => {
  const { hero, stats, values, features, services, technologies, portfolio, footer } = req.body;
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    let aboutData = await About.findOne();

    // Process `values` to ensure `icon` is assigned correctly
    const processedValues = values
      ? values.map((value, index) => ({
          ...value,
          icon: req.files[`values[${index}][icon]`]
            ? `/uploads/about/${req.files[`values[${index}][icon]`][0].filename}`
            : value.icon, // Keep existing icon if not updated
        }))
      : aboutData ? aboutData.values : [];

    if (aboutData) {
      // Update existing data
      aboutData.hero = hero || aboutData.hero;
      aboutData.stats = stats || aboutData.stats;
      aboutData.values = processedValues || aboutData.values;
      aboutData.features = features || aboutData.features;
      aboutData.services = services || aboutData.services;
      aboutData.technologies = technologies || aboutData.technologies;
      aboutData.portfolio = portfolio || aboutData.portfolio;
      aboutData.footer = footer || aboutData.footer;

      await aboutData.save();

      // Invalidate cache
      await deleteCache(CACHE_KEY_ALL);

      return res
        .status(200)
        .json(formatSuccessResponse(aboutData, "About page updated successfully"));
    }

    // Create new data
    aboutData = new About({
      hero,
      stats,
      values: processedValues,
      features,
      services,
      technologies,
      portfolio,
      footer,
    });
    await aboutData.save();

    // Invalidate cache
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
