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
      title,
      description,
      content,
      categories,
      author,
      seo,
      similarArticles,
      altText,
    } = req.body;

    const files = req.files || {};

    // Debug: Log the incoming body to see if tags are coming through
    console.log('Request Body:', req.body);  // Add this line to see the request body

    // ✅ Handle Main Blog Image (Cover Image)
    const mainImageFile = files.image?.[0];
    const blogImage = mainImageFile
      ? {
          url: `https://Backend.abwabdigital.com/uploads/blogs/${mainImageFile.filename}`,
          altText: altText || "Blog Image",
        }
      : { url: "", altText: "No Image Provided" };

    // ✅ Handle Sections (Same as before)
    const sectionArray = [];
    const sectionTitles = Object.entries(req.body).filter(([key]) =>
      key.startsWith("section[") && key.endsWith("]title")
    );

    for (const [key, value] of sectionTitles) {
      const index = key.match(/\[(\d+)\]/)[1];
      const title = value;
      const description = req.body[`section[${index}]description`] || "";
      const alt = req.body[`section[${index}]alt`] || "Section Image";
      const imageFile = files[`sectionImage[${index}]`]?.[0];

      sectionArray.push({
        title,
        description,
        image: {
          url: imageFile
            ? `https://Backend.abwabdigital.com/uploads/blogs/${imageFile.filename}`
            : "",
          altText: alt,
        },
      });
    }

    // ✅ Handle Tags (Handle tagname[] correctly)
    const tagArray = [];
    if (req.body.tagname) {
      // Ensure that tagname is an array
      req.body.tagname.forEach((name, index) => {
        const iconFile = files[`tagIcon[${index}]`]?.[0];

        console.log(`Tag ${index} - Name: ${name}, Icon: ${iconFile ? iconFile.filename : 'No Icon'}`);  // Debugging tag names and icon filenames

        tagArray.push({
          name,
          icon: iconFile
            ? `https://Backend.abwabdigital.com/uploads/tags/${iconFile.filename}`
            : "",
        });
      });
    }

    // Debug: Check if the tags were processed correctly
    console.log('Processed Tags:', tagArray);

    // ✅ Parse Categories
    const categoriesArray = categories ? categories.split(",") : [];

    // ✅ Parse SEO and Similar Articles JSON (Handle errors gracefully)
    const parseJSON = (data, defaultValue) => {
      try {
        return data ? JSON.parse(data) : defaultValue;
      } catch (e) {
        console.error("❌ JSON parse error:", e.message);
        return defaultValue;
      }
    };

    const seoArray = parseJSON(seo, []);
    const similarArticlesArray = parseJSON(similarArticles, []);

    // ✅ Create New Blog
    const newBlog = new Blog({
      title,
      description,
      content,
      author,
      categories: categoriesArray,
      section: sectionArray,
      tags: tagArray,  // This now includes tags as objects with name and icon
      seo: seoArray,
      similarArticles: similarArticlesArray,
      image: blogImage,
    });

    // Save Blog to Database
    const savedBlog = await newBlog.save();

    // Optional: Clear Cache if needed (if using caching)
    await deleteCache(BLOGS_ALL_KEY);

    // Return Success Response
    return res
      .status(201)
      .json(formatSuccessResponse(savedBlog, "Blog created successfully"));

  } catch (error) {
    console.error('Error creating blog:', error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];

      return res.status(400).json({
        success: false,
        message: "Failed to create blog",
        data: `The ${duplicatedField} '${duplicatedValue}' is already in use.`,
      });
    }

    return res
      .status(500)
      .json(formatErrorResponse("Failed to create blog", error.message));
  }
};





// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      categories,
      author,
      seo,
      altText,
    } = req.body;

    const categoriesArray = categories ? categories.split(",") : [];

    // ✅ تحليل الـ SEO
    const seoArray = seo ? JSON.parse(seo) : [];

    // ✅ معالجة الصورة الرئيسية
    const mainImage = req.files?.image?.[0];
    const blogImage = mainImage
      ? {
          url: `https://Backend.abwabdigital.com/uploads/blogs/${mainImage.filename}`,
          altText: altText || "Blog Image",
        }
      : undefined; // لتفادي حذفها إذا لم تُرسل

    // ✅ تجميع التاجات من tagname[n] + tagIcons[n]
    const tagnames = Array.isArray(req.body.tagname) ? req.body.tagname : [req.body.tagname];
    const tagIcons = req.files?.tagIcons || [];

    const tagsArray = tagnames.map((name, i) => ({
      name,
      icon: tagIcons[i]
        ? `https://Backend.abwabdigital.com/uploads/tags/${tagIcons[i].filename}`
        : "",
    }));

    // ✅ تجميع السكاشن من section[n]title/desc/alt + الصور
    const sectionTitles = Array.isArray(req.body["sectionTitle"]) ? req.body["sectionTitle"] : [req.body["sectionTitle"]];
    const sectionDescs = Array.isArray(req.body["sectionDesc"]) ? req.body["sectionDesc"] : [req.body["sectionDesc"]];
    const sectionAlts = Array.isArray(req.body["sectionAlt"]) ? req.body["sectionAlt"] : [req.body["sectionAlt"]];
    const sectionImages = req.files?.sectionImages || [];

    const sectionArray = sectionTitles.map((title, i) => ({
      title,
      description: sectionDescs[i] || "",
      image: {
        url: sectionImages[i]
          ? `https://Backend.abwabdigital.com/uploads/blogs/${sectionImages[i].filename}`
          : "",
        altText: sectionAlts[i] || "Section Image",
      },
    }));

    // ✅ تحديث البيانات
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(categoriesArray && { categories: categoriesArray }),
        ...(author && { author }),
        ...(tagsArray && { tags: tagsArray }),
        ...(seoArray && { seo: seoArray }),
        ...(sectionArray && { section: sectionArray }),
        ...(blogImage && { image: blogImage }),
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

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
        id: article._id,
        title: article.title,
        url: `https://Backend.abwabdigital.com/blog/${article._id}`,
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
