const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Service = require("./models/servicesModel"); // عدّل حسب المسار عندك

async function fixServiceImages() {
  await mongoose.connect("mongodb+srv://fatmamelessawy:BBJVLziHn6B6p1MI@cluster0.kk9acoz.mongodb.net/?retryWrites=true&w=majority");

  const services = await Service.find();

  for (const service of services) {
    if (!service.image || !service.image.url) continue;

    const imageUrl = service.image.url;
    const fileName = path.basename(imageUrl);

    if (!fileName.includes(" ")) continue;

    const newFileName = fileName.replace(/\s+/g, "-");
    const oldPath = path.join(__dirname, "uploads", fileName); // مجلد uploads الرئيسي
    const newPath = path.join(__dirname, "uploads", newFileName);

    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ File renamed: ${fileName} → ${newFileName}`);
      } else {
        console.warn(`⚠️ File not found: ${fileName}`);
      }

      // تحديث MongoDB فقط لو فيه فرق
      const newUrl = imageUrl.replace(fileName, newFileName);
      service.image.url = newUrl;
      await service.save();
      console.log(`✅ MongoDB updated for service ID ${service._id}`);
    } catch (err) {
      console.error(`❌ Error processing ${fileName}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log("🎉 All done");
}

fixServiceImages();
