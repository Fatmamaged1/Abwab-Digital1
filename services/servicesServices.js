const upload = require("../middleware/upload"); // Import multer middleware
const Service = require("../models/servicesModel"); // Import model
const Portfolio = require("../models/PortfolioModel");
const slugify = require("slugify");
const Testimonial = require("../models/testimonialModel");// تأكد من أن المسار صحيح
exports.createService = async (req, res) => {
  try {
    const {
      name,
      description,         // { en: "", ar: "" }
      category,            // string
      importance,          // [{ desc: { en, ar } }]
      techUsedInService,   // [{ title: { en, ar }, desc: { en, ar } }]
      distingoshesUs,      // [{ title: { en, ar }, description: { en, ar } }]
      designPhase,         // { title, desc, satisfiedClientValues, values }
      seo                  // array of { language, metaTitle, ... }
    } = req.body;

    console.log("Body:", req.body);
    console.log("Uploaded Files:", req.files);

    // Parse fields
    const parsedDescription = JSON.parse(description || '{}');
    const parsedName = JSON.parse(name || '{}');
    const parsedImportance = JSON.parse(importance || '[]');
    const parsedTechUsed = JSON.parse(techUsedInService || '[]');
    const parsedDistingoshes = JSON.parse(distingoshesUs || '[]');
    const parsedDesignPhase = JSON.parse(designPhase || '{}');
    let parsedSeo = [];
    const slug = {
      en: slugify(parsedName?.en || "", { lower: true, strict: true }),
     ar: slugify(parsedName?.ar || "", { lower: true, strict: true }),
    };
    
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

    const baseUrl = "https://backend.abwabdigital.com/uploads/";

    // ✅ Main image is optional now
    const imageUrl = req.files.image?.[0]?.filename
      ? baseUrl + req.files.image[0].filename
      : null;

    // ✅ Add icons to techUsedInService
    parsedTechUsed.forEach((item, i) => {
      item.icon = req.files.techUsedInServiceIcons?.[i]
        ? baseUrl + req.files.techUsedInServiceIcons[i].filename
        : "";
    });

    // ✅ Add icons to distingoshesUs
    parsedDistingoshes.forEach((item, i) => {
      item.icon = req.files.distingoshesUsIcons?.[i]
        ? baseUrl + req.files.distingoshesUsIcons[i].filename
        : "";
    });

    // ✅ Design phase image
    if (req.files.designPhaseImage?.[0]) {
      parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
    }

    // ✅ Create service
    const newService = new Service({
      name: parsedName,
      description: parsedDescription,
      category,
      image: imageUrl
        ? {
            url: imageUrl,
            altText: {
              en: "Service Image",
              ar: "صورة الخدمة",
            },
          }
        : undefined,
      importance: parsedImportance,
      techUsedInService: parsedTechUsed,
      distingoshesUs: parsedDistingoshes,
      designPhase: parsedDesignPhase,
      seo: parsedSeo,
      slug    });

    await newService.save();

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
          id: newService._id,
          name: newService.name, // ✅ Add this line
          description: newService.description,
          slug: newService.slug,
          category: newService.category,
          image: newService.image,
          importance: newService.importance,
          techUsedInService: newService.techUsedInService,
          distingoshesUs: newService.distingoshesUs,
          designPhase: newService.designPhase,
          seo: newService.seo,
          createdAt: newService.createdAt,
        },
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
exports.getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const language = req.query.language || 'en';

    if (!['en', 'ar'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Supported: 'en', 'ar'",
      });
    }

    // ✅ البحث عن الخدمة باستخدام slug من أي لغة
    const service = await Service.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.ar': slug }
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    let serviceObj = service.toObject();

    // 🔤 تخصيص الحقول حسب اللغة المطلوبة
    serviceObj.title = serviceObj.title?.[language] || "";
    serviceObj.description = serviceObj.description?.[language] || "";

    if (Array.isArray(serviceObj.importance)) {
      serviceObj.importance = serviceObj.importance.map(item => ({
        desc: item.desc?.[language] || ""
      }));
    }

    if (Array.isArray(serviceObj.techUsedInService)) {
      serviceObj.techUsedInService = serviceObj.techUsedInService.map(item => ({
        title: item.title?.[language] || "",
        desc: item.desc?.[language] || "",
        icon: item.icon || ""
      }));
    }

    if (Array.isArray(serviceObj.distingoshesUs)) {
      serviceObj.distingoshesUs = serviceObj.distingoshesUs.map(item => ({
        title: item.title?.[language] || "",
        description: item.description?.[language] || "",
        icon: item.icon || ""
      }));
    }

    if (serviceObj.designPhase) {
      serviceObj.designPhase = {
        name: serviceObj.designPhase.name || "",
        title: serviceObj.designPhase.title?.[language] || "",
        desc: serviceObj.designPhase.desc?.[language] || "",
        image: serviceObj.designPhase.image || "",
        slug: serviceObj.designPhase.slug || "",
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

    // 🧠 SEO
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

    // ✅ Testimonials
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 })
      .limit(4);

    // ✅ Related Portfolios
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
    console.error('getServiceBySlug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


// Get service by ID in both Arabic and English with all details
exports.getAllServicesDataById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('recentProjects', 'title description images category')
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Format response with both Arabic and English versions
    const formattedResponse = {
      ar: {
        _id: service._id,
        name: service.name?.ar || '',
        description: service.description?.ar || '',
        category: service.category || '',
        slug: service.slug || '',
        image: {
          url: service.image?.url || '',
          altText: service.image?.altText?.ar || '',
        },
        importance: service.importance?.map(item => ({
          desc: item.desc?.ar || '',
        })) || [],
        techUsedInService: service.techUsedInService?.map(item => ({
          title: item.title?.ar || '',
          desc: item.desc?.ar || '',
          icon: item.icon || '',
        })) || [],
        distingoshesUs: service.distingoshesUs?.map(item => ({
          title: item.title?.ar || '',
          description: item.description?.ar || '',
          icon: item.icon || '',
        })) || [],
        designPhase: service.designPhase ? {
          title: service.designPhase.title?.ar || '',
          desc: service.designPhase.desc?.ar || '',
          image: service.designPhase.image || '',
          satisfiedClientValues: {
            title: service.designPhase.satisfiedClientValues?.title?.ar || '',
          },
          values: service.designPhase.values?.map(v => ({
            title: v.title?.ar || '',
            desc: v.desc?.ar || '',
          })) || [],
        } : null,
        recentProjects: service.recentProjects?.map(project => ({
          _id: project._id,
          title: project.title?.ar || '',
          description: project.description?.ar || '',
          images: project.images || [],
          category: project.category,
        })) || [],
        seo: service.seo?.find(s => s.language === 'ar') || {},
      },
      en: {
        _id: service._id,
        name: service.name?.en || '',
        description: service.description?.en || '',
        category: service.category || '',
        slug: service.slug || '',
        image: {
          url: service.image?.url || '',
          altText: service.image?.altText?.en || '',
        },
        importance: service.importance?.map(item => ({
          desc: item.desc?.en || '',
        })) || [],
        techUsedInService: service.techUsedInService?.map(item => ({
          title: item.title?.en || '',
          desc: item.desc?.en || '',
          icon: item.icon || '',
        })) || [],
        distingoshesUs: service.distingoshesUs?.map(item => ({
          title: item.title?.en || '',
          description: item.description?.en || '',
          icon: item.icon || '',
        })) || [],
        designPhase: service.designPhase ? {
          title: service.designPhase.title?.en || '',
          desc: service.designPhase.desc?.en || '',
          image: service.designPhase.image || '',
          satisfiedClientValues: {
            title: service.designPhase.satisfiedClientValues?.title?.en || '',
          },
          values: service.designPhase.values?.map(v => ({
            title: v.title?.en || '',
            desc: v.desc?.en || '',
          })) || [],
        } : null,
        recentProjects: service.recentProjects?.map(project => ({
          _id: project._id,
          title: project.title?.en || '',
          description: project.description?.en || '',
          images: project.images || [],
          category: project.category,
        })) || [],
        seo: service.seo?.find(s => s.language === 'en') || {},
      },
    };

    return res.status(200).json({
      success: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error('Error in getAllServicesDataById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve service data',
      error: error.message,
    });
  }
};
exports.getAllServices = async (req, res) => {
  try {
    const language = req.query.language || "en";

    const services = await Service.find().select("description name slug category seo");

    const processedServices = services.map(service => {
      const serviceObj = service.toObject();

      // ترجمة الوصف حسب اللغة
      serviceObj.description = serviceObj.description?.[language] || "";

      // ترجمة الاسم حسب اللغة
      serviceObj.name = serviceObj.name?.[language] || "";

      // ترجمة السلوغ حسب اللغة
      serviceObj.slug = serviceObj.slug?.[language] || "";

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
        name: serviceObj.designPhase.name || "",
        title: serviceObj.designPhase.title?.[language] || "",
        desc: serviceObj.designPhase.desc?.[language] || "",
        image: serviceObj.designPhase.image || "",
        slug: serviceObj.designPhase.slug || "",
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
      name,

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

    // ✅ فقط عدّل إذا تم إرسال الحقل
    if (description) {
      existingService.description = parseJSONField(description, existingService.description);
    }

    if (name) {
      existingService.name = parseJSONField(name, existingService.name);;
    }
    if (category) {
      existingService.category = category;
    }

    if (importance) {
      existingService.importance = parseJSONField(importance, existingService.importance);
    }

    if (techUsedInService) {
      const parsedTechUsed = parseJSONField(techUsedInService, existingService.techUsedInService);
      parsedTechUsed.forEach((item, i) => {
        item.icon = req.files.techUsedInServiceIcons?.[i]
          ? baseUrl + req.files.techUsedInServiceIcons[i].filename
          : item.icon || "";
      });
      existingService.techUsedInService = parsedTechUsed;
    }

    if (distingoshesUs) {
      const parsedDistingoshes = parseJSONField(distingoshesUs, existingService.distingoshesUs);
      parsedDistingoshes.forEach((item, i) => {
        item.icon = req.files.distingoshesUsIcons?.[i]
          ? baseUrl + req.files.distingoshesUsIcons[i].filename
          : item.icon || "";
      });
      existingService.distingoshesUs = parsedDistingoshes;
    }

    if (designPhase) {
      const parsedDesignPhase = parseJSONField(designPhase, existingService.designPhase);
      if (req.files.designPhaseImage?.[0]) {
        parsedDesignPhase.image = baseUrl + req.files.designPhaseImage[0].filename;
      }
      existingService.designPhase = parsedDesignPhase;
    }

    if (seo) {
      try {
        let parsedSeo = JSON.parse(seo);
        if (!Array.isArray(parsedSeo)) parsedSeo = [parsedSeo];
        existingService.seo = parsedSeo;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid SEO JSON format",
          error: error.message
        });
      }
    }

    // ✅ تحديث صورة الخدمة الرئيسية فقط إذا تم رفعها
    if (req.files.image?.[0]?.filename) {
      existingService.image = {
        url: baseUrl + req.files.image[0].filename,
        altText: {
          en: "Service Image",
          ar: "صورة الخدمة"
        }
      };
    }

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
