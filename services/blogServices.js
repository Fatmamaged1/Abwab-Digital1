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
    const {
      section,
      content,
      categories,
      author,
      seo,
      similarArticles,
    } = req.body;
   // console.log(req.body);

    const blogImage = req.file
      ? {
          url: `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`,
          altText: req.body.altText || "Blog Image",
        }
      : null;

    // Ensure categories is an array
    const categoriesArray = categories.split(",");

    // Parse similarArticles safely
    let similarArticlesArray = [];
    if (similarArticles) {
      try {
        similarArticlesArray = JSON.parse(similarArticles);
      } catch (error) {
        console.error("Error parsing similarArticles:", error);
        return res.status(400).json({ message: "Invalid JSON format for similarArticles" });
      }
    }

    // Parse section safely
    // Parse section safely
let sectionObject = null;
if (section) {
  try {
    sectionObject = JSON.parse(section);

    // Add uploaded file's URL to the section.image if file exists
    if (req.file) {
      sectionObject.image.url = `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`;
    }
  } catch (error) {
    console.error("Error parsing section:", error);
    return res.status(400).json({ message: "Invalid JSON format for section" });
  }
} else {
  return res.status(400).json({ message: "Section is required" });
}

let seoObject = null;

if (seo) {
  try {
    const parsedSeo = JSON.parse(seo);

    if (Array.isArray(parsedSeo)) {
      seoObject = parsedSeo[0]; // Use the first object in the array
    } else {
      seoObject = parsedSeo;
    }
  } catch (error) {
    console.error("Error parsing SEO:", error);
    return res.status(400).json({ message: "Invalid JSON format for SEO" });
  }
}

    const newBlog = new Blog({
      section: sectionObject, // Add parsed section here
      content,
      categories: categoriesArray,
      author,
      seo: seoObject, // Add parsed SEO here
      similarArticles: similarArticlesArray, // Set similarArticles
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


// Get all blogs with full section details and images
exports.getAllBlogs = async (req, res) => {
  try {
  
    const blogs = await Blog.find({}, "image section.title section.description section.content section.image author createdAt categories seo content")
      .populate("similarArticles", "title image");

    const formattedBlogs = blogs.map((blog) => ({
      ...blog._doc,
      section: {
        title: blog.section?.title || "",
        description: blog.section?.description || "",
      //  content: Array.isArray(blog.section?.content) ? blog.section.content : [],
        image: blog.section?.image || { url: "", altText: "No Image" },
      },
      content: blog.content || "",
      seo: blog.seo.filter((seoData) => ["en", "ar"].includes(seoData.language)),
    }));

    await setCache(BLOGS_ALL_KEY, JSON.stringify(formattedBlogs)); // 🔥 تخزين البيانات كمصفوفة JSON
    return res.status(200).json(formatSuccessResponse(formattedBlogs, "Blogs retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to retrieve blogs", error.message));
  }
};


// Get blog by ID with full section details and image handling
exports.getBlogById = async (req, res) => {
  const cacheKey = BLOG_SINGLE_KEY(req.params.id);

  try {
    let cachedBlog = await getCache(cacheKey);
    if (cachedBlog) {
      try {
        cachedBlog = JSON.parse(cachedBlog);
      } catch (err) {
        console.warn("Cache parsing error, using raw cached data", err);
      }
      return res.status(200).json(formatSuccessResponse(cachedBlog, "Blog retrieved successfully from cache"));
    }

    const blog = await Blog.findById(req.params.id)
      .populate("similarArticles", "title image")
      .lean();

    if (!blog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    const formattedBlog = {
      section: {
        title: blog.section?.title || "",
        description: blog.section?.description || "",
        image: blog.section?.image || { url: "", altText: "No Image" },
      },
      image: blog.image || { url: "", altText: "No Image" },
      _id: blog._id,
      content: blog.content || [],
      categories: blog.categories || [],
      author: blog.author || "Unknown",
      publishedDate: blog.publishedAt || blog.createdAt,
      seo: [
        {
          language: "en",
          metaTitle: blog.seo?.metaTitle || blog.title,
          metaDescription: blog.seo?.metaDescription || blog.description,
          keywords: blog.seo?.keywords || [],
          canonicalTag: blog.seo?.canonicalTag || "",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": blog.title,
            "description": blog.description,
            "author": {
              "@type": "Organization",
              "name": "Abwab Digital",
              "url": "https://yourwebsite.com"
            }
          }
        }
      ],
      similarArticles: blog.similarArticles.map((article) => ({
        title: article.title,
        url: article.url,
        image: article.image || { url: "", altText: "No Image" },
      })),
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      id: blog._id,
    };

    await setCache(cacheKey, JSON.stringify(formattedBlog));
    return res.status(200).json(formatSuccessResponse(formattedBlog, "Blog retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to retrieve blog", error.message));
  }
};

// Update a blog and clear relevant caches
exports.updateBlog = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      categories,
      author,
      tags,
      seo,
    } = req.body;

    const image = req.file
      ? {
          url: `http://91.108.102.81:4000/uploads/blogs/${req.file.filename}`,
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
        seo, // Update the SEO object
        image,
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    await setCache(BLOG_SINGLE_KEY(req.params.id), updatedBlog);
    await deleteCache(BLOGS_ALL_KEY);

    return res
      .status(200)
      .json(formatSuccessResponse(updatedBlog, "Blog updated successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to update blog", error.message));
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
