const Service = require("../models/servicesModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

// Create a new service
exports.createService = async (req, res) => {
    try {
        const { name, category, description, benefits, keyFeatures, quoteLink } = req.body;

        // Process uploaded files
        const images = req.files ? req.files.map(file => ({
            url: `http://localhost:4000/uploads/services/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || ""
        })) : [];

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
        return res.status(201).json(formatSuccessResponse(savedService, "Service created successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to create service", error.message));
    }
};

// Update a service
exports.updateService = async (req, res) => {
    try {
        const { name, category, description, benefits, keyFeatures, quoteLink } = req.body;

        // Process uploaded files
        const images = req.files ? req.files.map(file => ({
            url: `http://localhost:4000/uploads/services/${file.filename}`,
            altText: file.originalname,
            caption: req.body.caption || ""
        })) : [];

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

        if (!updatedService) return res.status(404).json(formatErrorResponse("Service not found"));
        return res.status(200).json(formatSuccessResponse(updatedService, "Service updated successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(formatErrorResponse("Failed to update service", error.message));
    }
};
// Get all services
exports.getAllServices = async (req, res) => {
  try {
      const services = await Service.find();
      return res.status(200).json(formatSuccessResponse(services, "Services retrieved successfully"));
  } catch (error) {
      console.error(error);
      return res.status(500).json(formatErrorResponse("Failed to retrieve services", error.message));
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
      const service = await Service.findById(req.params.id);
      if (!service) return res.status(404).json(formatErrorResponse("Service not found"));
      return res.status(200).json(formatSuccessResponse(service, "Service retrieved successfully"));
  } catch (error) {
      console.error(error);
      return res.status(500).json(formatErrorResponse("Failed to retrieve service", error.message));
  }
};
// Delete a service
exports.deleteService = async (req, res) => {
  try {
      const deletedService = await Service.findByIdAndDelete(req.params.id);
      if (!deletedService) return res.status(404).json(formatErrorResponse("Service not found"));
      return res.status(200).json(formatSuccessResponse(null, "Service deleted successfully"));
  } catch (error) {
      console.error(error);
      return res.status(500).json(formatErrorResponse("Failed to delete service", error.message));
  }
};