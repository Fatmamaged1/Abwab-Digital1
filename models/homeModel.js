// models/homeModel.js
const mongoose = require('mongoose');

const HomeSchema = new mongoose.Schema({
  heroSection: {
    welcomeText: { type: String },
    companyName: { type: String },
    description: { type: String },
    heroImage: { type: String },
  },
  statistics: [
    {
      label: { type: String, required: true },
      value: { type: Number, required: true },
    },
  ],
  services: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  portfolio: {
    title: { type: String },
    description: { type: String },
    items: [
      {
        projectTitle: { type: String },
        projectDescription: { type: String },
        projectImage: { type: String },
      },
    ],
  },
  testimonials:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Testimonial",
  },
  contactForm: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    message: { type: String },
  },
  footer: {
    aboutText: { type: String },
    quickAccessLinks: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    mainLinks: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    socialLinks: [
      {
        platform: { type: String },
        url: { type: String },
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Home = mongoose.model('Home', HomeSchema);
module.exports = Home;
