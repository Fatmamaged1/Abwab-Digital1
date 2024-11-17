const Blog = require("../models/blogModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Cache keys
const BLOGS_ALL_KEY = "allBlogs";
const BLOG_SINGLE_KEY = (id) => `blog:${id}`;

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, description, content, categories, author, tags, similarArticles } = req.body;

    const image = req.file
      ? {
          url: `http://localhost:4000/uploads/blogs/${req.file.filename}`,
          altText: req.body.altText || "Blog Image",
        }
      : null;

    // Ensure categories is an array
    const categoriesArray = categories.split(",");

    // Check if similarArticles is a valid JSON string and parse it
    let similarArticlesArray = [];
    if (similarArticles) {
      try {
        // If similarArticles is a string, attempt to parse it
        similarArticlesArray = JSON.parse(similarArticles);
      } catch (error) {
        // If JSON.parse fails, leave it as an empty array
        console.error("Error parsing similarArticles:", error);
      }
    }

    const newBlog = new Blog({
      title,
      description,
      content,
      categories: categoriesArray,
      author,
      tags: JSON.parse(tags), // Parse tags as JSON
      similarArticles: similarArticlesArray, // Set similarArticles
      image,
    });

    const savedBlog = await newBlog.save();

    // Clear cached blogs list
    await deleteCache(BLOGS_ALL_KEY);

    return res.status(201).json(formatSuccessResponse(savedBlog, "Blog created successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to create blog", error.message));
  }
};

// Get all blogs with caching
exports.getAllBlogs = async (req, res) => {
  try {
    // Check Redis cache first
    const cachedBlogs = await getCache(BLOGS_ALL_KEY);
    if (cachedBlogs) {
      return res
        .status(200)
        .json(formatSuccessResponse(cachedBlogs, "Blogs retrieved successfully from cache"));
    }

    // Fetch blogs from the database and populate `similarArticles`
    const blogs = await Blog.find().populate("similarArticles");

    // Cache the result
    await setCache(BLOGS_ALL_KEY, blogs);

    return res
      .status(200)
      .json(formatSuccessResponse(blogs, "Blogs retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to retrieve blogs", error.message));
  }
};



exports.getBlogById = async (req, res) => {
  const cacheKey = BLOG_SINGLE_KEY(req.params.id);
  try {
      const cachedBlog = await getCache(cacheKey);
      if (cachedBlog) {
          return res.status(200).json(formatSuccessResponse(cachedBlog, "Blog retrieved successfully from cache"));
      }

      // Fetch and populate `similarArticles`
      const blog = await Blog.findById(req.params.id).populate("similarArticles");
      if (!blog) {
          return res.status(404).json(formatErrorResponse("Blog not found"));
      }

      // Cache the populated result
      await setCache(cacheKey, blog);

      return res.status(200).json(formatSuccessResponse(blog, "Blog retrieved successfully"));
  } catch (error) {
      console.error(error);
      return res.status(500).json(formatErrorResponse("Failed to retrieve blog", error.message));
  }
};



// Update a blog and clear relevant caches
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, content, categories, author, tags } = req.body;

    const image = req.file
      ? {
          url: `http://localhost:4000/uploads/blogs/${req.file.filename}`,
          altText: req.body.altText || "Blog Image",
        }
      : null;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        content,
        categories: categories.split(","),
        author,
        tags: JSON.parse(tags),
        image,
      },
      { new: true }
    );

    if (!updatedBlog)
      return res.status(404).json(formatErrorResponse("Blog not found"));

    // Update cache
    await setCache(BLOG_SINGLE_KEY(req.params.id), updatedBlog);
    await deleteCache(BLOGS_ALL_KEY); // Clear cached list of all blogs

    return res
      .status(200)
      .json(formatSuccessResponse(updatedBlog, "Blog updated successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to update blog", error.message));
  }
};

// Delete a blog and clear relevant caches
exports.deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog)
      return res.status(404).json(formatErrorResponse("Blog not found"));

    // Clear caches related to this item
    await deleteCache(BLOG_SINGLE_KEY(req.params.id));
    await deleteCache(BLOGS_ALL_KEY);

    return res
      .status(200)
      .json(formatSuccessResponse(null, "Blog deleted successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(formatErrorResponse("Failed to delete blog", error.message));
  }
};
