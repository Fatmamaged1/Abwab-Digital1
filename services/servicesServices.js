// services/servicesServices.js
const Service = require("../models/servicesModel");
const { processSeoData } = require("./seoService");
const { formatService } = require("../utils/formatingBody");
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
