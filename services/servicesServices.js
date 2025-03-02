const upload = require("../middleware/upload"); // Import multer middleware
const Service = require("../models/servicesModel"); // Import model
const Portfolio = require("../models/PortfolioModel");
const Testimonial = require("../models/testimonialModel");
exports.createService = async (req, res) => {
  try {
    const {
      description,
      category,
      importance,
      techUsedInService,
      distingoshesUs,
      designPhase
    } = req.body;

    console.log("Uploaded Files:", req.files); // Debugging uploaded files

    // Parse JSON fields
    const parsedImportance = JSON.parse(importance || "[]");
    const parsedTechUsedInService = JSON.parse(techUsedInService || "[]");
    const parsedDistingoshesUs = JSON.parse(distingoshesUs || "[]");
    const parsedDesignPhase = JSON.parse(designPhase || "{}");

    // Base URL for serving images
    const baseUrl = "http://91.108.102.81:4000/uploads/";

    // Assign the main service image URL
    const imageUrl = req.files.image?.[0]?.filename
      ? baseUrl + req.files.image[0].filename
      : null;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    // Assign icons for techUsedInService
    parsedTechUsedInService.forEach((item, index) => {
      item.icon = req.files.techUsedInServiceIcons?.[index]
        ? baseUrl + req.files.techUsedInServiceIcons[index].filename
        : "";
    });

    // Assign icons for distingoshesUs
    parsedDistingoshesUs.forEach((item, index) => {
      item.icon = req.files.distingoshesUsIcons?.[index]
        ? baseUrl + req.files.distingoshesUsIcons[index].filename
        : "";
    });

    // ✅ Assign designPhase.image from uploaded file
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // Create Service Object
    const newService = new Service({
      description,
      category,
      image: { url: imageUrl, altText: "Service Image" }, // ✅ Set the main image
      importance: parsedImportance,
      techUsedInService: parsedTechUsedInService,
      distingoshesUs: parsedDistingoshesUs,
      designPhase: parsedDesignPhase, // ✅ Now includes designPhase.image
    });

    // Save to Database
    await newService.save();

    res.status(201).json({ success: true, message: "Service created successfully", data: newService });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating service", error: error.message });
  }
};




// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate("testimonials").populate("recentProjects");
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching services", error: error.message });
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    // Last 4 recent projects

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Fetch last 4 testimonials from the entire database (not just the service)
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 }) // Sort by latest
      .limit(4);

    // Fetch last 4 related portfolio projects from the same category (excluding the current service's projects)
    const relatedPortfolios = await Portfolio.find({
      category: service.category,
      _id: { $nin: service.recentProjects.map((p) => p._id) }, // Exclude projects already in service.recentProjects
    })
      .sort({ createdAt: -1 })
      .limit(4);

    // Return the response with testimonials, recentProjects, and related portfolios
    res.status(200).json({
      success: true,
      data: {
        ...service.toObject(), // Convert Mongoose document to plain object
        testimonials, // Last 4 testimonials from the entire database
        relatedPortfolios, // Last 4 related portfolio projects from the same category
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching service", error: error.message });
  }
};


// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting service", error: error.message });
  }
};
