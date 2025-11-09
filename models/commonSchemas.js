const mongoose = require("mongoose");

const multiLangText = {
  en: { type: String, required: false },
  ar: { type: String, required: false },
};

const multiLangSlug = {
  en: { type: String, required: true, unique: true },
  ar: { type: String, required: false, unique: true }
};

const imageSchema = {
  url: { type: String, required: false },
  alt: {multiLangText},
};

const sectionSchema = new mongoose.Schema({
  title: multiLangText,
  description: multiLangText,
  image: imageSchema,
  subsections: [{
    title: multiLangText,
    description: multiLangText,
    image: imageSchema,
  }],
  order: { type: Number, default: 0 }, // For ordering sections
  isActive: { type: Boolean, default: true },
}, { _id: true });

const Project = require('./projectModel');

const projectReferenceSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true,
    autopopulate: { select: 'name startDate endDate client status' }
  },
  // These fields will be populated from the referenced project
  name: { type: String, required: false },
  startDate: { type: Date },
  endDate: { type: Date },
  client: { type: String },
  status: { type: String },
  features:[multiLangText],
  // Add any other fields you want to store from the Project model
}, { 
  _id: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to populate project data
projectReferenceSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('projectId')) {
      const project = await Project.findById(this.projectId);
      if (project) {
        this.name = project.name;
        this.startDate = project.startDate;
        this.endDate = project.endDate;
        this.client = project.client;
        this.status = project.status;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Package schema for service packages
const packageSchema = new mongoose.Schema({
  title: multiLangText,
  description: multiLangText,
  price: {
    amount: { type: Number, required: false },
    currency: { type: String, enum: ['USD', 'EUR', 'RUB', 'AED', 'EGP', 'SAR'], default: 'USD' },
    },
  features: [multiLangText],
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: true });

// FAQ schema
const faqSchema = new mongoose.Schema({
  title: multiLangText,
  description: multiLangText,
  questions: [{
    question: multiLangText,
    answer: multiLangText,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
}, { _id: true });

module.exports = {
  multiLangText,
  multiLangSlug,
  imageSchema,
  sectionSchema,
  projectReferenceSchema,
  packageSchema,
  faqSchema,
};
