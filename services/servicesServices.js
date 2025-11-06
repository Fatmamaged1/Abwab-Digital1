require('dotenv').config();
const Service = require("../models/servicesModel");
const Project = require("../models/projectModel");
const Portfolio = require("../models/PortfolioModel");
const slugify = require("slugify");

const API_BASE_URL = process.env.API_BASE_URL || 'https://backend.abwabdigital.com';
const UPLOADS_BASE_URL = `${process.env.BASE_URL || API_BASE_URL}/uploads/`;

const parseField = (field, defaultValue) => {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (e) {
    return defaultValue;
  }
};

const createDefaultSeo = (language = 'en', overrides = {}) => ({
  language,
  metaTitle: (overrides.metaTitle || 'Service').substring(0, 70),
  metaDescription: (overrides.metaDescription || 'Professional service').substring(0, 160),
  keywords: overrides.keywords || 'service, professional',
  canonicalUrl: overrides.canonicalUrl || '',
  robots: { noindex: false, nofollow: false, noimageindex: false, ...(overrides.robots || {}) },
  openGraph: {
    title: (overrides.openGraph?.title || overrides.metaTitle || 'Service').substring(0, 70),
    description: (overrides.openGraph?.description || overrides.metaDescription || 'Professional service with expert solutions').substring(0, 200),
    image: overrides.openGraph?.image || '',
    imageAlt: (overrides.openGraph?.imageAlt || '').substring(0, 100),
    ...(overrides.openGraph || {})
  },
  twitter: {
    title: (overrides.twitter?.title || overrides.metaTitle || 'Service').substring(0, 70),
    description: (overrides.twitter?.description || overrides.metaDescription || 'Professional service with expert solutions').substring(0, 200),
    image: overrides.twitter?.image || '',
    imageAlt: (overrides.twitter?.imageAlt || '').substring(0, 100),
    ...(overrides.twitter || {})
  },
  structuredData: overrides.structuredData || {}
});

const mapText = (obj, lang) => (obj?.[lang] || '');

const formatSection = (section, lang) => {
  if (!section) return null;
  const formatted = {
    title: mapText(section.title, lang),
    description: mapText(section.description, lang),
    order: section.order || 0,
    isActive: section.isActive !== false
  };

  if (section.image?.url) {
    formatted.image = section.image.url.startsWith('http') 
      ? section.image.url 
      : `${process.env.BASE_URL || 'https://backend.abwabdigital.com/api/v1/'}${section.image.url}`;
    
    if (section.image.alt) {
      formatted.imageAlt = mapText(section.image.alt, lang);
    }
  }

  if (section.subsections?.length) {
    formatted.subsections = section.subsections.map(sub => formatSection(sub, lang));
  }
  return formatted;
};

const formatSections = (sections, lang) => 
  Array.isArray(sections) ? sections.map(s => formatSection(s, lang)) : [];

const formatImplementProcess = (implementProcess = [], lang) => {
  if (!Array.isArray(implementProcess)) return [];
  
  return implementProcess.map(process => ({
    title: mapText(process.title, lang),
    description: mapText(process.description, lang),
    image: process.image ? {
      url: process.image.url || '',
      alt: mapText(process.image.alt || {}, lang)
    } : null,
    sections: formatSections(process.sections, lang)
  }));
};

const formatBannerImage = (bannerImage, lang) => ({
  url: bannerImage?.url || '',
  alt: mapText(bannerImage?.alt || {}, lang)
});

const formatProjects = (projects = [], lang) => 
  projects.map(project => ({
    id: project._id || project.id,
    name: mapText(project.name, lang),
    client: project.client,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate
  }));

const formatPackages = (packages = [], lang) => 
  packages.map(pkg => ({
    id: pkg._id || pkg.id,
    title: mapText(pkg.title, lang),
    description: mapText(pkg.description, lang),
    price: pkg.price,
    features: (pkg.features || []).map(f => mapText(f, lang)),
    isPopular: !!pkg.isPopular,
    isActive: pkg.isActive !== false,
    order: pkg.order || 0
  }));

const formatFaq = (faq = [], lang) => 
  faq.map(item => ({
    id: item._id || item.id,
    title: mapText(item.title, lang),
    description: mapText(item.description, lang),
    questions: (item.questions || []).map(q => ({
      question: mapText(q.question, lang),
      answer: mapText(q.answer, lang),
      order: q.order || 0,
      isActive: q.isActive !== false
    }))
  }));

const pickSeoForLanguage = (seo = [], lang) => 
  seo.find(s => s.language === lang) || seo[0] || {
    language: lang,
    metaTitle: "Default Meta Title",
    metaDescription: "Default meta description.",
    keywords: "default,service,seo",
    canonicalTag: "", 
    structuredData: {}
  };

