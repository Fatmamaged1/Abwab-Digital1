const mongoose = require("mongoose");
const slugify = require("slugify");

// SEO Schema
const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ["en", "ar"], required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

// Tag Schema
const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }, // Optional icon for tags
});

// Blog Schema
const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    section: {
      title: { type: String, required: true }, // Title moved here
      description: { type: String, required: true }, // Description moved here
      image: { // Section image
        url: { type: String, required: true },
        altText: { type: String, default: "Section Image" },
      },
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: String,
        enum: ["Digital Marketing Services", "Web & App Development", "Other"],
      },
    ],
    author: {
      type: String,
      required: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    image: {
      url: { type: String, required: true },
      altText: { type: String, default: "Blog Image" },
    },
    seo: [seoSchema],
    similarArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// Middleware: Automatically generate a slug from the title


module.exports = mongoose.model("Blog", blogSchema);
