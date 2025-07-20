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
      const originalName = file.originalname.replace(/\s+/g, "-"); // Replace spaces with dashes
      cb(null, `${uniqueSuffix}-${originalName}`);
    }
});
const upload = multer({ storage });

// Define blog routes
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },          // Main image
    { name: "sectionImage[0]" }, 
    { name: "sectionImage[1]" },  
    { name: "sectionImage[2]" }, 
    { name: "sectionImage[3]" },               // Section images
    { name: "tagIcons[0]" },                 // Tag icon 1 (indexed field)
    { name: "tagIcons[1]" },  
    {name:"tagIcons[2]"}, 
    {name:"tagIcons[3]"}              // Tag icon 2 (indexed field)
    // Add more if needed
  ]),
  blogController.createBlog
);

   router.put(
    "/blogs/:id",
    upload.fields([
      { name: "image", maxCount: 1 },          // Main image
      { name: "sectionImage[0]" }, 
      { name: "sectionImage[1]" },  
      { name: "sectionImage[2]" }, 
      { name: "sectionImage[3]" },               // Section images
      { name: "tagIcons[0]" },                 // Tag icon 1 (indexed field)
      { name: "tagIcons[1]" },  
      {name:"tagIcons[2]"}, 
      {name:"tagIcons[3]"} 
    ]),
    blogController.updateBlog
  );
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.get("/all/:id", blogController.getAllBlogDataById);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.delete("/:id", blogController.deleteBlog);

module.exports = router;
