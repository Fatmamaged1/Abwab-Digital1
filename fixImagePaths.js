const mongoose = require("mongoose");
const Blog = require("./models/blogModel");
const Portfolio = require("./models/PortfolioModel");
const Service = require("./models/servicesModel");
const Testimonial = require("./models/testimonialModel");
const Home = require("./models/homeModel");
const Contact = require("./models/contactModel");

async function sanitizeField(field) {
  return typeof field === "string" ? field.replace(/\s+/g, "-") : field;
}

async function sanitizeArray(arr) {
  return Array.isArray(arr) ? arr.map(item => typeof item === "string" ? item.replace(/\s+/g, "-") : item) : arr;
}

async function fixImagePaths() {
  await mongoose.connect("mongodb+srv://fatmamelessawy:BBJVLziHn6B6p1MI@cluster0.kk9acoz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

  let updatedCount = 0;

  const models = [
    { name: "Blog", model: Blog },
    { name: "Portfolio", model: Portfolio },
    { name: "Service", model: Service },
    { name: "Testimonial", model: Testimonial },
    { name: "Home", model: Home },
    { name: "Contact", model: Contact }
  ];

  for (const { name, model } of models) {
    const records = await model.find();

    for (const record of records) {
      let updated = false;

      // ✅ Clean image string
      if (record.image) {
        const sanitized = await sanitizeField(record.image);
        if (sanitized !== record.image) {
          record.image = sanitized;
          updated = true;
        }
      }

      // ✅ Clean sectionImage array
      if (record.sectionImage) {
        const sanitizedArray = await sanitizeArray(record.sectionImage);
        if (JSON.stringify(sanitizedArray) !== JSON.stringify(record.sectionImage)) {
          record.sectionImage = sanitizedArray;
          updated = true;
        }
      }

      if (updated) {
        await record.save();
        updatedCount++;
        console.log(`✔ Updated ${name} - ID: ${record._id}`);
      }
    }
  }

  console.log(`\n✅ Done: Fixed ${updatedCount} document(s) across all collections.`);
  await mongoose.disconnect();
}

fixImagePaths().catch((err) => {
  console.error("❌ Error:", err);
});
