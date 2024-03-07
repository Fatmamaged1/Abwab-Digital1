const mongoose = require("mongoose");

// Sub-schema for representing individual services
const serviceSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technology" }],
  team: {
    projectManagers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    ],
    developers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    designers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    testers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  },
  startDate: { type: Date },
  endDate: { type: Date },

  testimonials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Testimonial" }],
  status: {
    type: String,
    enum: ["Pending", "Active", "Completed"],
    default: "Pending",
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
});

module.exports = mongoose.model("Service", serviceSchema);