// Ensure unique slug for create and update
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let candidate = { ...baseSlug };
  let counter = 0;
  // eslint-disable-next-line no-constant-condition
  while (await Service.exists({
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [
      { 'slug.en': candidate.en },
      { 'slug.ar': candidate.ar }
    ]
  })) {
    counter += 1;
    // For English: add counter with hyphen
    const enSuffix = `-${counter}`;
    // For Arabic: add counter with Arabic hyphen (ـ)
    const arSuffix = `-${counter}`; // Using regular hyphen for consistency
    
    candidate = {
      en: baseSlug.en.endsWith(enSuffix) 
        ? `${baseSlug.en.substring(0, baseSlug.en.lastIndexOf('-'))}${enSuffix}` 
        : `${baseSlug.en}${enSuffix}`,
      ar: baseSlug.ar.endsWith(arSuffix) 
        ? `${baseSlug.ar.substring(0, baseSlug.ar.lastIndexOf('-'))}${arSuffix}` 
        : `${baseSlug.ar}${arSuffix}`
    };
  }
  return candidate;
};

const formatServiceForLanguage = (serviceDoc, lang) => {
  const obj = serviceDoc.toObject?.() || serviceDoc;
  return {
    seo: [pickSeoForLanguage(obj.seo, lang)],
    slug: obj.slug,
    header: formatSections(obj.header, lang),
    implementProcess: formatImplementProcess(obj.implementProcess, lang),
    importance: formatSections(obj.importance, lang),
    bannerImage: formatBannerImage(obj.bannerImage, lang),
    projects: formatProjects(obj.projects, lang),
    packages: formatPackages(obj.packages, lang),
    faq: formatFaq(obj.faq, lang),
    _id: obj._id,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    __v: obj.__v
  };
};

