const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ["Mobile App Development", "Web Development", "Other"],
    required: true,
  },
  description: { type: String, required: true },
  benefits: [{ type: String }], // List of benefits of the service
  keyFeatures: [{ type: String }], // List of key features
  images: [
    {
      url: { type: String, required: true }, // URL of the image
      altText: { type: String, default: "Service Image" }, // Optional alt text for accessibility
      caption: { type: String }, // Optional caption
    },
  ],
  quoteLink: { type: String, default: "/get-quote" },
  createdAt: { type: Date, default: Date.now },
});

// Enable virtuals for JSON output
serviceSchema.set("toJSON", { virtuals: true });
serviceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Service", serviceSchema);
