const express = require("express");
const path = require("path");
const multer = require("multer");
const { validationResult } = require("express-validator");
const ContactModel = require("../models/contactModel.js");
const { sendConfirmationEmail } = require("../utils/sendEmail");

const {
  getContactValidator,
  createContactValidator,
  updateContactValidator,
  deleteContactValidator,
} = require("../validator/contactValidator");

const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require("../services/contactServices");

const router = express.Router();

// 🟢 إعداد Multer لتحميل الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/contact/"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profileImage-" + uniqueSuffix + fileExtension);
  },
});

// ✅ فقط السماح بتحميل الصور
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// 🛑 ميدلوير لإدارة الأخطاء العامة
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: "error",
    errors: [{ field: "general", message: error.message }],
  });
});

// 🟢 إنشاء جهة اتصال جديدة مع تحميل الصورة
router.post("/", upload.single("profileImage"),  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "error", errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;
    if (!name ) {
      return res.status(400).json({  success: false, message: "name is required"  });

    }if (!email ) {
      return res.status(400).json({  success: false, message: "email is required"  });

    }if (!phone ) {
      return res.status(400).json({  success: false, message: "phone is required"  });

    }if (!message ) {
      return res.status(400).json({  success: false,  message: "message is required"  });

    }

    const profileImage = req.file ? req.file.filename : null;

    const newContact = await ContactModel.create({ name, email, phone, message, profileImage });

    // Send confirmation email asynchronously (don’t block response)
    sendConfirmationEmail(email, message).catch(err => console.error(err));
    res.status(201).json({ status: "success", data: newContact });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 🟢 جلب جميع جهات الاتصال
router.get("/", async (req, res) => {
  try {
    const contacts = await ContactModel.find();
    res.status(200).json({ status: "success", data: contacts });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 🟢 جلب جهة اتصال واحدة عبر ID
router.get("/:id", getContactValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "error", errors: errors.array() });
  }

  try {
    const contact = await ContactModel.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ status: "error", message: "Contact not found" });
    }
    res.status(200).json({ status: "success", data: contact });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 🟢 تحديث جهة اتصال عبر ID
router.put("/:id", upload.single("profileImage"), updateContactValidator, async (req, res) => {
  try {
    const updatedData = { ...req.body };
    if (req.file) updatedData.profileImage = req.file.filename;

    const updatedContact = await ContactModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updatedContact) {
      return res.status(404).json({ status: "error", message: "Contact not found" });
    }

    res.json({ status: "success", data: updatedContact });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// 🟢 حذف جهة اتصال عبر ID
router.delete("/:id", deleteContactValidator, async (req, res) => {
  try {
    const deletedContact = await ContactModel.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({ status: "error", message: "Contact not found" });
    }
    res.json({ status: "success", message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
