const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  // SEO Fields
  seo: {
    metaTitle: { type: String, required: true, trim: true },
    metaDescription: { type: String, required: true, trim: true },
    canonical: { type: String, trim: true }, // Auto-generated canonical URL
  },

  // SEO-Friendly URL - Must be unique
  url: { type: String, required: true, unique: true, trim: true },

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
    enum: ["Mobile App", "Website", "E-Commerce", "Dashboard", "Other"],
    required: true,
  },

  client: { type: String }, // Optional Client Name
  downloads: { type: Number, default: 0 }, // App/Software Downloads

  platform: {
    type: String,
    enum: ["Mobile Application", "Website", "Desktop Software"],
    required: true,
  },

  region: { type: String, required: true }, // Location of the project
  technologies: [{ type: String }], // Tech stack used (e.g., React, Node.js)

  // Related projects
  relatedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" }],

  // Multilingual Support
  content: {
    en: {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true, trim: true },
    },
    ar: {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true, trim: true },
    },
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
