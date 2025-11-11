const Project = require("../models/projectModel");


const DEFAULT_BASE_URL = process.env.BASE_URL || 'https://backend.abwabdigital.com';

const getLocalizedText = (obj, lang) => obj?.[lang] || obj?.en || obj?.ar || "";
const formatImage = (image, lang = "en", defaultAlt = "Image") => {
  if (!image || !image.url) return null;

  const fullUrl = image.url.startsWith("http")
    ? image.url
    : `${DEFAULT_BASE_URL}/uploads/${image.url.replace(/^uploads\//, "")}`;

  return {
    url: fullUrl,
    alt: getLocalizedText(image.alt, lang) || defaultAlt
  };
};

const formatSection = (section, lang) => {
  if (!section) return null;
  return {
    title: getLocalizedText(section.title, lang),
    description: getLocalizedText(section.description, lang),
    order: Number(section.order) || 0,
    isActive: section.isActive !== false,
    ...(section.image && { image: formatImage(section.image, lang) })
  };
};

const formatSections = (sections = [], lang) =>
  Array.isArray(sections) ? sections.map((s) => formatSection(s, lang)) : [];

const formatImplementProcess = (processSteps = [], lang) =>
  processSteps.map((step) => ({
    title: getLocalizedText(step.title, lang),
    description: getLocalizedText(step.description, lang),
    order: Number(step.order) || 0,
    isActive: step.isActive !== false,
    ...(step.image && { image: formatImage(step.image, lang) }),
    sections: (step.sections || []).map(section => ({
      ...formatSection(section, lang),
      ...(section.image && { image: formatImage(section.image, lang) })
    }))
  }));

const formatPackages = (packages = [], lang) =>
  packages.map((pkg) => ({
    id: pkg._id?.toString() || pkg.id,
    title: getLocalizedText(pkg.title, lang),
    description: getLocalizedText(pkg.description, lang),
    price: {
      amount: pkg.price?.amount || Number(pkg.price) || 0,
      currency: pkg.price?.currency || "USD"
    },
    features: (pkg.features || []).map((f) =>
      typeof f === "object" ? getLocalizedText(f, lang) : f
    ),
    isPopular: !!pkg.isPopular,
    isActive: pkg.isActive !== false,
    order: Number(pkg.order) || 0
  }));

const formatFaq = (faqItems = [], lang) =>
  faqItems
    .filter((item) => item)
    .map((item) => {
      const questions = (item.questions || [])
        .filter((q) => q && (q.question || q.answer))
        .map((q) => ({
          id: q._id?.toString() || q.id,
          question: getLocalizedText(q.question, lang) || "Untitled question",
          answer: getLocalizedText(q.answer, lang) || "No answer provided",
          order: Number(q.order) || 0,
          isActive: q.isActive !== false
        }));

      return {
        id: item._id?.toString() || item.id,
        title: getLocalizedText(item.title, lang) || "General",
        description: getLocalizedText(item.description, lang),
        questions
      };
    });

const formatImportance = (importance = [], lang) =>
  importance.map((imp) => ({
    title: getLocalizedText(imp.title, lang),
    description: getLocalizedText(imp.description, lang),
    order: Number(imp.order) || 0,
    isActive: imp.isActive !== false,
    ...(imp.image && { image: formatImage(imp.image, lang) })
  }));
const formatProjects = async (projects = [], lang) => {
  if (!Array.isArray(projects)) return [];

  const projectIds = projects
    .map(p => p.projectId || p._id || p.id)
    .filter(Boolean);
  const projectDocs = await Project.find({ _id: { $in: projectIds } }).lean();

  return projectDocs.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    client: p.client,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    budget: p.budget,
    currency: p.currency,
    order: projects.find(x => x.projectId?.toString() === p._id.toString())?.order || 0,
    isActive: projects.find(x => x.projectId?.toString() === p._id.toString())?.isActive !== false
  }));
};

const formatService = async (service, lang = "en") => {
  if (!service) return null;

  try {
    const formattedService = {
      id: service._id?.toString() || service.id,
      slug: service.slug || { en: '', ar: '' },
      header: (service.header || []).map((header) => ({
        title: getLocalizedText(header?.title, lang),
        description: getLocalizedText(header?.description, lang),
        order: Number(header?.order) || 0,
        isActive: header?.isActive !== false,
        ...(header?.image && { image: formatImage(header.image, lang) })
      })),
      importance: formatImportance(service.importance || [], lang),
      implementProcess: formatImplementProcess(service.implementProcess || [], lang),
      projects: await formatProjects(service.projects || [], lang),
      packages: formatPackages(service.packages || [], lang),
      faq: formatFaq(service.faq || [], lang),
      ...(service.bannerImage && { bannerImage: formatImage(service.bannerImage, lang, "Banner Image") }),
      ...(service.createdAt && { createdAt: service.createdAt }),
      ...(service.updatedAt && { updatedAt: service.updatedAt })
    };
    return formattedService;
  } catch (error) {
    console.error('Error formatting service:', error);
    throw error;
  }
};

module.exports = {
  formatSection,
  formatSections,
  formatImplementProcess,
  formatProjects,
  formatPackages,
  formatFaq,
  formatService
};
