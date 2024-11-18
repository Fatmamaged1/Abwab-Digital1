const Service = require("../models/servicesModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Cache keys
const SERVICES_CACHE_KEY = "services:all";
const SERVICE_CACHE_KEY = (id) => `services:${id}`;

// Parse JSON fields with error handling
const parseJSON = (input, fallback = {}) => {
  try {
    return JSON.parse(input || "{}");
  } catch {
    return fallback;
  }
};

// Handle file paths for uploads
const getFilePath = (file) =>
  file ? `/uploads/services/${file.filename}` : null;

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { title, description, stats, services, features, footer } = req.body;

    const parsedServices = parseJSON(services, []).map((service) => ({
      ...service,
      image: service.image || getFilePath(req.files?.image?.[0]),
    }));

    const parsedFeatures = parseJSON(features, []).map((feature) => ({
      ...feature,
      icon: feature.icon || getFilePath(req.files?.icon?.[0]),
    }));

    const newService = new Service({
      title,
      description,
      stats: parseJSON(stats),
      services: parsedServices,
      features: parsedFeatures,
      footer: parseJSON(footer),
    });

    const savedService = await newService.save();

    // Invalidate cache
    await deleteCache(SERVICES_CACHE_KEY);

    res
      .status(201)
      .json(formatSuccessResponse(savedService, "Service created successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to create service", error.message));
  }
};

// Update an existing service
exports.updateService = async (req, res) => {
  try {
    const { title, description, stats, services, features, footer } = req.body;

    const parsedServices = parseJSON(services, []).map((service) => ({
      ...service,
      image: service.image || getFilePath(req.files?.image?.[0]),
    }));

    const parsedFeatures = parseJSON(features, []).map((feature) => ({
      ...feature,
      icon: feature.icon || getFilePath(req.files?.icon?.[0]),
    }));

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        stats: parseJSON(stats),
        services: parsedServices,
        features: parsedFeatures,
        footer: parseJSON(footer),
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

// Get all services with caching
exports.getAllServices = async (req, res) => {
  try {
    // Check Redis cache
    const cachedServices = await getCache(SERVICES_CACHE_KEY);
    if (cachedServices) {
      return res
        .status(200)
        .json(formatSuccessResponse(cachedServices, "Services retrieved from cache"));
    }

    const services = await Service.find();

    // Cache the result
    await setCache(SERVICES_CACHE_KEY, services);

    res
      .status(200)
      .json(formatSuccessResponse(services, "Services retrieved successfully"));
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

    // Check Redis cache
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

    // Cache the result
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

    // Invalidate caches
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
