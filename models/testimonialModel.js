const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  name: { type: String },
  content: { type: String },
  rating: { type: Number, default: 5 },
  icon: { type: String },
});

const testimonial = new mongoose.model("Testimonial", testimonialSchema);

module.exports = testimonial;
