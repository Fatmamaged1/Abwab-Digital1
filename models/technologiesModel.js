const mongoose = require("mongoose");
const Project = require("./projectModel");
const Employee = require("./employeeModel");

const technologySchema = new mongoose.Schema(
  {
    name: {
      type: String, //required: true,
      unique: true,
    },
    description: { type: String },
    category: [
      {
        type: String,
        enum: [
          "Backend",
          "Frontend",
          "Mobile",
          "Product Design",
          "Database",
          "DevOps",
          "Cloud",
          "Storage",
          "Other",
        ],
      },
    ],
    version: { type: String, match: /^[0-9]+\.[0-9]+\.[0-9]+$/ }, // semantic versioning
    releaseDate: { type: Date },
    documentation: { type: String },
    contributors: [
      {
        name: { type: String },
        email: { type: String },
        role: {
          type: String,
          enum: ["Developer", "Designer", "Tester", "Other"],
        },
      },
    ],
    dependencies: [{ type: String }],
    frameworks: [{ type: String }],
    languages: [{ type: String }],
    platforms: [{ type: String }],
    repositories: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String, enum: ["Git", "SVN", "Mercurial", "Other"] },
      },
    ],
    popularity: {
      rank: { type: Number },
      stars: { type: Number },
      forks: { type: Number },
    },
    tags: [{ type: String }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    lastUpdated: { type: Date, default: Date.now },
    license: { type: String },
    website: { type: String },
    community: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    tutorials: [{ type: String }],
    compatibility: [{ type: String }],
    usageExamples: [{ type: String }],
    relatedTechnologies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Technology" },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Technology", technologySchema);
