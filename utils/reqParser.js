const Project = require('../models/projectModel');
const DEFAULT_BASE_URL = process.env.BASE_URL || "https://backend.abwabdigital.com";

const parseField = (field, defaultValue) => {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (e) {
    console.error('Error parsing field:', e);
    return defaultValue;
  }
};

const parseLocalizedFields = (obj = {}, fields = []) => {
  const result = {};
  fields.forEach(field => {
    result[field] = {
      en: obj[field]?.en || '',
      ar: obj[field]?.ar || ''
    };
  });
  return result;
};

const createDefaultSeo = (title, description, imageUrl) => ({
  metaTitle: title,
  metaDescription: description,
  openGraph: {
    title,
    description,
    image: imageUrl,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    image: imageUrl
  }
});

const parseRequsetFields = async (body = {}) => {
  try {
    // Validate required fields
    if (!body.seo) {
      throw new Error('SEO data is required');
    }

    const ParsedBody = {
      parsedHeaders: parseField(body.headerSections, []).map(section => ({
        ...parseLocalizedFields(section, ['title', 'description']),
        order: Number(section.order) || 0,
        isActive: section.isActive !== false,
        ...(section.image && { image: parseField(section.image) })
      })),

      parsedImportance: parseField(body.importanceSections, []).map(section => ({
        ...parseLocalizedFields(section, ['title', 'description']),
        order: Number(section.order) || 0,
        isActive: section.isActive !== false,
        ...(section.image && { image: parseField(section.image) })
      })),

      parsedImplementProcess: parseField(body.implementProcess, []).map(process => ({
        ...parseLocalizedFields(process, ['title', 'description']),
        order: process.order || 0,
        isActive: process.isActive !== false,
        ...(process.image?.url && { image: parseField(process.image) }),
        sections: parseField(process.sections, []).map(section => ({
          ...parseLocalizedFields(section, ['title', 'description']),
          order: section.order || 0,
          isActive: section.isActive !== false,
          ...(section.image && { image: parseField(section.image) })
        }))
      })),

      parsedPackages: parseField(body.packages, []).map(pkg => ({
        ...parseLocalizedFields(pkg, ['title', 'description']),
        price: Number(pkg.price) || 0,
        features: parseField(pkg.features, []),
        order: pkg.order || 0,
        isActive: pkg.isActive !== false
      })),

      parsedFaq: parseField(body.faq, []).map(faq => ({
        ...parseLocalizedFields(faq, ['title', 'description']),
        order: faq.order || 0,
        isActive: faq.isActive !== false,
        questions: parseField(faq.questions, []).map(q => ({
          ...parseLocalizedFields(q, ['question', 'answer']),
          order: q.order || 0,
          isActive: q.isActive !== false
        }))
      })),

      parsedProjects: (await Promise.all(
        parseField(body.projects, []).map(async (proj) => {
          try {
            if (!proj || !proj.projectId) {
              console.warn('Skipping invalid project:', proj);
              return null;
            }
            
            const project = await Project.findById(proj.projectId)
              .select("name client status images budget currency")
              .lean();
              
            if (!project) {
              console.warn(`Project with ID ${proj.projectId} not found`);
              return null;
            }

            return {
              projectId: project._id,
              name: project.name,
              client: project.client,
              status: project.status,
              images: (project.images || []).map(img =>
                typeof img === "string" ? { url: `${DEFAULT_BASE_URL}/uploads/${img}` } : img
              ),
              budget: project.budget || 0,
              currency: project.currency || "USD",
              order: proj.order || 0,
              isActive: proj.isActive !== false
            };
          } catch (error) {
            console.error('Error processing project:', error);
            return null;
          }
        })
      )).filter(Boolean),

      parsedSeo: parseField(body.seo, {
        metaTitle: body.seo.metaTitle || 'Default Title',
        metaDescription: body.seo.metaDescription || 'Default Description',
        openGraph: {
          title: body.seo.openGraph?.title || body.seo.metaTitle || 'Default Title',
          description: body.seo.openGraph?.description || body.seo.metaDescription || 'Default Description',
          image: body.seo.openGraph?.image || body.image?.url || body.image || '',
          type: body.seo.openGraph?.type || 'website'
        },
        twitter: {
          card: body.seo.twitter?.card || 'summary_large_image',
          title: body.seo.twitter?.title || body.seo.metaTitle || 'Default Title',
          description: body.seo.twitter?.description || body.seo.metaDescription || 'Default Description',
          image: body.seo.twitter?.image || body.seo.openGraph?.image || body.image?.url || body.image || ''
        }
      })
    };

    return ParsedBody;
  } catch (err) {
    console.error(err);
    throw new Error("Invalid request format");
  }
};

module.exports = {
  parseRequsetFields,
  parseField,
  parseLocalizedFields,
  createDefaultSeo
};
