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
 // title: { type: String, required: true },
  description: { type: String, required: true },
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
    url: { type: String, required: false },
    altText: { type: String, default: "Service Image" },
  },
 

  importance: [
    {
      desc: { type: String, required: true }, // Changed `point` to `desc`
    },
  ],
  recentProjects: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  ],
  testimonials: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' },
  ],
  // Added 'esUs' field
  distingoshesUs: [
    {
      icon: { type: String, required: false }, // Icon URL
      description: { type: String, required: true }, // Description
    },
  ],
  
  // Added 'designPhase' field
  designPhase: {
    title: { type: String, required: true },
    desc: { type: String, required: true },
    image: { type: String }, // Image URL
    satisfiedClientValues: 
      {
        title: { type: String, required: true },
        
      },

    
    values: [
      {
        title: { type: String, required: true },
        desc: { type: String, required: true },
      },
    ],
  },

  // Added 'techUsedInService' field
  techUsedInService: [
    {
      icon: { type: String, required: false }, // Icon URL
      title: { type: String, required: true }, // Title of tech
      desc: { type: String, required: true }, // Description of tech
    },
  ],

  seo: [seoSchema],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
