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
  description: {
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  category: {
    en: {
      type: String,
      enum: ["Mobile Application", "Website", "Graphic Design", "Online Store", "Corporate System", "Motion Graphic", "Web Hosting", "AI Services", "SEO", "Social Marketing"],
      required: true,
    },
    ar: {
      type: String,
      enum: ["تطبيق جوال", "موقع إلكتروني", "تصميم جرافيكي", "متجر إلكتروني", "نظام شركات", "موشن جرافيك", "استضافة مواقع", "خدمات الذكاء الاصطناعي", "تحسين محركات البحث", "تسويق رقمي"],
      required: true,
    },
  },
  image: {
    url: { type: String, required: false },
    altText: { type: String, default: "Service Image" },
  },
  importance: [
    {
      desc: {
        en: { type: String, required: true },
        ar: { type: String, required: true },
      },
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
      description: {
        en: { type: String, required: true },
        ar: { type: String, required: true },
      },
    },
  ],
  designPhase: {
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    desc: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    image: { type: String },
    satisfiedClientValues: {
      title: {
        en: { type: String, required: true },
        ar: { type: String, required: true },
      },
    },
    values: [
      {
        title: {
          en: { type: String, required: true },
          ar: { type: String, required: true },
        },
        desc: {
          en: { type: String, required: true },
          ar: { type: String, required: true },
        },
      },
    ],
  },
  techUsedInService: [
    {
      icon: { type: String },
      title: {
        en: { type: String, required: true },
        ar: { type: String, required: true },
      },
      desc: {
        en: { type: String, required: true },
        ar: { type: String, required: true },
      },
    },
  ],
  seo: [seoSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
