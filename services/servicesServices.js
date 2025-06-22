const upload = require("../middleware/upload"); // Import multer middleware
const Service = require("../models/servicesModel"); // Import model
const Portfolio = require("../models/PortfolioModel");
const Testimonial = require("../models/testimonialModel");// تأكد من أن المسار صحيح
exports.createService = async (req, res) => {
  try {
    const {
      description,         // { en: "", ar: "" }
      category,            // string
      importance,          // [{ desc: { en, ar } }]
      techUsedInService,   // [{ title: { en, ar }, desc: { en, ar } }]
      distingoshesUs,      // [{ title: { en, ar }, description: { en, ar } }]
      designPhase,         // { title: { en, ar }, desc: { en, ar }, satisfiedClientValues: { title: { en, ar } }, values: [{ title, desc }] }
      seo                  // array of { language, metaTitle, metaDescription, keywords }
    } = req.body;

    console.log("Body:", req.body);
    console.log("Uploaded Files:", req.files);

    // Parse fields
    const parsedDescription = JSON.parse(description || '{}');
    const parsedImportance = JSON.parse(importance || '[]');
    const parsedTechUsed = JSON.parse(techUsedInService || '[]');
    const parsedDistingoshes = JSON.parse(distingoshesUs || '[]');
    const parsedDesignPhase = JSON.parse(designPhase || '{}');
    let parsedSeo = [];

    if (seo) {
      try {
        parsedSeo = JSON.parse(seo);
        if (!Array.isArray(parsedSeo)) parsedSeo = [parsedSeo];
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid SEO JSON format",
          error: err.message,
        });
      }
    }

    // Base URL for images
    const baseUrl = "https://Backend.abwabdigital.com/uploads/";

    // Main service image
    const imageUrl = req.files.image?.[0]?.filename
      ? baseUrl + req.files.image[0].filename
      : null;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Main service image is required.",
      });
    }

    // Assign icons to techUsedInService
    parsedTechUsed.forEach((item, i) => {
      item.icon = req.files.techUsedInServiceIcons?.[i]
        ? baseUrl + req.files.techUsedInServiceIcons[i].filename
        : "";
    });

    // Assign icons to distingoshesUs
    parsedDistingoshes.forEach((item, i) => {
      item.icon = req.files.distingoshesUsIcons?.[i]
        ? baseUrl + req.files.distingoshesUsIcons[i].filename
        : "";
    });

    // Assign image to designPhase
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // Create the new service
    const newService = new Service({
      description: parsedDescription,         // { en, ar }
      category,                               // string
      image: {
        url: imageUrl,
        altText: {
          en: "Service Image",
          ar: "صورة الخدمة"
        }
      },
      importance: parsedImportance,            // array of { desc: { en, ar } }
      techUsedInService: parsedTechUsed,       // array with icon
      distingoshesUs: parsedDistingoshes,      // array with icon
      designPhase: parsedDesignPhase,          // full object
      seo: parsedSeo                           // array of SEO objects
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService,
    });

  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
const parseJSONField = (field, defaultValue) => {
  try {
    const parsed = JSON.parse(field);
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
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

    const baseUrl = "https://Backend.abwabdigital.com/uploads/";

    // ✅ Parse JSON fields
    const parsedDescription = parseJSONField(description, existingService.description);
    const parsedImportance = parseJSONField(importance, existingService.importance);
    const parsedTechUsed = parseJSONField(techUsedInService, existingService.techUsedInService);
    const parsedDistingoshes = parseJSONField(distingoshesUs, existingService.distingoshesUs);
    const parsedDesignPhase = parseJSONField(designPhase, existingService.designPhase);

    let parsedSeo = existingService.seo;
    if (seo) {
      try {
        parsedSeo = JSON.parse(seo);
        if (!Array.isArray(parsedSeo)) parsedSeo = [parsedSeo];
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid SEO JSON format",
          error: error.message
        });
      }
    }

    // ✅ Image: main service image
    const imageUrl = req.files.image?.[0]?.filename
      ? baseUrl + req.files.image[0].filename
      : existingService.image?.url;

    // ✅ Assign icons to techUsedInService
    parsedTechUsed.forEach((item, i) => {
      item.icon = req.files.techUsedInServiceIcons?.[i]
        ? baseUrl + req.files.techUsedInServiceIcons[i].filename
        : item.icon || "";
    });

    // ✅ Assign icons to distingoshesUs
    parsedDistingoshes.forEach((item, i) => {
      item.icon = req.files.distingoshesUsIcons?.[i]
        ? baseUrl + req.files.distingoshesUsIcons[i].filename
        : item.icon || "";
    });

    // ✅ Design phase image
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // ✅ Update existing service
    existingService.description = parsedDescription;
    existingService.category = category || existingService.category;
    existingService.image = {
      url: imageUrl,
      altText: {
        en: "Service Image",
        ar: "صورة الخدمة"
      }
    };
    existingService.importance = parsedImportance;
    existingService.techUsedInService = parsedTechUsed;
    existingService.distingoshesUs = parsedDistingoshes;
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
