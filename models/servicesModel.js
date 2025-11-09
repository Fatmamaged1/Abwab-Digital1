const mongoose = require("mongoose");
const {
  multiLangText,
  multiLangSlug,
  imageSchema,
  sectionSchema,
  packageSchema,
  faqSchema,
  projectReferenceSchema,
} = require("./commonSchemas");
const seoSchema = require('./seoSchema');

const ServiceSchema = new mongoose.Schema({
  seo: [seoSchema], // Array of SEO objects for multi-language support
  slug: multiLangSlug,

  header: [sectionSchema],
  implementProcess: [{
    title: multiLangText,
    description: multiLangText,
    sections: [sectionSchema],
  }],
  importance:[sectionSchema],
  bannerImage: imageSchema,

  projects: [projectReferenceSchema],

  packages: [packageSchema],

  faq: [faqSchema],

}, {
  timestamps: true,
});

// Indexes for better performance
ServiceSchema.index({ createdAt: -1 });
ServiceSchema.index({ updatedAt: -1 });

// Text index with language set to 'none' to avoid stemming
ServiceSchema.index(
  { 
    'seo.metaTitle': 'text',
    'seo.metaDescription': 'text',
    'seo.keywords': 'text',
    'header.title': 'text',
    'header.description': 'text',
    'implementProcess.title': 'text',
    'implementProcess.description': 'text',
    'packages.title': 'text',
    'packages.description': 'text',
    'faq.question': 'text',
    'faq.answer': 'text'
  },
  {
    name: 'services_text_index',
    default_language: 'none',
    language_override: 'none',
    weights: {
      'seo.metaTitle': 10,
      'seo.keywords': 8,
      'seo.metaDescription': 5,
      'header.title': 7,
      'header.description': 3,
      'implementProcess.title': 6,
      'implementProcess.description': 2,
      'packages.title': 5,
      'packages.description': 2,
      'faq.question': 4,
      'faq.answer': 1
    }
  }
);

// Add a method to get SEO by language
ServiceSchema.methods.getSeoByLanguage = function(language = 'en') {
  return this.seo.find(s => s.language === language) || this.seo[0] || null;
};

// Pre-save hook to ensure at least one SEO entry exists
ServiceSchema.pre('save', function(next) {
  if (this.seo && this.seo.length === 0) {
    this.seo = [{
      language: 'en', // Default to English
      metaTitle: this.slug?.en || 'Service',
      metaDescription: this.header?.[0]?.description?.en || '',
      robots: { noindex: false, nofollow: false }
    }];
  }
  next();
});

module.exports = mongoose.model("Service", ServiceSchema);