exports.createService = async (req, res) => {
  try {
    const { 
      implementProcess = [], 
      bannerImage = {}, 
      projects = [], 
      packages = [], 
      faq = [], 
      seo = [],
      importance = [],
      header = []
    } = req.body;

    console.log("Body:", req.body);
    console.log("Uploaded Files:", req.files);

    // Parse all fields
    const parsedHeaders = parseField(header, []);
    const parsedBannerImage = parseField(bannerImage, {});
    const parsedImportance = parseField(importance, []);
    const parsedProjects = parseField(projects, []);
    const parsedPackages = parseField(packages, []);
    const parsedFaq = parseField(faq, []);
    const parsedSeo = parseField(seo, []);
    
    // Process implementProcess with proper structure
    let parsedImplementProcess = [];
    try {
      console.log('Raw implementProcess input:', implementProcess);
      const rawImplementProcess = parseField(implementProcess, []);
      console.log('After parseField:', JSON.stringify(rawImplementProcess, null, 2));
      
      if (Array.isArray(rawImplementProcess)) {
        parsedImplementProcess = rawImplementProcess.map((process, index) => {
          console.log(`Processing process ${index}:`, JSON.stringify(process, null, 2));
          return {
            title: process?.title || { en: '', ar: '' },
            description: process?.description || { en: '', ar: '' },
            image: process?.image || null,
            sections: Array.isArray(process?.sections) 
              ? process.sections.map((section, secIndex) => {
                  console.log(`  Processing section ${secIndex} in process ${index}:`, JSON.stringify(section, null, 2));
                  return {
                    title: section?.title || { en: '', ar: '' },
                    description: section?.description || { en: '', ar: '' },
                    image: section?.image || null,
                    order: section?.order || 0,
                    isActive: section?.isActive !== false
                  };
                })
              : []
          };
        });
      }
      console.log('Final parsedImplementProcess:', JSON.stringify(parsedImplementProcess, null, 2));
    } catch (error) {
      console.error('Error processing implementProcess:', error);
      parsedImplementProcess = [];
    }

   // helper to make arabic slug readable
const slugifyArabic = (text = '') => {
  return text
    .trim()
    .replace(/\s+/g, '-') // استبدال المسافات بـ -
    .replace(/[؟?،,:;!'"“”‘’]/g, '') // حذف الرموز
    .replace(/[\u0640]+/g, '') // حذف التمديدات (ــــ)
    .replace(/[^\u0621-\u064A0-9\-]/g, '') // يسمح فقط بالحروف العربية والأرقام والشرطة
    .toLowerCase();
};

const slug = {
  en: slugify(parsedHeaders?.[0]?.title?.en || 'service', { 
    lower: true, 
    strict: true,
    remove: /[*+~.()'"!:@]/g
  }),
  ar: slugifyArabic(parsedHeaders?.[0]?.title?.ar || 'خدمة')
};

      const finalSlug = await ensureUniqueSlug(slug);
    
    const baseUrl = process.env.BASE_URL || 'https://backend.abwabdigital.com/uploads/';
    const files = req.files || {};
    
    // Process banner image first
    let bannerImageUrl = null;
    if (files.bannerImage?.[0]?.filename) {
      // Use the exact filename from Multer without any modifications
      const bannerFile = files.bannerImage[0];
      bannerImageUrl = `${UPLOADS_BASE_URL}${bannerFile.filename}`;
      console.log('Banner image original name:', bannerFile.originalname);
      console.log('Banner image saved as:', bannerFile.filename);
      console.log('Banner image URL:', bannerImageUrl);
      
      // Update the bannerImage object with the new URL
      if (parsedBannerImage) {
        parsedBannerImage.url = bannerImageUrl;
      }
    }

    // Process SEO data with robust error handling
    let processedSeo = [];
    
    try {
      if (parsedSeo) {
        // Handle array of SEO objects
        if (Array.isArray(parsedSeo)) {
          processedSeo = parsedSeo.map(seoItem => {
            // Ensure we have a valid object
            if (!seoItem || typeof seoItem !== 'object') {
              return createDefaultSeo('en');
            }
            
            // Process keywords - ensure it's a string
            let keywordsValue = '';
            if (seoItem.keywords) {
              if (Array.isArray(seoItem.keywords)) {
                keywordsValue = seoItem.keywords.join(', ');
              } else if (typeof seoItem.keywords === 'string') {
                keywordsValue = seoItem.keywords;
              } else {
                keywordsValue = String(seoItem.keywords || '');
              }
            }
            
            // Build the SEO object with proper defaults
            return {
              language: seoItem.language || 'en',
              metaTitle: seoItem.metaTitle || '',
              metaDescription: seoItem.metaDescription || '',
              keywords: keywordsValue,
              canonicalUrl: seoItem.canonicalUrl || '',
              robots: {
                noindex: Boolean(seoItem.robots?.noindex),
                nofollow: Boolean(seoItem.robots?.nofollow),
                noimageindex: Boolean(seoItem.robots?.noimageindex)
              },
              openGraph: {
                title: seoItem.openGraph?.title || seoItem.metaTitle || '',
                description: seoItem.openGraph?.description || seoItem.metaDescription || '',
                image: seoItem.openGraph?.image || bannerImageUrl || '',
                imageAlt: seoItem.openGraph?.imageAlt || ''
              },
              twitter: {
                title: seoItem.twitter?.title || seoItem.metaTitle || '',
                description: seoItem.twitter?.description || seoItem.metaDescription || '',
                image: seoItem.twitter?.image || bannerImageUrl || '',
                imageAlt: seoItem.twitter?.imageAlt || ''
              },
              structuredData: seoItem.structuredData || {}
            };
          });
        } 
        // Handle single SEO object
        else if (typeof parsedSeo === 'object' && parsedSeo !== null) {
          // Process keywords for single object
          let keywordsValue = '';
          if (parsedSeo.keywords) {
            if (Array.isArray(parsedSeo.keywords)) {
              keywordsValue = parsedSeo.keywords.join(', ');
            } else if (typeof parsedSeo.keywords === 'string') {
              keywordsValue = parsedSeo.keywords;
            }
          }
          
          processedSeo = [{
            language: parsedSeo.language || 'en',
            metaTitle: parsedSeo.metaTitle || '',
            metaDescription: parsedSeo.metaDescription || '',
            keywords: keywordsValue,
            canonicalUrl: parsedSeo.canonicalUrl || '',
            robots: {
              noindex: Boolean(parsedSeo.robots?.noindex),
              nofollow: Boolean(parsedSeo.robots?.nofollow),
              noimageindex: Boolean(parsedSeo.robots?.noimageindex)
            },
            openGraph: {
              title: parsedSeo.openGraph?.title || parsedSeo.metaTitle || '',
              description: parsedSeo.openGraph?.description || parsedSeo.metaDescription || '',
              image: parsedSeo.openGraph?.image || bannerImageUrl || '',
              imageAlt: parsedSeo.openGraph?.imageAlt || ''
            },
            twitter: {
              title: parsedSeo.twitter?.title || parsedSeo.metaTitle || '',
              description: parsedSeo.twitter?.description || parsedSeo.metaDescription || '',
              image: parsedSeo.twitter?.image || bannerImageUrl || '',
              imageAlt: parsedSeo.twitter?.imageAlt || ''
            },
            structuredData: parsedSeo.structuredData || {}
          }];
        }
      }
      
      // Ensure we have at least one SEO entry
      if (processedSeo.length === 0) {
        const defaultTitle = parsedHeaders[0]?.title?.en || 'Service';
        const defaultDescription = parsedHeaders[0]?.description?.en || 'Professional service';
        
        processedSeo.push(createDefaultSeo('en', {
          metaTitle: defaultTitle,
          metaDescription: defaultDescription,
          openGraph: { image: bannerImageUrl },
          twitter: { image: bannerImageUrl }
        }));
      }
    } catch (seoError) {
      console.error('Error processing SEO data:', seoError);
      // Fallback to default SEO
      processedSeo = [createDefaultSeo('en')];
    }
    
    // Set default SEO if not provided
    if (processedSeo.length === 0) {
      const defaultTitle = parsedHeaders[0]?.title?.en || 'Service';
      const defaultDescription = parsedHeaders[0]?.description?.en || 'Professional service';
      const defaultSlug = slug.en;
      
      // Default SEO for English
      processedSeo.push({
        language: 'en',
        metaTitle: defaultTitle,
        metaDescription: defaultDescription,
        // Ensure keywords is a string, not an array
        keywords: 'service, professional',
        canonicalUrl: `https://abwabdigital.com/services/${defaultSlug}`,
        robots: {
          noindex: false,
          nofollow: false,
          noimageindex: false
        },
        openGraph: {
          title: `${defaultTitle} | Abwab Digital`,
          description: defaultDescription,
          image: bannerImageUrl || 'https://abwabdigital.com/images/default-og.jpg',
          imageAlt: defaultTitle
        },
        twitter: {
          title: `${defaultTitle} | Abwab Digital`,
          description: defaultDescription,
          image: bannerImageUrl || 'https://abwabdigital.com/images/default-twitter.jpg',
          imageAlt: defaultTitle
        },
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": defaultTitle,
          "description": defaultDescription,
          "provider": {
            "@type": "Organization",
            "name": "Abwab Digital"
          }
        }
      });
      
      // Default SEO for Arabic if Arabic title exists
      if (parsedHeaders[0]?.title?.ar) {
        processedSeo.push({
          language: 'ar',
          metaTitle: parsedHeaders[0].title.ar || 'خدمة',
          metaDescription: parsedHeaders[0].description?.ar || 'خدمة احترافية',
          keywords: 'خدمة, احترافية',
          canonicalUrl: `https://abwabdigital.com/ar/services/${slug.ar}`,
          robots: {
            noindex: false,
            nofollow: false,
            noimageindex: false
          },
          openGraph: {
            title: `${parsedHeaders[0].title.ar} | أبوب ديجيتال`,
            description: parsedHeaders[0].description?.ar || 'خدمة احترافية',
            image: bannerImageUrl || 'https://abwabdigital.com/images/default-og-ar.jpg',
            imageAlt: parsedHeaders[0].title.ar
          },
          twitter: {
            title: `${parsedHeaders[0].title.ar} | أبوب ديجيتال`,
            description: parsedHeaders[0].description?.ar || 'خدمة احترافية',
            image: bannerImageUrl || 'https://abwabdigital.com/images/default-twitter-ar.jpg',
            imageAlt: parsedHeaders[0].title.ar
          },
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": parsedHeaders[0].title.ar,
            "description": parsedHeaders[0].description?.ar || 'خدمة احترافية',
            "provider": {
              "@type": "Organization",
              "name": "أبوب ديجيتال"
            }
          }
        });
      }
    }
    // Process package images
    if (files.packageImages && Array.isArray(parsedPackages)) {
      files.packageImages.forEach((file, i) => {
        if (file?.filename && parsedPackages[i]) {
          console.log(`Package ${i} - Original name: ${file.originalname}`);
          console.log(`Package ${i} - Saved as: ${file.filename}`);
          
          parsedPackages[i].image = {
            url: `${UPLOADS_BASE_URL}${file.filename}`,
            alt: parsedPackages[i].title || { en: 'Package Image', ar: 'صورة الباقة' }
          };
          console.log(`Package ${i} image URL:`, parsedPackages[i].image.url);
        }
      });
    }

    // Process sections images
    if (files.sectionImages && Array.isArray(parsedHeaders)) {
      files.sectionImages.forEach((file, i) => {
        if (file?.filename && parsedHeaders[i] && !parsedHeaders[i].isSubsection) {
          console.log(`Section ${i} - Original name: ${file.originalname}`);
          console.log(`Section ${i} - Saved as: ${file.filename}`);
          
          parsedHeaders[i].image = {
            url: `${UPLOADS_BASE_URL}${file.filename}`,
            alt: parsedHeaders[i].title || { en: "Section Image", ar: "صورة القسم" }
          };
          console.log(`Section ${i} image URL:`, parsedHeaders[i].image.url);
        }
        
        // If there are subsections, make sure they don't have images
        if (header.sections && Array.isArray(header.sections)) {
          header.sections = header.sections.map(sub => {
            // Remove image property if it exists
            const { image, ...rest } = sub;
            return rest;
          });
        }
      });
    }

    // Process implement process images
    if (files.implementProcessImages) {
      console.log('=== DEBUG: Implement Process Images ===');
      console.log('Files object keys:', Object.keys(files));
      console.log('implementProcessImages type:', typeof files.implementProcessImages);
      console.log('Is array:', Array.isArray(files.implementProcessImages));
      console.log('Files content:', JSON.stringify(files.implementProcessImages, null, 2));
      
      // Handle both single file and array of files
      const processImages = Array.isArray(files.implementProcessImages) 
        ? files.implementProcessImages 
        : [files.implementProcessImages];
      
      console.log('Process images to process:', processImages.length);
      console.log('Processes to add images to:', parsedImplementProcess.length);
      
      // Process each implement process and assign images
      parsedImplementProcess.forEach((process, i) => {
        if (!process) return;
        
        console.log(`\n--- Processing implement process ${i} ---`);
        console.log('Process data before:', JSON.stringify(process, null, 2));
        
        // Check if we have a corresponding image
        if (i < processImages.length && processImages[i]) {
          const img = processImages[i];
          console.log(`Image ${i} details:`, {
            keys: Object.keys(img),
            path: img.path,
            filename: img.filename,
            originalname: img.originalname,
            mimetype: img.mimetype
          });
          
          // Generate consistent image URL
          let imageUrl = '';
          
          if (img.filename) {
            // Use the filename directly and construct the full URL
            imageUrl = `${UPLOADS_BASE_URL}${img.filename}`;
          } else if (img.path) {
            // Extract just the filename from the path if filename is not available
            const filename = img.path.split(/[\\/]/).pop(); // Handle both Windows and Unix paths
            imageUrl = `${UPLOADS_BASE_URL}${filename}`;
          }
          
          console.log('Image URL components:', { 
            filename: img.filename, 
            path: img.path, 
            constructedUrl: imageUrl,
            UPLOADS_BASE_URL 
          });
          
          console.log('Generated image URL:', imageUrl);
          
          if (imageUrl) {
            process.image = {
              url: imageUrl,
              alt: {
                en: process.title?.en || 'Process Image',
                ar: process.title?.ar || 'صورة العملية'
              }
            };
            console.log(`Added image for process ${i}:`, process.image.url);
          }
        }
        
        // Process section images
        if (process.sections && processImages[i]) {
          // Handle both array and object formats for section images
          const sectionImages = Array.isArray(processImages[i])
            ? processImages[i]
            : [processImages[i]];
          
          process.sections.forEach((section, j) => {
            if (!section) return;
            
            if (sectionImages[j]?.filename) {
              const imageUrl = sectionImages[j].filename.startsWith('http')
                ? sectionImages[j].filename
                : baseUrl + sectionImages[j].filename;
              
              section.image = {
                url: imageUrl,
                alt: {
                  en: section.title?.en || (process.title?.en ? `${process.title.en} Step ${j + 1}` : 'Process Step'),
                  ar: section.title?.ar || (process.title?.ar ? `${process.title.ar} خطوة ${j + 1}` : 'خطوة العملية')
                }
              };
              console.log(`Added image for process ${i}, section ${j}:`, section.image.url);
            }
          });
        }
      });
    }

    // Create implement process with images
    const processedImplementProcess = parsedImplementProcess.map((process, index) => {
      // Log the process to ensure image is present
      console.log(`Process ${index} before service creation:`, JSON.stringify(process, null, 2));
      
      return {
        ...process,
        // Ensure image is included in the process
        image: process.image || null,
        sections: (process.sections || []).map(section => ({
          ...section,
          order: section.order || 0,
          isActive: section.isActive !== undefined ? section.isActive : true
        }))
      };
    });
    
    console.log('Final implementProcess before saving:', JSON.stringify(processedImplementProcess, null, 2));

    // ✅ Create service with correct schema
    const newService = new Service({
      slug: finalSlug,
      header: parsedHeaders,
      implementProcess: processedImplementProcess,
      bannerImage: bannerImageUrl ? {
        url: bannerImageUrl,
        alt: parsedHeaders?.[0]?.title || { en: "Service Banner", ar: "بانر الخدمة" }
      } : undefined,
      importance:parsedImportance.map(importance => ({
        ...importance,
        order: importance.order || 0,
        isActive: importance.isActive !== undefined ? importance.isActive : true
      })),
      projects: parsedProjects.map(project => ({
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        image: project.image,
        features: project.features || [],
        packages: project.packages || []
      })),
      packages: parsedPackages.map(pkg => ({
        ...pkg,
        price: pkg.price ? {
          amount: pkg.price.amount || 0,
          currency: pkg.price.currency || 'USD' 
        } : undefined,
        features: pkg.features || [],
        isPopular: pkg.isPopular || false,
        isActive: pkg.isActive !== undefined ? pkg.isActive : true,
        order: pkg.order || 0
      })),
      faq: parsedFaq.map(faqItem => ({
        ...faqItem,
        questions: faqItem.questions?.map(question => ({
          ...question,
          order: question.order || 0,
          isActive: question.isActive !== undefined ? question.isActive : true
        })) || []
      })),
      seo: processedSeo.length > 0 ? processedSeo : [{
        language: 'en',
        metaTitle: parsedHeaders?.[0]?.title?.en || 'Service',
        metaDescription: parsedHeaders?.[0]?.description?.en || 'Professional service',
        keywords: 'service, professional',
        canonicalUrl: `https://abwabdigital.com/services/${finalSlug.en}`,
        robots: { noindex: false, nofollow: false, noimageindex: false },
        openGraph: {
          title: `${parsedHeaders?.[0]?.title?.en || 'Service'} | Abwab Digital`,
          description: parsedHeaders?.[0]?.description?.en || 'Professional service',
          image: bannerImageUrl || 'https://abwabdigital.com/images/default-og.jpg',
          imageAlt: parsedHeaders?.[0]?.title?.en || 'Service'
        },
        twitter: {
          title: `${parsedHeaders?.[0]?.title?.en || 'Service'} | Abwab Digital`,
          description: parsedHeaders?.[0]?.description?.en || 'Professional service',
          image: bannerImageUrl || 'https://abwabdigital.com/images/default-twitter.jpg',
          imageAlt: parsedHeaders?.[0]?.title?.en || 'Service'
        },
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": parsedHeaders?.[0]?.title?.en || 'Service',
          "description": parsedHeaders?.[0]?.description?.en || 'Professional service',
          "provider": {
            "@type": "Organization",
            "name": "Abwab Digital"
          }
        }
      }]
    });

    await newService.save();

    // Format the response to include processed images and handle empty subsections
    const formatForResponse = (service) => {
      const formatted = service.toObject ? service.toObject() : { ...service };
      const apiBaseUrl = process.env.BASE_URL || 'https://backend.abwabdigital.com/api/v1/';
      
      // Process banner image first
      if (formatted.bannerImage?.url) {
        formatted.bannerImage = {
          url: formatted.bannerImage.url.startsWith('http')
            ? formatted.bannerImage.url
            : `${apiBaseUrl}${formatted.bannerImage.url}`,
          alt: formatted.bannerImage.alt || { en: '', ar: '' }
        };
      }
      
      // Process header sections
      if (formatted.header) {
        formatted.header = formatted.header.map(section => {
          const formattedSection = {
            ...section,
            title: section.title || { en: '', ar: '' },
            description: section.description || { en: '', ar: '' },
            order: section.order || 0,
            isActive: section.isActive !== undefined ? section.isActive : true
          };

          // Process section image
          if (section.image) {
            formattedSection.image = {
              url: section.image.url?.startsWith('http') 
                ? section.image.url 
                : `${apiBaseUrl}${section.image.url || ''}`,
              alt: section.image.alt || { en: '', ar: '' }
            };
          }

          // Process subsections if they exist
          if (section.subsections?.length > 0) {
            formattedSection.subsections = section.subsections.map(sub => ({
              ...sub,
              title: sub.title || { en: '', ar: '' },
              description: sub.description || { en: '', ar: '' },
              order: sub.order || 0,
              isActive: sub.isActive !== undefined ? sub.isActive : true,
              ...(sub.image && {
                image: {
                  url: sub.image.url?.startsWith('http')
                    ? sub.image.url
                    : `${apiBaseUrl}${sub.image.url || ''}`,
                  alt: sub.image.alt || { en: '', ar: '' }
                }
              })
            }));
          }

          return formattedSection;
        });
      }

      // Process implementProcess sections
      if (formatted.implementProcess) {
        formatted.implementProcess = formatted.implementProcess.map(process => ({
          ...process,
          sections: process.sections?.map(section => ({
            ...section,
            image: section.image ? {
              url: section.image.url?.startsWith('http')
                ? section.image.url
                : `${apiBaseUrl}${section.image.url || ''}`,
              alt: section.image.alt || { en: '', ar: '' }
            } : undefined
          })) || []
        }));
      }

      // Process packages
      if (formatted.packages) {
        formatted.packages = formatted.packages.map(pkg => ({
          ...pkg,
          image: pkg.image ? {
            url: pkg.image.url?.startsWith('http')
              ? pkg.image.url
              : `${apiBaseUrl}${pkg.image.url || ''}`,
            alt: pkg.image.alt || { en: '', ar: '' }
          } : undefined
        }));
      }

      // Process SEO data
      if (formatted.seo) {
        formatted.seo = formatted.seo.map(seoItem => {
          // Ensure we have a valid seoItem object
          if (!seoItem || typeof seoItem !== 'object') {
            seoItem = {};
          }
          
          // Safely handle keywords - convert to string if it's an array, or use empty string if invalid
          let keywordsValue = '';
          if (Array.isArray(seoItem.keywords)) {
            keywordsValue = seoItem.keywords.join(', ');
          } else if (typeof seoItem.keywords === 'string') {
            // If it's already a string, use it as is
            keywordsValue = seoItem.keywords;
          } else if (seoItem.keywords !== null && seoItem.keywords !== undefined) {
            // If it's some other type (number, etc.), convert to string
            keywordsValue = String(seoItem.keywords);
          }
          
          // Return the processed SEO item with all fields properly formatted
          return {
            language: seoItem.language || 'en',
            metaTitle: seoItem.metaTitle || '',
            metaDescription: seoItem.metaDescription || '',
            keywords: keywordsValue,
            canonicalUrl: seoItem.canonicalUrl || '',
            robots: {
              noindex: seoItem.robots?.noindex || false,
              nofollow: seoItem.robots?.nofollow || false,
              noimageindex: seoItem.robots?.noimageindex || false
            },
            openGraph: {
              title: seoItem.openGraph?.title || seoItem.metaTitle || '',
              description: seoItem.openGraph?.description || seoItem.metaDescription || '',
              image: seoItem.openGraph?.image || formatted.bannerImage?.url || '',
              imageAlt: seoItem.openGraph?.imageAlt || ''
            },
            twitter: {
              title: seoItem.twitter?.title || seoItem.metaTitle || '',
              description: seoItem.twitter?.description || seoItem.metaDescription || '',
              image: seoItem.twitter?.image || formatted.bannerImage?.url || '',
              imageAlt: seoItem.twitter?.imageAlt || ''
            },
            structuredData: seoItem.structuredData || {}
          };
        });
      }

      return formatted;
    };

    try {
      // Format the response
      console.log('Formatting response...');
      const responseData = formatForResponse(newService);
      console.log('Response formatted successfully');
      
      return res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: responseData
      });
    } catch (formatError) {
      console.error('Error in formatForResponse:', {
        message: formatError.message,
        stack: formatError.stack,
        newService: JSON.stringify(newService, null, 2).substring(0, 1000) + '...'
      });
      throw formatError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error in createService:", {
      message: error.message,
      stack: error.stack,
      requestBody: JSON.stringify({
        sections: req.body.sections,
        header: req.body.header,
        seo: req.body.seo,
        // Add other fields as needed
      }, null, 2).substring(0, 1000) + '...',
      files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    res.status(500).json({
      success: false,
      message: "Error creating service: " + error.message,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Internal server error'
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

    // ✅ Find service by slug in any language and populate project data
    const service = await Service.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.ar': slug }
      ]
    }).populate({
      path: 'projects.projectId',
      select: 'name startDate endDate client status images',
      model: 'Project'
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const serviceObj = formatServiceForLanguage(service, language);

    // // ✅ Testimonials
    // const testimonials = await Testimonial.find({})
    //   .sort({ createdAt: -1 })
    //   .limit(4);

    // // ✅ Related Portfolios - fetch all portfolios since we don't have categories in new model
    // const relatedPortfolios = await Portfolio.find({
    //   _id: { $nin: service.projects?.map((p) => p.projectId) || [] },
    // })
    //   .select("name description images")
    //   .sort({ createdAt: -1 })
    //   .limit(4);

    return res.status(200).json({
      success: true,
      data: {
        ...serviceObj,
        // testimonials,
        // relatedPortfolios,
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
      .populate('projects.projectId', 'name description images')
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Format response with both Arabic and English versions via helpers
    const formattedResponse = {
      ar: {
        _id: service._id,
        ...formatServiceForLanguage(service, 'ar'),
      },
      en: {
        _id: service._id,
        ...formatServiceForLanguage(service, 'en'),
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

    // Fetch all services with necessary fields
    const services = await Service.find({})
      .select('header slug seo')
      .lean();

    // Format services to include title and description from header
    const processedServices = services.map(service => {
      // Get the first active header section or an empty object
      const header = Array.isArray(service.header) 
        ? service.header.find(h => h.isActive !== false) || {}
        : {};
      
      // Get SEO data
      const seo = service.seo?.[0] || {};
      
      return {
        _id: service._id,
        slug: service.slug?.[language] || service.slug?.en || '',
        title: typeof header.title === 'object' 
          ? (header.title[language] || header.title.en || '')
          : (header.title || ''),
        description: typeof header.description === 'object'
          ? (header.description[language] || header.description.ar || '')
          : (header.description || ''),
        seo: {
          metaTitle: seo.metaTitle || '',
          metaDescription: seo.metaDescription || ''
        }
      };
    });

    // Filter out any services that don't have a title in the selected language
    const filteredServices = processedServices.filter(service => service.title);

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
        services: filteredServices
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

    // Find the service and populate the projects
    const service = await Service.findById(id)
      .populate({
        path: 'projects.projectId',
        model: 'Project',
        select: 'title description images slug technologies client' // Select the fields you need
      });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Convert to plain object and handle virtuals
    const serviceObj = service.toObject({ virtuals: true });
    
    // Format the projects with the populated data
    const formattedProjects = serviceObj.projects.map(project => ({
      ...project,
      project: project.projectId ? {
        _id: project.projectId._id,
        title: project.projectId.title,
        description: project.projectId.description,
        images: project.projectId.images,
        slug: project.projectId.slug,
        technologies: project.projectId.technologies,
        client: project.projectId.client
      } : null
    }));
    
    // Format the service data for the response
    const formattedService = {
      ...serviceObj,
      seo: serviceObj.seo ? [pickSeoForLanguage(serviceObj.seo, language)] : [createDefaultSeo(language)],
      slug: serviceObj.slug,
      header: formatSections(serviceObj.header, language, true),
      implementProcess: formatImplementProcess(serviceObj.implementProcess, language, true),
      bannerImage: formatBannerImage(serviceObj.bannerImage, language, true),
      importance: formatSections(serviceObj.importance, language, true),
      projects: formatProjects(formattedProjects, language, true),
      packages: formatPackages(serviceObj.packages, language, true),
      faq: formatFaq(serviceObj.faq, language, true)
    };

    return res.status(200).json({
      success: true,
      data: formattedService
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
// removed duplicate parseJSONField; use parseField instead



exports.updateService = async (req, res) => {
  console.log('Update Service - Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Update Service - Files:', JSON.stringify(req.files ? Object.keys(req.files) : 'No files', null, 2));
  
  try {
    const { id } = req.params;
    const {
      header,
      implementProcess,
      bannerImage,
      importance,
      projects,
      packages,
      faq,
      seo
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required"
      });
    }

    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const baseUrl = process.env.BASE_URL || 'https://backend.abwabdigital.com/uploads/';

    // Update header and slug if header is provided
    if (header) {
      let parsedHeader = parseField(header, existingService.header) || [];

      // Process each header section
      parsedHeader = parsedHeader.map(section => {
        // Ensure title and description are properly formatted as objects
        const processedSection = {
          ...section,
          title: typeof section.title === 'string' 
            ? { en: section.title, ar: section.title }
            : { 
                en: section.title?.en || '',
                ar: section.title?.ar || section.title?.en || ''
              },
          description: typeof section.description === 'string'
            ? { en: section.description, ar: section.description }
            : {
                en: section.description?.en || '',
                ar: section.description?.ar || section.description?.en || ''
              },
          order: section.order || 0,
          isActive: section.isActive !== undefined ? section.isActive : true
        };

        // Handle image if provided in files
        if (req.files?.sectionImages?.[0]?.filename) {
          processedSection.image = {
            url: `${baseUrl}${req.files.sectionImages[0].filename}`,
            alt: {
              en: section.image?.alt?.en || section.title?.en || 'Section Image',
              ar: section.image?.alt?.ar || section.title?.ar || 'صورة القسم'
            }
          };
        } else if (section.image) {
          // Keep existing image if no new one is uploaded
          processedSection.image = section.image;
        }

        return processedSection;
      });

      existingService.header = parsedHeader;

      // Update slug if first section title changed
      const firstSection = parsedHeader[0];
      if (firstSection?.title) {
        const baseSlug = {
          en: slugify(firstSection.title.en || existingService.slug?.en || 'service', { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g
          }),
          ar: slugify(firstSection.title.ar || existingService.slug?.ar || 'خدمة', { 
            lower: false, 
            strict: false,
            remove: /[*+~.()'"!:@]/g,
            locale: 'ar'
          })
        };
        const uniqueSlug = await ensureUniqueSlug(baseSlug, existingService._id);
        if (uniqueSlug.en && uniqueSlug.en !== 'service') {
          existingService.slug = uniqueSlug;
        }
      }
    }

    // Process implement process if provided
    if (implementProcess) {
      const parsedImplementProcess = parseField(implementProcess, existingService.implementProcess);
      
      // Process implement process images if any
      if (req.files?.implementProcessImages) {
        parsedImplementProcess.forEach((process, i) => {
          if (process.sections) {
            process.sections.forEach((section, j) => {
              if (req.files.implementProcessImages[i]?.[j]?.filename) {
                section.image = {
                  url: `${baseUrl}${req.files.implementProcessImages[i][j].filename}`,
                  alt: section.title || { en: 'Process Step Image', ar: 'صورة خطوة العملية' }
                };
              }
            });
          }
        });
      }

      existingService.implementProcess = parsedImplementProcess.map(process => ({
        ...process,
        sections: (process.sections || []).map(section => ({
          ...section,
          order: section.order || 0,
          isActive: section.isActive !== undefined ? section.isActive : true
        }))
      }));
    }

    // Process banner image if provided
    if (bannerImage) {
      const parsedBannerImage = parseField(bannerImage, existingService.bannerImage);
      if (req.files?.bannerImage?.[0]?.filename) {
        parsedBannerImage.url = `${baseUrl}${req.files.bannerImage[0].filename}`;
        if (!parsedBannerImage.alt) {
          parsedBannerImage.alt = { en: 'Banner Image', ar: 'صورة البانر' };
        }
      }
      existingService.bannerImage = parsedBannerImage;
    }

    // Process importance if provided
    if (importance) {
      const parsedImportance = parseField(importance, existingService.importance || []);
      
      // Process importance images if any
      if (req.files?.importanceImages) {
        parsedImportance.forEach((imp, i) => {
          if (req.files.importanceImages[i]?.filename) {
            imp.image = {
              url: `${baseUrl}${req.files.importanceImages[i].filename}`,
              alt: imp.title || { en: 'Importance Image', ar: 'صورة الأهمية' }
            };
          }
        });
      }

      existingService.importance = parsedImportance.map(imp => ({
        title: imp.title || { en: '', ar: '' },
        description: imp.description || { en: '', ar: '' },
        image: imp.image || { url: '', alt: { en: '', ar: '' } },
        order: imp.order || 0,
        isActive: imp.isActive !== false
      }));
    }

    // Process projects if provided
    if (projects) {
      existingService.projects = parseField(projects, existingService.projects || []);
    }

    // Process packages if provided
    if (packages) {
      const parsedPackages = parseField(packages, existingService.packages || []);
      
      // Process package images if any
      if (req.files?.packageImages) {
        parsedPackages.forEach((pkg, i) => {
          if (req.files.packageImages[i]?.filename) {
            pkg.image = {
              url: `${baseUrl}${req.files.packageImages[i].filename}`,
              alt: pkg.title || { en: 'Package Image', ar: 'صورة الباقة' }
            };
          }
        });
      }

      existingService.packages = parsedPackages.map(pkg => ({
        ...pkg,
        features: (pkg.features || []).map(feature => ({
          text: feature.text || { en: '', ar: '' },
          included: feature.included !== false
 })),
        order: pkg.order || 0,
        isActive: pkg.isActive !== false
      }));
    }

    // Process FAQ if provided
    if (faq) {
      existingService.faq = parseField(faq, existingService.faq || []).map(item => ({
        question: item.question || { en: '', ar: '' },
        answer: item.answer || { en: '', ar: '' },
        order: item.order || 0,
        isActive: item.isActive !== false
      }));
    }

    // Process SEO if provided
    if (seo) {
      const parsedSeo = parseField(seo, existingService.seo);
      existingService.seo = Array.isArray(parsedSeo) ? parsedSeo : (parsedSeo ? [parsedSeo] : []);
    }

    // Save the updated service
    console.log('Saving service with data:', JSON.stringify({
      header: existingService.header?.map(h => h.title),
      slug: existingService.slug,
      updatedAt: new Date()
    }, null, 2));

    await existingService.save();
    console.log('Service updated successfully');

    // Format response based on language
    const lang = req.query.language || 'en';
    const responseData = formatServiceForLanguage(existingService, lang);
    
    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Update Service Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    return res.status(500).json({
      success: false,
      message: "Error updating service: " + error.message,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};
