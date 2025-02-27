const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  // SEO Fields
  seo: {
    metaTitle: { type: String, required: true, trim: true },
    metaDescription: { type: String, required: true, trim: true },
    canonical: { type: String, trim: true },
  },

  // SEO-Friendly URL - Must be unique
  url: { type: String, required: true, unique: true, trim: true },

  // Hero Section 📌 Added hero details
  hero: {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
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
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
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
