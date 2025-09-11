const express = require("express");
const router = express.Router();
const careerController = require("../services/careerServices");
const multer = require("multer");
const path = require("path");

// ==========================
// 🟢 إعداد Multer لرفع ملفات PDF
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/careers/"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname); // .pdf
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

// ✅ السماح فقط بملفات PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// دالة لمزيد من المرونة (عشان نقدر نحدد اسم الحقل)
const uploadFilePDF = (fieldName) => upload.single(fieldName);

// ============================
// 🔹 GET: جميع الوظائف مع فلاتر
// ============================
router.get("/", careerController.getAllCareers);

// 🔹 GET: وظيفة واحدة عبر ID أو Slug
router.get("/:idOrSlug", careerController.getCareerByIdOrSlug);

// 🔹 POST: إنشاء وظيفة جديدة
router.post("/", careerController.createCareer);

// 🔹 POST: تقديم طلب توظيف على وظيفة معينة
router.post(
  "/:id/apply",
  uploadFilePDF("resume"), // ⚠️ لازم الفورم يحتوي على الحقل resume
  careerController.applyToCareer
);

// 🔹 PUT: تحديث وظيفة
router.put("/:id", careerController.updateCareer);

// 🔹 DELETE: حذف وظيفة
router.delete("/:id", careerController.deleteCareer);

// 🔹 GET: جميع الطلبات
router.get("/:id/applications", careerController.getAllApplicationsByCarrerId);

module.exports = router;
