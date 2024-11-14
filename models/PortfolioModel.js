const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  images: [
    {
      url: { type: String, required: true },
      altText: { type: String, default: "Image" },
      caption: { type: String },
    },
  ],
  designScreens: {
    web: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: "Image" },
        caption: { type: String },
      },
    ],
    app: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: "Image" },
        caption: { type: String },
      },
    ],
  },
  category: {
    type: String,
    enum: ["Mobile App", "Website", "Other"],
    required: true,
  },
  client: { type: String },
  status: {
    type: String,
    enum: ["Planning", "Development", "Testing", "Completed", "Other"],
  },
  budget: {
    type: Number,
    min: 0, // Ensure positive budget
  },
  currency: {
    type: String,
    enum: ["USD", "EUR", "RUB", "AED", "EGP", "SAR"],
  },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  createdAt: { type: Date, default: Date.now },
});

// Virtual field for duration
portfolioSchema.virtual("duration").get(function () {
  if (!this.startDate) return "No start date";
  if (!this.endDate) return "Ongoing";
  const diffInDays = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
  return `${Math.floor(diffInDays)} days`;
});

// Enable virtuals for JSON and Object output
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);
