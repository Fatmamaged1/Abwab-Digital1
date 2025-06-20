const mongoose = require("mongoose");
const slugify = require("slugify");

// Reusable localized string field
const localizedString = {
  ar: { type: String, required: true },
  en: { type: String, required: true },
};

// SEO Schema
const seoSchema = new mongoose.Schema({
  metaTitle: localizedString,
  metaDescription: localizedString,
  keywords: localizedString,
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
        "Web & App Development",
        "Other",
      ],
    },
  ],
  author: { type: String, required: true },
  tags: [tagSchema],
  publishedDate: { type: Date, default: Date.now },
  image: {
    url: { type: String, required: true },
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
