const mongoose = require("mongoose");
const slugify = require("slugify");

// Define the schema for the 'tag' within a blog
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});

// Define the main schema for the 'Blog' model
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      unique: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [350, "Title must not exceed 128 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [20, "Content must be at least 20 characters"],
    },
    tags: [tagSchema], // Array of tags using the previously defined tagSchema
    createdAt: Date,

    image: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create the 'Blog' model using the defined schema
module.exports = mongoose.model("Blog", blogSchema);
