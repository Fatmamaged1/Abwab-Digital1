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
    const baseUrl = "https://backend.abwabdigital.com/uploads/";

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
    const language = req.query.language || "en";

    const services = await Service.find().select("description category seo");

    const processedServices = services.map(service => {
      const serviceObj = service.toObject();

      // ترجمة الوصف حسب اللغة
      serviceObj.description = serviceObj.description?.[language] || "";

      // SEO باللغة المطلوبة
      const matchedSeo = Array.isArray(serviceObj.seo)
        ? serviceObj.seo.find(s => s.language === language) || serviceObj.seo[0]
        : null;

      serviceObj.seo = matchedSeo || {
        language,
        metaTitle: "Default Meta Title",
        metaDescription: "Default meta description.",
        keywords: "default,service,seo",
        canonicalTag: "",
        structuredData: {}
      };

      return serviceObj;
    });

    const globalSeo = {
      language,
      metaTitle: language === "en" ? "Our Services" : "خدماتنا",
      metaDescription: language === "en"
        ? "Discover our wide range of services."
        : "اكتشف مجموعة خدماتنا المتنوعة.",
      keywords: language === "en"
        ? "services, company, solutions"
        : "خدمات, شركة, حلول",
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
    return res.status(500).json({ success: false, message: "Error fetching services", error: error.message });
  }
};





exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.language || "en";

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    let serviceObj = service.toObject();

    // 🟢 استخراج الحقول حسب اللغة
    serviceObj.description = serviceObj.description?.[language] || "";

    // importance
    if (Array.isArray(serviceObj.importance)) {
      serviceObj.importance = serviceObj.importance.map(item => ({
        desc: item.desc?.[language] || ""
      }));
    }

    // techUsedInService
    if (Array.isArray(serviceObj.techUsedInService)) {
      serviceObj.techUsedInService = serviceObj.techUsedInService.map(item => ({
        title: item.title?.[language] || "",
        desc: item.desc?.[language] || "",
        icon: item.icon || ""
      }));
    }

    // distingoshesUs
    if (Array.isArray(serviceObj.distingoshesUs)) {
      serviceObj.distingoshesUs = serviceObj.distingoshesUs.map(item => ({
        title: item.title?.[language] || "",
        description: item.description?.[language] || "",
        icon: item.icon || ""
      }));
    }

    // designPhase
    if (serviceObj.designPhase) {
      serviceObj.designPhase = {
        title: serviceObj.designPhase.title?.[language] || "",
        desc: serviceObj.designPhase.desc?.[language] || "",
        image: serviceObj.designPhase.image || "",
        satisfiedClientValues: {
          title: serviceObj.designPhase.satisfiedClientValues?.title?.[language] || ""
        },
        values: Array.isArray(serviceObj.designPhase.values)
          ? serviceObj.designPhase.values.map(v => ({
              title: v.title?.[language] || "",
              desc: v.desc?.[language] || ""
            }))
          : []
      };
    }

    // seo
    const matchedSeo = Array.isArray(serviceObj.seo)
      ? serviceObj.seo.find(s => s.language === language) || serviceObj.seo[0]
      : null;

    serviceObj.seo = matchedSeo || {
      language,
      metaTitle: "Default Meta Title",
      metaDescription: "Default meta description.",
      keywords: "default,service,seo",
      canonicalTag: "",
      structuredData: {}
    };

    // testimonials
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 })
      .limit(4);

    // related portfolios
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

    const baseUrl = "https://backend.abwabdigital.com/uploads/";

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
