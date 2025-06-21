const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

const multiLangText = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

const ServiceSchema = new mongoose.Schema({
  description: multiLangText,

  category: {
    type: String,
    enum: [
      "Mobile Application",
      "Website",
      "Graphic Design",
      "Online Store",
      "Corporate System",
      "Motion Graphic",
      "Web Hosting",
      "AI Services",
      "SEO",
      "Social Marketing"
    ],
    required: true,
  },

  image: {
    url: { type: String },
    altText: multiLangText,
  },

  importance: [
    {
      desc: multiLangText,
    },
  ],

  recentProjects: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  ],

  testimonials: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' },
  ],

  distingoshesUs: [
    {
      icon: { type: String },
      description: multiLangText,
    },
  ],

  designPhase: {
    title: multiLangText,
    desc: multiLangText,
    image: { type: String },
    satisfiedClientValues: {
      title: multiLangText,
    },
    values: [
      {
        title: multiLangText,
        desc: multiLangText,
      },
    ],
  },

  techUsedInService: [
    {
      icon: { type: String },
      title: multiLangText,
      desc: multiLangText,
    },
  ],

  seo: [seoSchema],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
