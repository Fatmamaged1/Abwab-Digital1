const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "We help you grow your business faster"
  description: { type: String, required: true }, // Main text content
  stats: {
    clients: { type: String }, // e.g., "90+ Clients"
    countries: { type: String }, // e.g., "30+ Countries"
    projects: { type: String }, // e.g., "50+ Projects"
  },
  services: [
    {
      image: { type: String, required: true }, 
      title: { type: String, required: true }, 
      description: { type: String, required: true }, }
  ],
  features: [
    {
      icon: { type: String, required: true }, 
      title: { type: String, required: true }, 
      subtitle: { type: String, required: true }, 
    },
  ],
  footer: {
    copyright: { type: String, required: false }, 
    socialLinks: {
      discord: { type: String },
      twitter: { type: String },
      youtube: { type: String },
    },
    quickLinks: [String], 
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
