const express = require("express");
const multer = require("multer");
const blogController = require("../services/blogServices");

const router = express.Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/blogs");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Define blog routes
router.post(
    "/",
    upload.fields([
      { name: "image", maxCount: 1 },          // صورة رئيسية
      { name: "sectionImage" },                // صور السكاشن
      { name: "tagIcons" },                    // أيقونات التاجات (إن وُجدت)
    ]),
    blogController.createBlog
  );
   router.put(
    "/blogs/:id",
    upload.fields([
      { name: "image", maxCount: 1 },          // صورة رئيسية
      { name: "sectionImage" },                // صور السكاشن
      { name: "tagIcons" },                    // أيقونات التاجات (إن وُجدت)
    ]),
    blogController.updateBlog
  );
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
//router.put("/:id", upload.single("image"), { name: "tagIcons", maxCount: 10 },blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);

module.exports = router;
