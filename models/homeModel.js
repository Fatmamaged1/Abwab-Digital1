const mongoose = require('mongoose');

// Schema for SEO fields
const seoSchema = new mongoose.Schema({
  language: { type: String, enum: ['en', 'ar'], required: true }, // Language code (e.g., "en", "ar")
  metaTitle: { type: String, required: true }, // Page title for SEO
  metaDescription: { type: String, required: true }, // Meta description for SEO
  keywords: { type: String, required: true }, // Comma-separated keywords
  canonicalTag: { type: String }, // Canonical URL for the page
  structuredData: { type: mongoose.Schema.Types.Mixed }, // JSON-LD structured data
});

const HomeSchema = new mongoose.Schema({
  heroSection: {
    welcomeText: { type: String }, // "Elevating Your Business..."
    companyName: { type: String }, // "Abwab Digital"
    description: { type: String }, // Supporting description text
    heroImage: { type: String }, // URL for the hero image
    ctaText: { type: String }, // Call-to-action button text
    ctaLink: { type: String }, // Call-to-action button link
    altText: { type: String }, // Alt text for the hero image
  },
  statistics: [
    {
      label: { type: String, required: true }, // Example: "Projects Completed"
      value: { type: Number, required: true }, // Example: 200+
    },
  ],
  services: [
    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  ],
  aboutSection: {
    title: { type: String }, // Example: "Welcome to Abwab Digital"
    description: { type: String }, // Text description for the about section
    image: { type: String }, // URL for the image
    altText: { type: String }, // Alt text for the about section image
    values: [
      {
        title: { type: String }, // Example: "Innovation"
        description: { type: String }, // Description of the value
      },
    ],
  },
  portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' }],
  scheduleSection: {
    title: { type: String }, // Example: "Schedule Your Consultation"
    description: { type: String }, // Supporting description
    availableDates: [
      {
        date: { type: Date }, // Available date for scheduling
        timeSlots: [{ type: String }], // Example: ["10:00 AM", "2:00 PM"]
      },
    ],
  },
  whyChooseUs: [
    {
      title: { type: String }, // Example: "Reliability"
      description: { type: String }, // Supporting description
      icon: { type: String }, // Icon or image URL
    },
  ],
  trustedPartners: [
    {
      name: { type: String }, // Example: "Google"
      logo: { type: String }, // URL of the partner's logo
      link: { type: String }, // Optional link to the partner's website
      altText: { type: String }, // Alt text for the partner's logo
    },
  ],
  blogSection: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  ],
  testimonials: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' },
  ],
  footer: {
    aboutText: { type: String }, // Brief about text
    quickAccessLinks: [
      {
        name: { type: String }, // Example: "Home"
        url: { type: String }, // URL for the link
      },
    ],
    mainLinks: [
      {
        name: { type: String }, // Example: "Services"
        url: { type: String }, // URL for the link
      },
    ],
    socialLinks: [
      {
        platform: { type: String }, // Example: "Facebook"
        url: { type: String }, // URL for the social link
        icon: { type: String }, // Icon or image URL
      },
    ],
  },
  seo: [seoSchema], // Array to support multilingual SEO
  url: { type: String, required: true, unique: true }, // Unique URL for the page
  content: { type: String }, // Content for the page
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Home = mongoose.model('Home', HomeSchema);
module.exports = Home;
