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
      designPhase,
      seo
    } = req.body;

    console.log("Uploaded Files:", req.files); // Debugging uploaded files

    // Parse JSON fields
    const parsedImportance = JSON.parse(importance || "[]");
    const parsedTechUsedInService = JSON.parse(techUsedInService || "[]");
    const parsedDistingoshesUs = JSON.parse(distingoshesUs || "[]");
    const parsedDesignPhase = JSON.parse(designPhase || "{}");

    // Process SEO data:
    let parsedSeo = [];
    if (seo) {
      try {
        parsedSeo = JSON.parse(seo);
        // If it's a single object, wrap it into an array.
        if (!Array.isArray(parsedSeo)) {
          parsedSeo = [parsedSeo];
        }
      } catch (error) {
        return res.status(400).json(formatErrorResponse("Invalid SEO data format", error.message));
      }
    }

    // Base URL for serving images
    const baseUrl = "https://backend.abwabdigital.com:4000/uploads/";

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

    // Assign designPhase.image from uploaded file
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // Create Service Object with SEO data
    const newService = new Service({
      description,
      category,
      image: { url: imageUrl, altText: "Service Image" },
      importance: parsedImportance,
      techUsedInService: parsedTechUsedInService,
      distingoshesUs: parsedDistingoshesUs,
      designPhase: parsedDesignPhase,
      seo: parsedSeo, // SEO field is set here as an array of SEO objects
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating service",
      error: error.message,
    });
  }
};



exports.getAllServices = async (req, res) => {
  try {
    // Extract requested language (default to "en")
    const language = req.query.language || "en";

    // Fetch all services (all fields, including the SEO array)
    const services = await Service.find().select("description category seo");

    // Process each service to select the appropriate SEO data for that service
    const processedServices = services.map(service => {
      const serviceObj = service.toObject();

      let seoData = {};
      if (Array.isArray(serviceObj.seo) && serviceObj.seo.length > 0) {
        // Look for the SEO entry matching the requested language,
        // or use the first entry if none match.
        seoData = serviceObj.seo.find(entry => entry.language === language) || serviceObj.seo[0];
      } else {
        // Default SEO object for individual service if no SEO data exists.
        seoData = {
          language,
          metaTitle: "Default Meta Title",
          metaDescription: "Default meta description for the service.",
          keywords: "default,service,seo",
          canonicalTag: "",
          structuredData: {}
        };
      }
      serviceObj.seo = seoData;
      return serviceObj;
    });

    // Global SEO for the "All Services" page header.
    // You can modify these values or load them from a configuration.
    const globalSeo = {
      language,
      metaTitle: language === "en" ? "Our Services" : "خدماتنا",
      metaDescription: language === "en" ? "Discover our wide range of services." : "اكتشف مجموعة خدماتنا المتنوعة.",
      keywords: language === "en" ? "services, company, solutions" : "خدمات, شركة, حلول",
      canonicalTag: "",
      structuredData: {}
    };

    return res.status(200).json({
      success: true,
      data: {
        globalSeo,
        services: processedServices
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching services", 
      error: error.message 
    });
  }
};





exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.language || "en"; // Language requested, defaulting to English

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Convert Mongoose document to plain object
    let serviceObj = service.toObject();

    // Process SEO data: find the entry matching the requested language, or fallback to the first one
    let seoData = {};
    if (serviceObj.seo && Array.isArray(serviceObj.seo) && serviceObj.seo.length > 0) {
      seoData = serviceObj.seo.find(item => item.language === language) || serviceObj.seo[0];
    }
    serviceObj.seo = seoData; // Replace the seo array with the selected SEO object

    // Fetch last 4 testimonials from the entire database (not just the service)
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 }) // Sort by latest
      .limit(4);

    // Fetch last 4 related portfolio projects from the same category (excluding the current service's projects)
    const relatedPortfolios = await Portfolio.find({
      category: service.category,
      _id: { $nin: service.recentProjects.map((p) => p._id) },
    })
      .select("name description images category")
      .sort({ createdAt: -1 })
      .limit(4);

    return res.status(200).json({
      success: true,
      data: {
        ...serviceObj,
        testimonials,
        relatedPortfolios,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error fetching service", error: error.message });
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
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      category,
      importance,
      techUsedInService,
      distingoshesUs,
      designPhase,
      seo
    } = req.body;

    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Parse JSON fields
    const parsedImportance = importance ? JSON.parse(importance) : existingService.importance;
    const parsedTechUsedInService = techUsedInService ? JSON.parse(techUsedInService) : existingService.techUsedInService;
    const parsedDistingoshesUs = distingoshesUs ? JSON.parse(distingoshesUs) : existingService.distingoshesUs;
    const parsedDesignPhase = designPhase ? JSON.parse(designPhase) : existingService.designPhase;

    let parsedSeo = existingService.seo;
    if (seo) {
      try {
        parsedSeo = JSON.parse(seo);
        if (!Array.isArray(parsedSeo)) {
          parsedSeo = [parsedSeo];
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid SEO data format", error: error.message });
      }
    }

    const baseUrl = "https://backend.abwabdigital.com:4000/uploads/services";

    // تحديث صورة الخدمة إذا تم رفع صورة جديدة
    const imageUrl = req.files.image?.[0]?.filename
      ? baseUrl + req.files.image[0].filename
      : existingService.image.url;

    // تحديث الأيقونات الخاصة بـ techUsedInService
    if (techUsedInService && req.files.techUsedInServiceIcons) {
      parsedTechUsedInService.forEach((item, index) => {
        item.icon = req.files.techUsedInServiceIcons?.[index]
          ? baseUrl + req.files.techUsedInServiceIcons[index].filename
          : item.icon || "";
      });
    }

    // تحديث الأيقونات الخاصة بـ distingoshesUs
    if (distingoshesUs && req.files.distingoshesUsIcons) {
      parsedDistingoshesUs.forEach((item, index) => {
        item.icon = req.files.distingoshesUsIcons?.[index]
          ? baseUrl + req.files.distingoshesUsIcons[index].filename
          : item.icon || "";
      });
    }

    // تحديث صورة designPhase إن وُجدت
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // تحديث الحقول
    existingService.description = description || existingService.description;
    existingService.category = category || existingService.category;
    existingService.image = { url: imageUrl, altText: "Service Image" };
    existingService.importance = parsedImportance;
    existingService.techUsedInService = parsedTechUsedInService;
    existingService.distingoshesUs = parsedDistingoshesUs;
    existingService.designPhase = parsedDesignPhase;
    existingService.seo = parsedSeo;

    await existingService.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: existingService
    });

  } catch (error) {
    console.error("Update Service Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service",
      error: error.message
    });
  }
};
