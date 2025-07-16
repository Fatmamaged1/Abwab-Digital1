const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Blog = require("./models/blogModel");

async function fixImageFiles() {
  await mongoose.connect("mongodb+srv://fatmamelessawy:BBJVLziHn6B6p1MI@cluster0.kk9acoz.mongodb.net/?retryWrites=true&w=majority");

  const blogs = await Blog.find();

  for (const blog of blogs) {
    if (!blog.image || typeof blog.image !== "string") continue;

    const imageUrl = blog.image;
    const filename = path.basename(imageUrl);

    if (!filename.includes(" ")) continue; // Skip if no space

    const cleanedFilename = filename.replace(/\s+/g, "-");
    const uploadDir = path.join(__dirname, "uploads/blogs");

    const oldPath = path.join(uploadDir, filename);
    const newPath = path.join(uploadDir, cleanedFilename);

    try {
      // Rename the file in the filesystem
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed file: ${filename} → ${cleanedFilename}`);

        // Update the image path in DB
        blog.image = imageUrl.replace(filename, cleanedFilename);
        await blog.save();
        console.log(`✅ Updated MongoDB for blog ID ${blog._id}`);
      } else {
        console.warn(`⚠️ File not found: ${oldPath}`);
      }
    } catch (err) {
      console.error(`❌ Failed to rename ${filename}:`, err.message);
    }
  }

  await mongoose.disconnect();
}

fixImageFiles();
