const mongoose = require("mongoose");

// Constants for reuse
const SEO_CONSTRAINTS = {
  META_TITLE_MAX: 70,
  META_DESC_MAX: 160,
  KEYWORD_MAX: 10,
  URL_PATTERN: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/
};

const SocialMediaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"]
  },
  image: { 
    type: String, 
    trim: true,
    match: [SEO_CONSTRAINTS.URL_PATTERN, "Please provide a valid URL"]
  },
  imageAlt: { 
    type: String, 
    trim: true,
    maxlength: [125, "Alt text cannot exceed 125 characters"]
  }
}, { _id: false });

const seoSchema = new mongoose.Schema({
  // Language and Basic Info
  language: {
    type: String,
    enum: {
      values: ["en", "ar"],
      message: "Language must be either 'en' or 'ar'"
    },
    required: [true, "Language is required"],
    default: "en",
    index: true
  },

  // Core Meta
  metaTitle: {
    type: String,
    required: [true, "Meta title is required"],
    trim: true,
    maxlength: [
      SEO_CONSTRAINTS.META_TITLE_MAX, 
      `Meta title cannot exceed ${SEO_CONSTRAINTS.META_TITLE_MAX} characters`
    ]
  },

  metaDescription: {
    type: String,
    required: [true, "Meta description is required"],
    trim: true,
    maxlength: [
      SEO_CONSTRAINTS.META_DESC_MAX, 
      `Meta description cannot exceed ${SEO_CONSTRAINTS.META_DESC_MAX} characters`
    ]
  },

  // Search Engine Directives automatically set to false
  robots: {
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    noimageindex: { type: Boolean, default: false }
  },

  // Content
  keywords: [{
    type: String,
    trim: true,
    maxlength: [50, "Keyword cannot exceed 50 characters"]
  }],

  // Canonical URL
  canonicalUrl: {
    type: String,
    trim: true,
    match: [SEO_CONSTRAINTS.URL_PATTERN, "Please provide a valid URL"]
  },

  // Social Media
  openGraph: {
    type: SocialMediaSchema,
    default: () => ({})
  },

  twitter: {
    type: SocialMediaSchema,
    default: () => ({})
  },

  // Structured Data
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        try {
          return typeof v === 'object' && v !== null;
        } catch (e) {
          return false;
        }
      },
      message: "Structured data must be a valid object"
    }
  }
}, {
  // Schema Options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
seoSchema.index({ language: 1 });

// Virtual for robots meta content
seoSchema.virtual('robotsMeta').get(function() {
  const directives = [];
  if (this.robots.noindex) directives.push('noindex');
  if (this.robots.nofollow) directives.push('nofollow');
  if (this.robots.noimageindex) directives.push('noimageindex');
  return directives.length > 0 ? directives.join(', ') : 'index, follow';
});

// Pre-save hook to clean and validate keywords
seoSchema.pre('save', function(next) {
  if (this.keywords) {
    // Handle both string (comma-separated) and array inputs
    let keywordsArray = [];
    
    if (typeof this.keywords === 'string') {
      // Split by comma and clean up
      keywordsArray = this.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    } else if (Array.isArray(this.keywords)) {
      // Already an array, just clean it up
      keywordsArray = this.keywords
        .map(k => typeof k === 'string' ? k.trim() : String(k).trim())
        .filter(k => k.length > 0);
    }
    
    // Remove duplicates and limit to max number of keywords
    this.keywords = [...new Set(keywordsArray)].slice(0, SEO_CONSTRAINTS.KEYWORD_MAX);
  } else {
    this.keywords = [];
  }
  next();
});

module.exports = seoSchema;