const mongoose = require("mongoose");
const slugify = require("slugify");

// Reusable localized string field
const localizedString = {
  ar: { type: String, required: false },
  en: { type: String, required: false },
};

// SEO Schema
const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: false },
  metaTitle: { type: String, required: false },
  metaDescription: { type: String, required: false },
  keywords: { type: String, required: false },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

// Tag Schema
const tagSchema = new mongoose.Schema({
  name: localizedString,
  icon: { type: String },
});

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: localizedString,
  description: localizedString,
  slug: { type: String, unique: true, lowercase: true },
  section: [
    {
      title: localizedString,
      description: localizedString,
      image: {
        url: { type: String },
        altText: localizedString,
      },
    },
  ],
  content: localizedString,
  categories: [
    {
      type: String,
      enum: [
        "Digital Marketing Services",
        "Marketing Strategy",
        "Content Creation",
        "Social Media Management",
        "SEO",
        "PPC",
        "Email Marketing",
        "Web & App Development",
        "E-commerce Solutions",
        "Software Development",
        "Cybersecurity",
        "IT Consulting",
        "Data Analytics",
        "Other",
      ],
    },
  ],
  author: { type: String, required: false },
  tags: [tagSchema],
  publishedDate: { type: Date, default: Date.now },
  image: {
    url: { type: String, required: false },
    altText: localizedString,
  },
  seo: [seoSchema],
  similarArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title.en, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
