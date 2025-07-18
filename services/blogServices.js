const slugify = require("slugify");
const Blog = require("../models/blogModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { deleteCache } = require("../utils/cache");

const BLOGS_ALL_KEY = "allBlogs";

exports.createBlog = async (req, res) => {
  try {
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      contentAr,
      contentEn,
      categories,
      author,
      seo,
      similarArticles,
      altText,
    } = req.body;

    const files = req.files || {};

    // ✅ Handle Main Blog Image
    const mainImageFile = files.image?.[0];
    const parsedAltText = altText ? JSON.parse(altText) : { ar: "صورة التدوينة", en: "Blog Image" };
    const blogImage = mainImageFile
      ? {
          url: `https://backend.abwabdigital.com/uploads/blogs/${mainImageFile.filename}`,
          altText: parsedAltText,
        }
      : {
          url: "",
          altText: { ar: "لا توجد صورة", en: "No Image Provided" },
        };

    // ✅ Handle Sections
    const sectionArray = [];
    const sectionTitles = Object.entries(req.body).filter(([key]) =>
      key.startsWith("section[") && key.endsWith("]titleAr")
    );

    for (const [key, value] of sectionTitles) {
      const index = key.match(/\[(\d+)\]/)[1];
      const title = {
        ar: value,
        en: req.body[`section[${index}]titleEn`] || "",
      };
      const description = {
        ar: req.body[`section[${index}]descriptionAr`] || "",
        en: req.body[`section[${index}]descriptionEn`] || "",
      };
      const altRaw = req.body[`section[${index}]alt`] || "{}";
      const altParsed = JSON.parse(altRaw);
      const imageFile = files[`sectionImage[${index}]`]?.[0];

      sectionArray.push({
        title,
        description,
        image: {
          url: imageFile
            ? `https://backend.abwabdigital.com/uploads/blogs/${imageFile.filename}`
            : "",
          altText: altParsed,
        },
      });
    }

    // ✅ Handle Tags
    const tagArray = [];
    if (req.body.tagnameAr && req.body.tagnameEn) {
      const tagnameAr = Array.isArray(req.body.tagnameAr) ? req.body.tagnameAr : [req.body.tagnameAr];
      const tagnameEn = Array.isArray(req.body.tagnameEn) ? req.body.tagnameEn : [req.body.tagnameEn];

      tagnameAr.forEach((nameAr, index) => {
        const iconFile = files[`tagIcon[${index}]`]?.[0];

        tagArray.push({
          name: {
            ar: nameAr,
            en: tagnameEn[index] || "",
          },
          icon: iconFile
            ? `https://backend.abwabdigital.com/uploads/tags/${iconFile.filename}`
            : "",
        });
      });
    }

    // ✅ Parse Categories
    const categoriesArray = categories ? categories.split(",") : [];

    // ✅ Parse JSON fields
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

    // ✅ Create Blog Document
    const newBlog = new Blog({
      title: { ar: titleAr, en: titleEn },
      description: { ar: descriptionAr, en: descriptionEn },
      content: { ar: contentAr, en: contentEn },
      author,
      categories: categoriesArray,
      section: sectionArray,
      tags: tagArray,
      seo: seoArray,
      similarArticles: similarArticlesArray,
      image: blogImage,
      slug: slugify(titleEn || titleAr, { lower: true, strict: true }),
      publishedDate: new Date(),
    });

    const savedBlog = await newBlog.save();
    await deleteCache(BLOGS_ALL_KEY);

    return res.status(201).json(
      formatSuccessResponse(savedBlog, "Blog created successfully")
    );
  } catch (error) {
    console.error("Error creating blog:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];

      return res.status(400).json({
        success: false,
        message: "Failed to create blog",
        data: `The ${duplicatedField} '${duplicatedValue}' is already in use.`,
      });
    }

    return res.status(500).json(
      formatErrorResponse("Failed to create blog", error.message)
    );
  }
};



