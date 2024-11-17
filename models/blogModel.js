const mongoose = require("mongoose");
const slugify = require("slugify");

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
  },
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: String,
        enum: ["Digital Marketing Services", "Web & App Development", "Other"],
      },
    ],
    author: {
      type: String,
      required: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    tags: [tagSchema],
    image: {
      url: { type: String, required: true },
      altText: { type: String, default: "Blog Image" },
    },
    similarArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Automatically generate a slug from the title
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
