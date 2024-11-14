const Service = require("../models/servicesModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Define cache keys
const SERVICES_ALL_KEY = "allServices";
const SERVICE_SINGLE_KEY = (id) => `service:${id}`;

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, category, description, benefits, keyFeatures, quoteLink } =
      req.body;

    // Process uploaded files
    const images = req.files
      ? req.files.map((file) => ({
          url: `http://localhost:4000/uploads/services/${file.filename}`,
          altText: file.originalname,
          caption: req.body.caption || "",
        }))
      : [];

    const newService = new Service({
      name,
      category,
      description,
      benefits: benefits ? benefits.split(",") : [],
      keyFeatures: keyFeatures ? keyFeatures.split(",") : [],
      images,
      quoteLink,
    });

    const savedService = await newService.save();

    // Clear the cached list of all services since a new service was added
    await deleteCache(SERVICES_ALL_KEY);

    return res
      .status(201)
      .json(
        formatSuccessResponse(savedService, "Service created successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to create service", error.message));
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { name, category, description, benefits, keyFeatures, quoteLink } =
      req.body;

    // Process uploaded files
    const images = req.files
      ? req.files.map((file) => ({
          url: `http://localhost:4000/uploads/services/${file.filename}`,
          altText: file.originalname,
          caption: req.body.caption || "",
        }))
      : [];

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        description,
        benefits: benefits ? benefits.split(",") : [],
        keyFeatures: keyFeatures ? keyFeatures.split(",") : [],
        images,
        quoteLink,
      },
      { new: true }
    );

    if (!updatedService)
      return res.status(404).json(formatErrorResponse("Service not found"));

    // Update cache
    await setCache(SERVICE_SINGLE_KEY(req.params.id), updatedService);
    await deleteCache(SERVICES_ALL_KEY); // Clear cached list of all services

    return res
      .status(200)
      .json(
        formatSuccessResponse(updatedService, "Service updated successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to update service", error.message));
  }
};

// Get all services with caching
exports.getAllServices = async (req, res) => {
  try {
    const cachedServices = await getCache(SERVICES_ALL_KEY);
    if (cachedServices) {
      return res
        .status(200)
        .json(
          formatSuccessResponse(
            cachedServices,
            "Services retrieved successfully from cache"
          )
        );
    }

    const services = await Service.find();
    await setCache(SERVICES_ALL_KEY, services); // Cache the result

    return res
      .status(200)
      .json(formatSuccessResponse(services, "Services retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to retrieve services", error.message));
  }
};

// Get a single service by ID with caching
exports.getServiceById = async (req, res) => {
  const cacheKey = SERVICE_SINGLE_KEY(req.params.id);
  try {
    const cachedService = await getCache(cacheKey);
    if (cachedService) {
      return res
        .status(200)
        .json(
          formatSuccessResponse(
            cachedService,
            "Service retrieved successfully from cache"
          )
        );
    }

    const service = await Service.findById(req.params.id);
    if (!service)
      return res.status(404).json(formatErrorResponse("Service not found"));

    await setCache(cacheKey, service); // Cache the result

    return res
      .status(200)
      .json(formatSuccessResponse(service, "Service retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to retrieve service", error.message));
  }
};

// Delete a service and clear relevant caches
exports.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService)
      return res.status(404).json(formatErrorResponse("Service not found"));

    // Clear caches related to this item
    await deleteCache(SERVICE_SINGLE_KEY(req.params.id));
    await deleteCache(SERVICES_ALL_KEY);

    return res
      .status(200)
      .json(formatSuccessResponse(null, "Service deleted successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to delete service", error.message));
  }
};
