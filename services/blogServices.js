const Blog = require("../models/blogModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// Cache keys
const BLOGS_ALL_KEY = "allBlogs";
const BLOG_SINGLE_KEY = (id) => `blog:${id}`;

exports.createBlog = async (req, res) => {
  try {
    const { title, description, section, content, categories, author, seo, tags, similarArticles } = req.body;

    const blogImage = req.file
      ? {
          url: `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`,
          altText: req.body.altText || "Blog Image",
        }
      : null;

    // Ensure categories is an array
    const categoriesArray = categories ? categories.split(",") : [];

    // Parse JSON fields safely
    const parseJSON = (data, defaultValue) => {
      try {
        return data ? JSON.parse(data) : defaultValue;
      } catch (error) {
        console.error(`Error parsing JSON field: ${error.message}`);
        return defaultValue;
      }
    };

    // Parse all JSON fields safely
    const similarArticlesArray = parseJSON(similarArticles, []);
    const seoArray = parseJSON(seo, []);
    const tagsArray = parseJSON(tags, []);

    // 📌 Ensure `section` is always an array
    let sectionArray = parseJSON(section, []);
    if (!Array.isArray(sectionArray)) {
      sectionArray = [];
    }

    // Add uploaded file's URL to section.image if it exists
    if (req.file && sectionArray.length > 0) {
      sectionArray = sectionArray.map((item) => ({
        ...item,
        image: {
          url: `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`,
          altText: item.image?.altText || "Section Image",
        },
      }));
    }

    const newBlog = new Blog({
      title,
      description,
      section: sectionArray, // ✅ Always an array
      content,
      categories: categoriesArray,
      author,
      tags: tagsArray,
      seo: seoArray,
      similarArticles: similarArticlesArray,
      image: blogImage,
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


// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, section, content, categories, author, tags, seo } = req.body;

    const image = req.file
      ? {
          url: `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`,
          altText: req.body.altText || "Blog Image",
        }
      : null;

    // Parse data safely
    let sectionObject = section ? JSON.parse(section) : null;
    let seoArray = seo ? JSON.parse(seo) : [];
    let tagsArray = tags ? JSON.parse(tags) : [];
    const categoriesArray = categories ? categories.split(",") : [];

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        section: sectionObject,
        content,
        categories: categoriesArray,
        author,
        tags: tagsArray,
        seo: seoArray,
        image,
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    // Update caches
    await setCache(BLOG_SINGLE_KEY(req.params.id), JSON.stringify(updatedBlog));
    await deleteCache(BLOGS_ALL_KEY);

    return res.status(200).json(formatSuccessResponse(updatedBlog, "Blog updated successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to update blog", error.message));
  }
};
// Get all blogs with full section details and images
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}, "image section title description content author createdAt categories seo")
      .populate("similarArticles", "title image");

    // Format blogs to ensure section consistency
    const formattedBlogs = blogs.map((blog) => ({
      _id: blog._id,
      title: blog.title || "",
      description: blog.description || "",
      image: blog.image || { url: "", altText: "No Image" },
      section: Array.isArray(blog.section)
        ? blog.section.map((sec) => ({
            title: sec.title || "",
            description: sec.description || "",
            image: sec.image || { url: "", altText: "No Image" },
          }))
        : [],
      content: blog.content || [],
      categories: blog.categories || [],
      author: blog.author || "Unknown",
      seo: Array.isArray(blog.seo)
        ? blog.seo.filter((seoData) => ["en", "ar"].includes(seoData.language))
        : [],
      createdAt: blog.createdAt,
    }));

    await setCache(BLOGS_ALL_KEY, JSON.stringify(formattedBlogs)); // 🔥 Cache the formatted data

    return res.status(200).json(formatSuccessResponse(formattedBlogs, "Blogs retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to retrieve blogs", error.message));
  }
};


// Get blog by ID with full section details and image handling
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("similarArticles", "title image")
      .lean();

    if (!blog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    // 📌 Ensure `section` is always an array
    const sectionArray = Array.isArray(blog.section)
      ? blog.section.map((sec) => ({
          title: sec.title || "",
          description: sec.description || "",
          image: sec.image || { url: "", altText: "No Image" },
        }))
      : [];

    // Format the blog response
    const formattedBlog = {
      title: blog.title || "",
      description: blog.description || "",
      section: sectionArray, // ✅ Always an array
      image: blog.image || { url: "", altText: "No Image" },
      _id: blog._id,
      content: blog.content || [],
      categories: blog.categories || [],
      author: blog.author || "Unknown",
      publishedDate: blog.publishedAt || blog.createdAt,
      seo: Array.isArray(blog.seo)
        ? blog.seo.map((s) => ({
            language: s.language || "en",
            metaTitle: s.metaTitle || blog.title,
            metaDescription: s.metaDescription || blog.description,
            keywords: s.keywords || [],
            canonicalTag: s.canonicalTag || "",
            structuredData: {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": blog.title,
              "description": blog.description,
              "author": {
                "@type": "Organization",
                "name": "Abwab Digital",
                "url": "https://yourwebsite.com",
              },
            },
          }))
        : [],
      similarArticles: blog.similarArticles.map((article) => ({
        title: article.title,
        url: article.url || "#", // Ensure `url` is always present
        image: article.image || { url: "", altText: "No Image" },
      })),
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      id: blog._id,
    };

    return res.status(200).json(formatSuccessResponse(formattedBlog, "Blog retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to retrieve blog", error.message));
  }
};



// Delete a blog and clear relevant caches
exports.deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

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
