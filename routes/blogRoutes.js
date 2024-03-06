const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  createBlogValidator,
  getBlogValidator,
  updateBlogValidator,
  deleteBlogValidator,
} = require("../validator/blogValidator");
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
} = require("../services/blogServices");
const blogModel = require("../models/blogModel");

const router = express.Router();

// Set up multer to handle file uploads
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

router.route("/").post(
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "tags[0][icon]", maxCount: 10 }, // Adjust the field name and maxCount accordingly
  ]),
  (req, res, next) => {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    try {
      if (req.files) {
        console.log("File uploaded successfully:", JSON.stringify(req.files));

        req.body.image = req.files["image"][0].filename;

        if (
          req.files["tags[0][icon]"] &&
          req.files["tags[0][icon]"].length > 0
        ) {
          req.body.tags = req.body.tags || [];

          for (let i = 0; i < req.files["tags[0][icon]"].length; i++) {
            req.body.tags[i] = {
              name: req.files["tags[0][icon]"][i].originalname,
              icon: req.files["tags[0][icon]"][i].filename,
            };
          }
        }
      }

      // Continue with the middleware chain
      next();
    } catch (error) {
      console.error("Error processing files:", error);
      // Forward the error to the error handling middleware
      next(error);
    }
  },
  createBlogValidator,
  createBlog
);

router
  .route("/:id")
  .get(getBlogValidator, getBlog)
  .put(updateBlogValidator, updateBlog)
  .delete(deleteBlogValidator, deleteBlog);

// Get All Blogs
router.route("/").get(async (req, res, next) => {
  try {
    const blogs = await blogModel.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
