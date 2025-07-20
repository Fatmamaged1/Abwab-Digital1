const mongoose = require("mongoose");
const slugify = require("slugify");

const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: false },
  metaTitle: { type: String, required: false },
  metaDescription: { type: String, required: false },
  keywords: { type: String, required: false },
  canonicalTag: { type: String, required: false },
  structuredData: { type: mongoose.Schema.Types.Mixed, required: false },
}, { _id: false });

const multiLangText = {
  en: { type: String, required: false },
  ar: { type: String, required: false },
};

const ServiceSchema = new mongoose.Schema({
  slug: {
    en: { type: String, required: true, unique: true },
    ar: { type: String, required: true, unique: true }
  }
,  

  name: multiLangText,
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
    required: false,
  },

  image: {
    url: { type: String, required: false },
    altText: multiLangText,
  },

  importance: [
    {
      desc: multiLangText,
    },
  ],

  recentProjects: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: false },
  ],

  testimonials: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial', required: false },
  ],

  distingoshesUs: [
    {
      icon: { type: String, required: false },
      description: multiLangText,
    },
  ],

  designPhase: {
    title: multiLangText,
    desc: multiLangText,
    image: { type: String, required: false },
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
      icon: { type: String, required: false },
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

