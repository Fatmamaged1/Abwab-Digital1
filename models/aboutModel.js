const mongoose = require("mongoose");

// Define Schema
const AboutSchema = new mongoose.Schema(
  {
    hero: {
      title: { type: String, required: true }, // Main Title
      description: { type: String, required: true }, // Subheading
      image: { type: String, required: false }, // Path to hero image
    },
    stats: [
      {
        label: { type: String, required: true }, // e.g., "Client Satisfaction"
        value: { type: String, required: true }, // e.g., "95%"
      },
    ],
    values: [
      {
        icon: { type: String, required: true }, // Icon path or class
        title: { type: String, required: true }, // Value title (e.g., "Integrity")
        description: { type: String, required: true }, // Description of value
      },
    ],
    features: [
      {
        icon: { type: String, required: true }, // Icon for feature
        title: { type: String, required: true }, // e.g., "Reliability"
        description: { type: String, required: true }, // Why this feature matters
      },
    ],
    services: [
      {
       type: mongoose.Schema.Types.ObjectId, ref: 'Service'
      },
    ],
    technologies: [
      {
        name: { type: String, required: true }, // Technology name (e.g., "JavaScript")
        icon: { type: String }, // Optional icon/logo for the tech
      },
    ],
    portfolio: [
     {type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio'}
    ],
    home: {type: mongoose.Schema.Types.ObjectId, ref: 'Home'},
    footer: {
      companyName: { type: String, required: false }, // e.g., "Abwab Digital"
      socialLinks: [
        {
          platform: { type: String, required: false }, // e.g., "Facebook"
          link: { type: String, required: false }, // URL to the social page
        },
      ],
    },
  },
  { timestamps: true } // Enables createdAt and updatedAt
);

// Export Model
module.exports = mongoose.model("About", AboutSchema);
