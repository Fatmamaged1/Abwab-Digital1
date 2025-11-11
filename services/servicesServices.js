// services/servicesServices.js
const Service = require("../models/servicesModel");
const { processSeoData } = require("./seoService");
const { formatService } = require("../utils/formatingBody");
const {getLocalizedText} = require("../utils/formatingBody");
const { parseRequsetFields ,createDefaultSeo } = require("../utils/reqParser");
const Project = require("../models/projectModel");
const slugify = require("slugify");

const slugifyArabic = (text) => {
  if (!text) return "خدمة";
  return String(text)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[؟?،,:;!"'“”‘’]/g, "")
    .replace(/[^\u0621-\u064A0-9\-]/g, "")
    .toLowerCase();
};

const ensureUniqueSlug = async (slugObj) => {
  const enSlug = slugify(slugObj.en || "service", {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  const arSlug = slugifyArabic(slugObj.ar || "خدمة");

  const existing = await Service.findOne({
    $or: [{ "slug.en": enSlug }, { "slug.ar": arSlug }],
  });

  if (!existing) return { en: enSlug, ar: arSlug };

  const timestamp = Date.now();
  return { en: `${enSlug}-${timestamp}`, ar: `${arSlug}-${timestamp}` };
};

const processFileUploads = (files, data) => {
  const processed = { ...data };
  const baseUrl = process.env.BASE_URL || "https://backend.abwabdigital.com";

  if (files.bannerImage?.[0]?.filename) {
    const bannerFile = files.bannerImage[0];
    processed.bannerImage = {
      url: `${baseUrl}/uploads/${bannerFile.filename}`,
      alt: processed.bannerImage?.alt || {
        en: "Banner Image",
        ar: "صورة البانر",
      },
    };
  }

  if (files.sectionImages?.length && Array.isArray(processed.parsedHeaders)) {
    files.sectionImages.forEach((file, i) => {
      if (file?.filename && processed.parsedHeaders[i]) {
        processed.parsedHeaders[i].image = {
          url: `${baseUrl}/uploads/${file.filename}`,
          alt: processed.parsedHeaders[i].title || {
            en: "Section Image",
            ar: "صورة القسم",
          },
        };
      }
    });
  }

  if (files.importanceImages?.length && Array.isArray(processed.parsedImportance)) {
    files.importanceImages.forEach((file, i) => {
      if (file?.filename && processed.parsedImportance[i]) {
        processed.parsedImportance[i].image = {
          url: `${baseUrl}/uploads/${file.filename}`,
          alt: processed.parsedImportance[i].title || {
            en: "Importance Image",
            ar: "صورة الأهمية",
          },
        };
      }
    });
  }

  if (files.implementProcessImages?.length && Array.isArray(processed.parsedImplementProcess)) {
    files.implementProcessImages.forEach((file, i) => {
      if (file?.filename && processed.parsedImplementProcess[i]) {
        processed.parsedImplementProcess[i].image = {
          url: `${baseUrl}/uploads/${file.filename}`,
          alt: processed.parsedImplementProcess[i].title || {
            en: "Process Image",
            ar: "صورة العملية",
          },
        };
      }
    });
  }

  return processed;
};

exports.createService = async (req, res) => {
  try {
    const processedData = await parseRequsetFields(req.body);
    const { files = {} } = req;

    const defaultTitle = { en: "Service", ar: "خدمة" };
    const firstHeader = processedData.parsedHeaders?.[0] || {
      title: defaultTitle,
      description: { en: "Professional service", ar: "خدمة احترافية" },
    };

    const title = {
      en: firstHeader?.title?.en || defaultTitle.en,
      ar: firstHeader?.title?.ar || firstHeader?.title?.en || defaultTitle.ar,
    };

    const finalSlug = await ensureUniqueSlug(title);
    const processedDataWithFiles = processFileUploads(files, processedData);

    const defaultSeoValues = {
      metaTitle: title.en,
      metaDescription: firstHeader?.description?.en || "Professional service",
      openGraph: {
        image: processedDataWithFiles.bannerImage?.url,
        title: title.en,
      },
      twitter: {
        image: processedDataWithFiles.bannerImage?.url,
        title: title.en,
      },
      canonicalUrl: `https://abwabdigital.com/services/${finalSlug.en}`,
    };

    const processedSeo = processSeoData(processedData.parsedSeo, defaultSeoValues);

    const projects = [];
    if (Array.isArray(processedData.parsedProjects)) {
      for (const project of processedData.parsedProjects) {
        if (!project.projectId) {
          console.warn('Skipping project without projectId:', project);
          continue;
        }
        
        // Check if project exists
        const projectExists = await Project.exists({ _id: project.projectId });
        if (!projectExists) {
          console.warn(`Project with ID ${project.projectId} not found`);
          continue;
        }
        
        projects.push({
          projectId: project.projectId,
          order: project.order || 0,
          isActive: project.isActive !== false
        });
      }
    }

    // Final object for Mongo
    const serviceData = {
      slug: finalSlug,
      header: processedData.parsedHeaders || [],
      importance: processedData.parsedImportance || [],
      implementProcess: processedData.parsedImplementProcess || [],
      bannerImage: processedDataWithFiles.bannerImage,
      packages: processedData.parsedPackages || [],
      faq: processedData.parsedFaq || [],
      projects: projects, // Use validated projects array
      seo: processedSeo,
    };

    const service = await Service.create(serviceData);
    const populatedService = await Service.findById(service._id)
      .populate({
        path: "projects.projectId",
        select: "name startDate endDate client status image",
      });

    const formatted = await formatService(populatedService);
    
    return {
      success: true,
      message: "Service created successfully",
      data: formatted,
    };
      
  } catch (error) {
    console.error("Error in createService:", error);
    throw error;
  }
};

exports.getServicesBySlug = async (slug , lang="en") => {
  try {
    const service = await Service.findOne({ $or: [{ "slug.en": slug }, { "slug.ar": slug }] })
    .populate({
      path: "projects.projectId",
      select: "name startDate endDate client status image",
    });
    if (!service) {
      throw new Error("Service not found");
    }
    const formatted = await formatService(service, lang);
    return {
      success: true,
      message: "Service retrieved successfully",
      data: formatted,
    };
  } catch (error) {
    console.error("Error in getServicesBySlug:", error);
    throw error;
  }
};

exports.getServiceById = async (id , lang="en") => {
  try {
    const service = await Service.findById(id)
    .populate({
      path: "projects.projectId",
      select: "name startDate endDate client status image",
    });
    if (!service) {
      throw new Error("Service not found");
    }
    const formatted = await formatService(service, lang);
    return {
      success: true,
      message: "Service retrieved successfully",
      data: formatted,
    };
  } catch (error) {
    console.error("Error in getServiceById:", error);
    throw error;
  }
};

exports.getAllServices = async (lang = "en") => {
  try {
    const services = await Service.find({}, { slug: 1, header: 1 }).sort({createdAt: -1});

    const formatted = services.map(service => {
      const header = service.header?.[0] || {};
      return {
        id: service._id?.toString(),
        slug: service.slug,
        title: getLocalizedText(header?.title, lang),
        description: getLocalizedText(header?.description, lang),
      };
    });

    return {
      success: true,
      message: "Services retrieved successfully",
      data: formatted,
    };
  } catch (error) {
    console.error("Error in getAllServices:", error);
    throw error;
  }
};

exports.updateService = async (id, updateData) => {
  try {
    // Log the incoming data for debugging
    console.log('Raw update data:', JSON.stringify(updateData, null, 2));
    
    // Parse the update data if it's a string
    const parsedData = typeof updateData === 'string' ? JSON.parse(updateData) : updateData;
    
    // Process the data using parseRequsetFields
    let processedData = {};
    try {
      // For updates, we need to handle both direct fields and nested objects
      if (parsedData.files) {
        // Handle file uploads
        processedData = await parseRequsetFields({
          ...parsedData,
          ...parsedData.files
        });
        delete processedData.files;
      } else {
        // Handle regular updates
        processedData = await parseRequsetFields(parsedData);
      }
      
      // Log the processed data
      console.log('Processed data:', JSON.stringify(processedData, null, 2));
      
      // Clean up the data - remove any undefined or null values
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined || processedData[key] === null) {
          delete processedData[key];
        }
      });

      // Handle array updates (like header, importance, etc.)
      const arrayFields = ['header', 'importance', 'implementProcess', 'packages', 'faq', 'projects'];
      arrayFields.forEach(field => {
        if (parsedData[field] !== undefined) {
          processedData[field] = parsedData[field];
        }
      });

      // Update the service
      const updatedService = await Service.findByIdAndUpdate(
  id,
  { $set: processedData },
  { new: true, runValidators: true }
);

const fullService = await Service.findById(updatedService._id)
  .populate({
    path: "projects.projectId",
    select: "name startDate endDate client status image",
  });

const formatted = await formatService(fullService);

      return {
        success: true,
        message: "Service updated successfully",
        data: formatted,
      };
    } catch (parseError) {
      console.error('Error parsing request data:', parseError);
      throw new Error(`Invalid request data format: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in updateService:", error);
    throw error;
  }
};
