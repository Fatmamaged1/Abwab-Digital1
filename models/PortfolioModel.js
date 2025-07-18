const mongoose = require("mongoose");
// Reusable localized string field
const localizedString = {
  ar: { type: String, required: true },
  en: { type: String, required: true },
};
// SEO Fields
const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ["en", "ar"], required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  projectName: localizedString,
  name: localizedString,
  description: localizedString,

  // SEO Fields
  seo: [seoSchema],

  // SEO-Friendly URL - Must be unique
  url: { type: String, required: true, unique: true, trim: true },

  // Hero Section 📌 Added hero details
  hero: {
    title: localizedString,
    description: localizedString,
    downloads: { type: Number, default: 0 }, // App/Software Downloads
    platforms: [{ type: String, trim: true }], // Supported platforms (e.g., iOS, Android, Web)
    tech: [
      {
        icon: { type: String, required: true }, // 📌 Tech stack icon (e.g., React, Node.js)
      },
    ],
    region: { type: String, required: true, trim: true }, // Project Region
  },

  // Main images for the project with SEO-friendly alt text
  images: [
    {
      url: { type: String, required: true },
      altText: { type: String, default: "Project Image" },
      caption: { type: String },
    },
  ],

  // Design previews (Web & Mobile)
  designScreens: {
    web: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: "Web Design" },
        caption: { type: String },
      },
    ],
    app: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: "App Design" },
        caption: { type: String },
      },
    ],
  },

  // Additional Screenshots
  screenshots: [
    {
      url: { type: String, required: true },
      altText: { type: String, default: "App Screenshot" },
    },
  ],

  // Project Category
  category: {
    type: String,
    enum: ["Mobile Application", "Website", "Stores", "Marketing", "Brand Identity"],
    required: true,
  },

  // Related projects
  relatedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" }], // Related projects

  // 📌 Added Response Section
  responsive: {
    title: localizedString,
    description: localizedString,
    image: { type: String, required: true }, // URL to the response image
  },

  createdAt: { type: Date, default: Date.now },
});

// Auto-generate canonical URL if not provided
portfolioSchema.pre("save", function (next) {
  if (!this.seo.canonical) {
    this.seo.canonical = `https://yourwebsite.com/${this.url}`;
  }
  next();
});

// Enable virtuals for JSON & Object output
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

module.exports = mongoose.models.Portfolio || mongoose.model("Portfolio", portfolioSchema);
