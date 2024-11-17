const mongoose = require("mongoose");

// Define Schema
const AboutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  stats: {
    clientSatisfaction: { type: String, required: true },
    expertSupport: { type: String, required: true },
    salesCount: { type: String, required: true },
    clientWorldwide: { type: String, required: true },
  },
  vision: { type: String, required: true },
  mission: { type: String, required: true },
  features: [
    {
      icon: { type: String },
      title: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
  image: { type: String }, // Path to the image file
});

// Export Model
module.exports = mongoose.model("About", AboutSchema);
