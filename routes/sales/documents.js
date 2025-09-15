const express = require("express");
const routerDocs = express.Router();
const documentController = require("../../controllers/sales/documentController");
const multer = require("multer");
const fs = require("fs");

// ensure uploads dir exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// routes
routerDocs.post("/", upload.single("file"), documentController.uploadDocument);
routerDocs.get("/:id", documentController.getDocument);
routerDocs.get("/lead/:leadId", documentController.getDocsByLead);
routerDocs.post(
  "/:id/versions",
  upload.single("file"),
  documentController.addVersion
);
routerDocs.post("/:id/track-view", documentController.trackView);
routerDocs.put("/:id/permissions", documentController.updatePermissions);
routerDocs.delete("/:id", documentController.deleteDocument);

module.exports = routerDocs;
