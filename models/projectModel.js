const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  images:[{ type: String}],
  endDate: { type: Date },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  budget: { type: Number },
  currency: {
    type: String,
    enum: ["USD", "EUR", "RUB", "AED", "EGP", "SAR"],
  },
  client: { type: String },
  status: {
    type: String,
    enum: ["Planning", "Development", "Testing", "Completed", "Other"],
  },
});
const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
