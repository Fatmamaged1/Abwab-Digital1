const Service = require("../models/servicesModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { deleteCache, getCache ,setCache} = require("../utils/cache");
const Joi = require("joi");

const SERVICE_CACHE_KEY = id => `service:${id}`;
const SERVICES_CACHE_KEY = "services:all";

// Helper: Get full URL for file paths
const getFullPath = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/${filePath.replace(/^C:\\Users\\elaqsa\\ApiOfWibsite\\/, "").replace(/\\/g, "/")}`;
};

// Helper: Safely parse JSON with fallback
const safeParse = (input, fallback = []) => {
  try {
    return JSON.parse(input || JSON.stringify(fallback));
  } catch (error) {
    console.warn(`Failed to parse JSON: ${input}`);
    return fallback;
  }
};


exports.createService = async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      stats: Joi.string().optional(),
      importance: Joi.string().optional(),
      footer: Joi.string().optional(),
      seo: Joi.string().optional(),
      keyFeatures: Joi.string().optional(),
      recentProjects: Joi.string().optional(),
      testimonials: Joi.array().items(Joi.string()).optional(),
      services: Joi.string().optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const {
      title,
      description,
      stats,
      importance,
      footer,
      seo,
      keyFeatures,
      recentProjects,
      testimonials,
      services,
    } = value;

    // Parse JSON strings safely
    const parsedKeyFeatures = safeParse(keyFeatures, []);
    const parsedRecentProjects = safeParse(recentProjects, []);
    const parsedTestimonials = safeParse(testimonials, []);
    const parsedServices = safeParse(services, []);

    // Map key features and assign icon paths
    const mappedKeyFeatures = parsedKeyFeatures.map((feature, index) => {
      // Match icon file by index
      const iconFile = req.files?.icon?.[index]?.path;
    
      // Map the icon to the key feature
      return {
        title: feature.title || `Default Feature ${index + 1}`,
        description: feature.description || `Default Description ${index + 1}`,
        icon: iconFile ? getFullPath(req, iconFile) : null, // Set the icon path
        alt: feature.alt || `Default Alt Text ${index + 1}`,
      };
    });
    
    // Validate that all key features have icons
    const missingIcons = mappedKeyFeatures.some((feature, index) => {
      if (!feature.icon) {
        console.error(`Missing icon for key feature at index ${index + 1}`);
        return true;
      }
      return false;
    });
    
    if (missingIcons) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: "All key features must have an associated icon.",
      });
    }
    
    // Map recent projects and assign image paths
    const mappedRecentProjects = parsedRecentProjects.map((project, index) => {
      const imageFile = req.files?.image?.[index]?.path; // Match image by index
      return {
        title: project.title || `Default Project ${index + 1}`,
        description: project.description || `Default Description ${index + 1}`,
        image: imageFile ? getFullPath(req, imageFile) : project.image || null,
        alt: project.alt || `Default Alt Text ${index + 1}`,
      };
    });


    

    // Validate that all recent projects have images
    const missingImages = mappedRecentProjects.some((project, index) => {
      if (!project.image) {
        console.error(`Missing image for recent project at index ${index + 1}`);
        return true;  
      }
      return false;
    });

    if (missingImages) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: "All recent projects must have an associated image.",
      });
    }

    // Create a new service instance
    const newService = new Service({
      title,
      description,
      stats: safeParse(stats),
      importance: safeParse(importance, []),
      footer: safeParse(footer),
      seo: safeParse(seo, []),
      keyFeatures: mappedKeyFeatures,
      recentProjects: mappedRecentProjects,
      testimonials: parsedTestimonials,
      services: parsedServices,
    });

    // Save to database
    const savedService = await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: savedService,
    });
  } catch (error) {
    console.error("Error in createService:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      details: error.message,
    });
  }
};


// Update an existing service
exports.updateService = async (req, res) => {
  try {
    const { title, description, stats, keyFeatures, importance, recentProjects, testimonials, footer, seo } = req.body;

    const parsedKeyFeatures = JSON.parse(keyFeatures || "[]").map((feature) => ({
      ...service,
      image: service.image || getFilePath(req.files?.image?.[0]),
    }));

    const parsedFeatures = parseJSON(features, []).map((feature) => ({
      ...feature,
      icon: feature.icon || getFilePath(req.files?.icon?.[0]),
    }));

    const parsedSeo = parseJSON(seo, []);

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        stats: JSON.parse(stats || "{}"),
        keyFeatures: parsedKeyFeatures,
        importance: JSON.parse(importance || "[]"),
        recentProjects: parsedRecentProjects,
        testimonials: parsedTestimonials,
        footer: JSON.parse(footer || "{}"),
        seo: parsedSeo,
      },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json(formatErrorResponse("Service not found"));
    }

    // Invalidate relevant caches
    await deleteCache(SERVICES_CACHE_KEY);
    await deleteCache(SERVICE_CACHE_KEY(req.params.id));

    res
      .status(200)
      .json(formatSuccessResponse(updatedService, "Service updated successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to update service", error.message));
  }
};

// Get all services with caching and selected fields (footer, description, title, icon, and _id)
exports.getAllServices = async (req, res) => {
  try {
  

    const services = await Service.find({}, 'title description footer keyFeatures _id');

    const enhancedServices = services.map(service => {
      const enhancedService = {
        _id: service._id,
        title: service.title || "Default Title",
        description: service.description || "Default Description",
       // footer: service.footer || { copyright: "© 2025 Your Company", quickLinks: [], socialLinks: [] },
        icon: service.keyFeatures?.[0]?.icon || null, // Get icon from keyFeatures
        enhancedIconLink: service.keyFeatures?.[0]?.icon ? getFullPath(req, service.keyFeatures[0].icon) : null, // Construct the full path for icon
      };

      return enhancedService;
    });

    // Cache the result
    await setCache(SERVICES_CACHE_KEY, enhancedServices);

    res
      .status(200)
      .json(formatSuccessResponse(enhancedServices, "Services retrieved successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to retrieve services", error.message));
  }
};


// Get a service by ID with caching
exports.getServiceById = async (req, res) => {
  try {
    const cacheKey = SERVICE_CACHE_KEY(req.params.id);

    const cachedService = await getCache(cacheKey);
    if (cachedService) {
      return res
        .status(200)
        .json(formatSuccessResponse(cachedService, "Service retrieved from cache"));
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json(formatErrorResponse("Service not found"));
    }

    await setCache(cacheKey, service);

    res
      .status(200)
      .json(formatSuccessResponse(service, "Service retrieved successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to retrieve service", error.message));
  }
};

// Delete a service and invalidate caches
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json(formatErrorResponse("Service not found"));
    }

    await deleteCache(SERVICES_CACHE_KEY);
    await deleteCache(SERVICE_CACHE_KEY(req.params.id));

    res
      .status(200)
      .json(formatSuccessResponse(null, "Service deleted successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to delete service", error.message));
  }
};
