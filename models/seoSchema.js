const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ["en", "ar"], required: true }, // Language code (e.g., "en", "ar")
  metaTitle: { type: String, required: true }, // Page title for SEO
  metaDescription: { type: String, required: true }, // Meta description for SEO
  keywords: { type: String, required: true }, // Comma-separated keywords
  canonicalTag: { type: String }, // Canonical URL for the page
  structuredData: { type: mongoose.Schema.Types.Mixed }, // JSON-LD structured data
});

module.exports = seoSchema;
