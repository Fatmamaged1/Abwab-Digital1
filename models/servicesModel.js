const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  stats: {
    clients: { type: String },
    countries: { type: String },
    projects: { type: String },
  },
  keyFeatures: [
    {
      title: { type: String, required: true },
      alt: { type: String, required: true },
      description: { type: String, required: true },
      icon: { type: String }, // URL for the icon
    },
  ],
  importance: [
    {
      point: { type: String, required: true }, // Importance point
    },
  ],
  recentProjects: [
    {
      image: { type: String, required: true }, // Project image URL
      alt: { type: String, required: true },
      title: { type: String, required: true }, // Project title
      description: { type: String }, // Project description
    },
  ],
  testimonials: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' },
  ],
  footer: {
    copyright: { type: String },
    quickLinks: [String],
    mainLinks: [String],
    socialLinks: [
      {
        platform: { type: String },
        url: { type: String },
      },
    ],
  },
  seo: [seoSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
