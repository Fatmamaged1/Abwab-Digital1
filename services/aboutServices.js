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

    // Fetch data from DB
    const aboutData = await About.find();
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

    // Fetch data from DB
    const aboutData = await About.findById(id);
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

exports.createOrUpdateAbout = async (req, res) => {
    const { title, description, stats, vision, mission, features } = req.body;
  
    // Check the structure of req.files and handle accordingly
    const processedFeatures = features.map((feature, index) => {
      const uploadedFile =
        req.files[`features[${index}][icon]`] // If using upload.fields
          ? req.files[`features[${index}][icon]`][0]
          : req.files.find((file) => file.fieldname === `features[${index}][icon]`); // If using upload.any()
  
      return {
        ...feature,
        icon: uploadedFile ? `/uploads/about/${uploadedFile.filename}` : feature.icon,
      };
    });
  
    const imageUrl = req.files?.image?.[0]?.filename ? `/uploads/about/${req.files.image[0].filename}` : null;
  
    try {
      let aboutData = await About.findOne();
  
      if (aboutData) {
        // Update existing data
        aboutData.title = title || aboutData.title;
        aboutData.description = description || aboutData.description;
        aboutData.stats = stats || aboutData.stats;
        aboutData.vision = vision || aboutData.vision;
        aboutData.mission = mission || aboutData.mission;
        aboutData.features = processedFeatures.length ? processedFeatures : aboutData.features;
        if (imageUrl) aboutData.image = imageUrl;
  
        await aboutData.save();
  
        // Invalidate cache
        await deleteCache(CACHE_KEY_ALL);
  
        return res.status(200).json(formatSuccessResponse(aboutData, "About page updated successfully"));
      }
  
      // Create new data
      aboutData = new About({
        title,
        description,
        stats,
        vision,
        mission,
        features: processedFeatures,
        image: imageUrl,
      });
      await aboutData.save();
  
      // Invalidate cache
      await deleteCache(CACHE_KEY_ALL);
  
      return res.status(201).json(formatSuccessResponse(aboutData, "About page created successfully"));
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
    const { title, description, stats, vision, mission, features } = req.body;
  
    // Process uploaded feature icons
    const processedFeatures = features
      ? JSON.parse(features).map((feature, index) => ({
          ...feature,
          icon: req.files && req.files[`features[${index}][icon]`]
            ? `/uploads/about/${req.files[`features[${index}][icon]`][0].filename}`
            : feature.icon, // Retain existing icon if no new file is uploaded
        }))
      : [];
  
    const imageUrl = req.file ? `/uploads/about/${req.file.filename}` : null;
  
    try {
      const aboutData = await About.findById(id);
  
      if (!aboutData)
        return res
          .status(404)
          .json(formatErrorResponse("No data found with the provided ID"));
  
      // Update data
      aboutData.title = title || aboutData.title;
      aboutData.description = description || aboutData.description;
      aboutData.stats = stats || aboutData.stats;
      aboutData.vision = vision || aboutData.vision;
      aboutData.mission = mission || aboutData.mission;
      aboutData.features = processedFeatures.length ? processedFeatures : aboutData.features;
      if (imageUrl) aboutData.image = imageUrl;
  
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
  