// Update a blog with multilingual support
exports.updateBlog = async (req, res) => {
  try {
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      contentAr,
      contentEn,
      categories,
      author,
      seo,
      similarArticles,
      altText,
    } = req.body;

    const files = req.files || {};
    const categoriesArray = categories ? categories.split(",") : [];
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

    const mainImageFile = files.image?.[0];
    const blogImage = mainImageFile
      ? {
          url: `https://backend.abwabdigital.com/uploads/blogs/${mainImageFile.filename}`,
          altText: parseJSON(altText, { ar: "", en: "" })
        }
      : undefined;

    // ✅ Handle Sections
    const sectionArray = [];
    const sectionTitles = Object.entries(req.body).filter(([key]) =>
      key.startsWith("section[") && key.endsWith("]titleAr")
    );

    for (const [key, value] of sectionTitles) {
      const index = key.match(/\[(\d+)\]/)[1];
      const title = { ar: value, en: req.body[`section[${index}]titleEn`] || "" };
      const description = {
        ar: req.body[`section[${index}]descriptionAr`] || "",
        en: req.body[`section[${index}]descriptionEn`] || "",
      };
      const alt = parseJSON(req.body[`section[${index}]alt`], { ar: "", en: "" });
      const imageFile = files[`sectionImage[${index}]`]?.[0];

      sectionArray.push({
        title,
        description,
        image: {
          url: imageFile
            ? `https://backend.abwabdigital.com/uploads/blogs/${imageFile.filename}`
            : "",
          altText: alt,
        },
      });
    }

    // ✅ Handle Tags
    const tagArray = [];
    if (req.body.tagnameAr && req.body.tagnameEn) {
      const tagnameAr = Array.isArray(req.body.tagnameAr) ? req.body.tagnameAr : [req.body.tagnameAr];
      const tagnameEn = Array.isArray(req.body.tagnameEn) ? req.body.tagnameEn : [req.body.tagnameEn];

      tagnameAr.forEach((nameAr, index) => {
        const iconFile = files[`tagIcon[${index}]`]?.[0];

        tagArray.push({
          name: {
            ar: nameAr,
            en: tagnameEn[index] || "",
          },
          icon: iconFile
            ? `https://backend.abwabdigital.com/uploads/tags/${iconFile.filename}`
            : "",
        });
      });
    }

    // ✅ Update Blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        ...(titleAr && titleEn && { title: { ar: titleAr, en: titleEn } }),
        ...(descriptionAr && descriptionEn && { description: { ar: descriptionAr, en: descriptionEn } }),
        ...(contentAr && contentEn && { content: { ar: contentAr, en: contentEn } }),
        ...(categoriesArray && { categories: categoriesArray }),
        ...(author && { author }),
        ...(tagArray.length && { tags: tagArray }),
        ...(seoArray.length && { seo: seoArray }),
        ...(sectionArray.length && { section: sectionArray }),
        ...(similarArticlesArray.length && { similarArticles: similarArticlesArray }),
        ...(blogImage && { image: blogImage }),
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

   // await setCache(BLOG_SINGLE_KEY(req.params.id), JSON.stringify(updatedBlog));
    await deleteCache(BLOGS_ALL_KEY);

    return res.status(200).json(formatSuccessResponse(updatedBlog, "Blog updated successfully"));
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json(formatErrorResponse("Failed to update blog", error.message));
  }
};


// Get all blogs with full section details and images
exports.getAllBlogs = async (req, res) => {
  try {
    const language = req.query.language === "ar" ? "ar" : "en";

    const blogs = await Blog.find({}, "image section title description content author createdAt categories seo")
      .populate("similarArticles", "title image");

    const formattedBlogs = blogs.map((blog) => {
      const blogObj = blog.toObject();

      blogObj.title = blogObj.title?.[language] || "";
      blogObj.description = blogObj.description?.[language] || "";
      blogObj.content = blogObj.content?.[language] || "";

      blogObj.section = Array.isArray(blogObj.section)
        ? blogObj.section.map(sec => ({
            title: sec.title?.[language] || "",
            description: sec.description?.[language] || "",
            image: {
              url: sec.image?.url || "",
              altText: sec.image?.altText?.[language] || "No Image"
            }
          }))
        : [];

      blogObj.image = {
        url: blogObj.image?.url || "",
        altText: blogObj.image?.altText?.[language] || "No Image"
      };

      blogObj.seo = Array.isArray(blogObj.seo)
        ? blogObj.seo.find(seo => seo.language === language) || {}
        : {};

      blogObj.similarArticles = blogObj.similarArticles?.map(article => ({
        title: article.title?.[language] || "",
        url: article.url || "#",
        image: article.image || { url: "", altText: "No Image" }
      })) || [];

      return blogObj;
    });

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
    const language = req.query.language === "ar" ? "ar" : "en";
    const similarLimit = parseInt(req.query.limit) || 5;

    const blog = await Blog.findById(req.params.id).lean();

    if (!blog) {
      return res.status(404).json(formatErrorResponse("Blog not found"));
    }

    const sectionArray = Array.isArray(blog.section)
      ? blog.section.map(sec => ({
          title: sec.title?.[language] || "",
          description: sec.description?.[language] || "",
          image: {
            url: sec.image?.url || "",
            altText: sec.image?.altText?.[language] || "No Image"
          }
        }))
      : [];

    const seoData = Array.isArray(blog.seo)
      ? blog.seo.find(seo => seo.language === language) || {}
      : {};

    const similarArticles = await Blog.find({
      _id: { $ne: blog._id },
      categories: { $in: blog.categories },
    })
      .limit(similarLimit)
      .select("title image")
      .lean();

    const formattedBlog = {
      _id: blog._id,
      id: blog._id,
      title: blog.title?.[language] || "",
      description: blog.description?.[language] || "",
      content: blog.content?.[language] || "",
      section: sectionArray,
      categories: blog.categories || [],
      author: blog.author || "Unknown",
      image: {
        url: blog.image?.url || "",
        altText: blog.image?.altText?.[language] || "No Image"
      },
      publishedDate: blog.publishedAt || blog.createdAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      seo: seoData,
      similarArticles: similarArticles.map(article => ({
        id: article._id,
        title: article.title?.[language] || "",
        url: `https://backend.abwabdigital.com/blog/${article._id}`,
        image: article.image || { url: "", altText: "No Image" }
      })),
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
