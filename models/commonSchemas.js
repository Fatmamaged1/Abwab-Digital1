const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate"); // لازم نفعّله


const multiLangText = {
  en: { type: String, required: false },
  ar: { type: String, required: false },
};

const multiLangSlug = {
  en: { type: String, required: true, unique: true },
  ar: { type: String, required: false, unique: true },
};

const imageSchema = new mongoose.Schema({
  url: { type: String, required: false },
  alt: multiLangText,
}, { _id: false });

const sectionSchema = new mongoose.Schema(
  {
    title: multiLangText,
    description: multiLangText,
    image: imageSchema,
    subsections: [
      {
        title: multiLangText,
        description: multiLangText,
        image: imageSchema,
      },
    ],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const Project = require("./projectModel");

const projectReferenceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      autopopulate: { select: "name startDate endDate client status image" },
    },
    // Snapshot fields from Project
    name: multiLangText,
    startDate: { type: Date },
    endDate: { type: Date },
    client: { type: String },
    status: { type: String },
    image: imageSchema,
    features: [multiLangText],
  },
  {
    _id: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectReferenceSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified("projectId")) {
      const project = await Project.findById(this.projectId).lean();
      if (project) {
        this.name = project.name;
        this.startDate = project.startDate;
        this.endDate = project.endDate;
        this.client = project.client;
        this.status = project.status;
        this.image = project.image;
      }
    }
    next();
  } catch (error) {
    console.error("Error populating project reference:", error);
    next(error);
  }
});

projectReferenceSchema.plugin(autopopulate);

const packageSchema = new mongoose.Schema(
  {
    title: multiLangText,
    description: multiLangText,
    price: {
      amount: { type: Number, default: 0 },
      currency: {
        type: String,
        enum: ["USD", "EUR", "RUB", "AED", "EGP", "SAR"],
        default: "USD",
      },
    },
    features: [multiLangText],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const faqSchema = new mongoose.Schema(
  {
    title: multiLangText,
    description: multiLangText,
    questions: [
      {
        question: multiLangText,
        answer: multiLangText,
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { _id: true }
);

module.exports = {
  multiLangText,
  multiLangSlug,
  imageSchema,
  sectionSchema,
  projectReferenceSchema,
  packageSchema,
  faqSchema,
};
