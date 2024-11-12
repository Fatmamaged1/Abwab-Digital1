const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  createBlogValidator,
  getBlogValidator,
  updateBlogValidator,
  deleteBlogValidator,
} = require("../validator/blogValidator");
const blogModel = require("../models/blogModel");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/blogs/");
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});
const upload = multer({ storage });

// Get all blogs with caching
router.route("/").get(async (req, res) => {
  const cacheKey = "allBlogs";
  try {
    const cachedBlogs = await getCache(cacheKey);
    if (cachedBlogs) {
      return res.json(formatSuccessResponse(cachedBlogs, "Blogs retrieved from cache"));
    }

    const blogs = await blogModel.find();
    await setCache(cacheKey, blogs);
    return res.json(formatSuccessResponse(blogs, "Blogs retrieved successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error retrieving blogs", error.message));
  }
});

// Get a single blog with caching
router.route("/:id").get(getBlogValidator, async (req, res) => {
  const blogId = req.params.id;
  const cacheKey = `blog_${blogId}`;
  try {
    const cachedBlog = await getCache(cacheKey);
    if (cachedBlog) {
      return res.json(formatSuccessResponse(cachedBlog, "Blog retrieved from cache"));
    }

    const blog = await blogModel.findById(blogId);
    if (!blog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    await setCache(cacheKey, blog);
    return res.json(formatSuccessResponse(blog, "Blog retrieved successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error retrieving blog", error.message));
  }
});

// Create a new blog and clear the cache
router.route("/").post(
  upload.single("image"),
  createBlogValidator,
  async (req, res) => {
    try {
      const newBlog = new blogModel({
        ...req.body,
        image: req.file ? req.file.filename : null,
      });
      const savedBlog = await newBlog.save();
      await deleteCache("allBlogs");
      return res.status(201).json(formatSuccessResponse(savedBlog, "Blog created successfully"));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error creating blog", error.message));
    }
  }
);

// Update a blog and clear the cache
router.route("/:id").put(updateBlogValidator, async (req, res) => {
  const blogId = req.params.id;
  try {
    const updatedBlog = await blogModel.findByIdAndUpdate(blogId, req.body, { new: true });
    if (!updatedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    await deleteCache("allBlogs");
    await deleteCache(`blog_${blogId}`);
    return res.json(formatSuccessResponse(updatedBlog, "Blog updated successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error updating blog", error.message));
  }
});

// Delete a blog and clear the cache
router.route("/:id").delete(deleteBlogValidator, async (req, res) => {
  const blogId = req.params.id;
  try {
    const deletedBlog = await blogModel.findByIdAndDelete(blogId);
    if (!deletedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    await deleteCache("allBlogs");
    await deleteCache(`blog_${blogId}`);
    return res.json(formatSuccessResponse(null, "Blog deleted successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error deleting blog", error.message));
  }
});

module.exports = router;
