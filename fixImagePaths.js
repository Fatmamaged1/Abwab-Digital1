const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Service = require("./models/servicesModel"); // عدل حسب مسارك

// الربط بقاعدة البيانات
mongoose.connect("mongodb+srv://fatmamelessawy:BBJVLziHn6B6p1MI@cluster0.kk9acoz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const baseDir = path.join(__dirname, "uploads", "services");

async function fixServiceImages() {
  const services = await Service.find();

  for (const service of services) {
    if (!service.image || !service.image.url) continue;

    const imageUrl = service.image.url;
    const fileName = path.basename(imageUrl);

    if (!fileName.includes(" ")) continue;

    const newFileName = fileName.replace(/\s+/g, "-");
    const oldPath = path.join(baseDir, fileName);
    const newPath = path.join(baseDir, newFileName);

    try {
      // إعادة التسمية في السيرفر
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ File renamed: ${fileName} → ${newFileName}`);
      } else {
        console.warn(`⚠️ File not found on disk: ${fileName}`);
      }

      // تحديث الرابط في MongoDB
      const newUrl = imageUrl.replace(fileName, newFileName);
      service.image.url = newUrl;
      await service.save();
      console.log(`✅ Mongo updated for service ID ${service._id}`);
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
    }
  }

  console.log("🎉 Done fixing service images.");
  mongoose.disconnect();
}

fixServiceImages();
