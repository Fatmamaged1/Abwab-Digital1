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
          url: `https://Backend.abwabdigital.com/uploads/blogs/${req.file.filename}`,
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
          url: `https://Backend.abwabdigital.com/uploads/blogs/${req.file.filename}`,
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
          url: `https://Backend.abwabdigital.com/uploads/blogs/${req.file.filename}`,
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
    // Extract requested language from query string (default: "en")
    const language = req.query.language || "en";

    // Fetch blogs with the required fields and populate similarArticles
    const blogs = await Blog.find({}, "image section title description content author createdAt categories seo")
      .populate("similarArticles", "title image");

    // Format blogs to ensure section consistency and process SEO
    const formattedBlogs = blogs.map((blog) => {
      const blogObj = blog.toObject();
      
      // Ensure section is always an array
      blogObj.section = Array.isArray(blogObj.section)
        ? blogObj.section.map(sec => ({
            title: sec.title || "",
            description: sec.description || "",
            image: sec.image || { url: "", altText: "No Image" }
          }))
        : [];
      
      // Process SEO for each blog: if an SEO array exists, pick the entry for the requested language (fallback to the first)
      if (Array.isArray(blogObj.seo) && blogObj.seo.length > 0) {
        blogObj.seo = blogObj.seo.find(seo => seo.language === language) || blogObj.seo[0];
      } else {
        blogObj.seo = {};
      }
      
      // Process similarArticles if needed
      blogObj.similarArticles = blogObj.similarArticles.map(article => ({
        title: article.title,
        url: article.url || "#",
        image: article.image || { url: "", altText: "No Image" }
      }));

      return blogObj;
    });

    // Global SEO for the entire blogs page
    const globalSeo = {
      language,
      metaTitle: language === "en" ? "Our Blogs" : "مدوناتنا",
      metaDescription: language === "en"
        ? "Discover our latest articles and insights."
        : "اكتشف أحدث مقالاتنا وأفكارنا.",
      keywords: language === "en" ? "blogs, articles, insights" : "مدونات, مقالات, آراء",
      canonicalTag: "",
      structuredData: {}
    };

    return res.status(200).json(formatSuccessResponse({ globalSeo, blogs: formattedBlogs }, "Blogs retrieved successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Failed to retrieve blogs", error.message));
  }
};


// Get blog by ID with full section details and image handling
exports.getBlogById = async (req, res) => {
  try {
    const language = req.query.language || "en";
    const similarLimit = parseInt(req.query.limit) || 5; // ← تحديد عدد المقالات المشابهة، افتراضيًا 5

    // 1. Get the main blog
    const blog = await Blog.findById(req.params.id).lean();

    if (!blog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    // 2. Prepare section
    const sectionArray = Array.isArray(blog.section)
      ? blog.section.map(sec => ({
          title: sec.title || "",
          description: sec.description || "",
          image: sec.image || { url: "", altText: "No Image" }
        }))
      : [];

    // 3. SEO data
    let seoData = {};
    if (Array.isArray(blog.seo) && blog.seo.length > 0) {
      seoData = blog.seo.find(seo => seo.language === language) || blog.seo[0];
    }

    // 4. Get similar articles
    const similarArticles = await Blog.find({
      _id: { $ne: blog._id },
      categories: { $in: blog.categories },
    })
      .limit(similarLimit) // ← limit مرن
      .select("title image")
      .lean();

    // 5. Format response
    const formattedBlog = {
      title: blog.title || "",
      description: blog.description || "",
      section: sectionArray,
      image: blog.image || { url: "", altText: "No Image" },
      _id: blog._id,
      content: blog.content || [],
      categories: blog.categories || [],
      author: blog.author || "Unknown",
      publishedDate: blog.publishedAt || blog.createdAt,
      seo: seoData,
      similarArticles: similarArticles.map(article => ({
        title: article.title,
        url: `/blog/${article._id}`,
        image: article.image || { url: "", altText: "No Image" }
      })),
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      id: blog._id
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
