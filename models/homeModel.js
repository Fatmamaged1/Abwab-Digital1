const mongoose = require('mongoose'); 

// Schema for SEO fields
const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  canonicalTag: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
});

// Home Page Schema
const HomeSchema = new mongoose.Schema({
  heroSection: {
    title: { type: String, required: true }, // Added Title
    description: { type: String, required: true }, // Added Description
    welcomeText: { type: String },
    companyName: { type: String },
    heroImage: { type: String },  // Main hero image URL
    backgroundImage: { type: String }, // Background image
    ctaText: { type: String }, 
    ctaLink: { type: String }, 
    altText: { type: String },
    statistics: [ // Added statistics for position, experience, etc.
      {
        label: { type: String, required: true },
        value: { type: Number, required: true },
        icon: { type: String }, // Icon for each statistic
      },
    ],
  },
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
  ],
  aboutSection: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'About',
    },
  ],
  portfolio: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
    },
  ],blogSection: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
  testimonials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Testimonial',
    },
  ],
  scheduleSection: {
    title: { type: String },
    description: { type: String },
    availableDates: [
      {
        date: { type: Date },
        timeSlots: [{ type: String }],
      },
    ],
  },
  whyChooseUs: [
    {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
    },
  ],
  trustedPartners: [
    {
      name: { type: String },
      logo: { type: String },
      link: { type: String },
      altText: { type: String },
    },
  ],
  technologyStack: [
    {
      name: { type: String }, // Example: "React"
      icon: { type: String }, // Technology logo/icon
    },
  ],
  
  contactForm: {
    title: { type: String },
    fields: [
      {
        label: { type: String },
        type: { type: String, enum: ['text', 'email', 'textarea'] },
        required: { type: Boolean, default: false },
      },
    ],
  },
  footer: {
    aboutText: { type: String },
    quickAccessLinks: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    mainLinks: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    socialLinks: [
      {
        platform: { type: String },
        url: { type: String },
        icon: { type: String },
      },
    ],
  },
  seo: [seoSchema],
  url: { type: String, required: true, unique: true },
  content: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Home = mongoose.model('Home', HomeSchema);
module.exports = Home;
