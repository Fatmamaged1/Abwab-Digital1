const fs = require("fs");
const path = require("path");
const DocumentModel = require("../../models/sales/documentModel");
const LeadModel = require("../../models/sales/leadModel"); // ✅ حطيت الاستدعاء فوق

// ===================== Upload Document =====================
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const { lead, name, type, uploadedBy } = req.body;
    if (!lead || !name || !type || !uploadedBy) {
      return res.status(400).json({
        success: false,
        message: "lead, name, type, uploadedBy required",
      });
    }

    const doc = await DocumentModel.create({
      lead,
      name,
      type,
      url: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy,
      currentVersion: "1.0",
      versions: [
        {
          version: "1.0",
          url: req.file.path,
          uploadedBy,
          size: req.file.size,
        },
      ],
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Get Single Document =====================
exports.getDocument = async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id).lean();
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Get Documents By Lead =====================
exports.getDocsByLead = async (req, res) => {
  try {
    const docs = await DocumentModel.find({ lead: req.params.leadId })
      .sort("-createdAt")
      .lean();
    return res.json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Add New Version =====================
exports.addVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File required" });
    }

    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // increment version safely (e.g., 1.0 -> 2.0)
    const current = parseFloat(doc.currentVersion) || 1.0;
    const nextVersion = (current + 1).toFixed(1);

    const newVersion = {
      version: nextVersion,
      url: req.file.path,
      uploadedBy: req.body.uploadedBy,
      size: req.file.size,
    };

    doc.versions.push(newVersion);
    doc.currentVersion = newVersion.version;
    doc.url = req.file.path;
    doc.size = req.file.size;
    doc.updatedBy = req.body.uploadedBy;

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Track View =====================
exports.trackView = async (req, res) => {
  try {
    const { viewerId, viewTime } = req.body;
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    await doc.trackView(viewerId, Number(viewTime) || 0);

    // update lead's engagement
    const lead = await LeadModel.findById(doc.lead);
    if (lead) {
      lead.engagement.lastEngaged = new Date();
      lead.engagement.linkClicks = (lead.engagement.linkClicks || 0) + 1;
      await lead.save();
    }

    return res.json({ success: true, message: "View tracked" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Update Permissions =====================
exports.updatePermissions = async (req, res) => {
  try {
    const { canView, canEdit, isPublic } = req.body;
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    if (canView) doc.permissions.canView = canView;
    if (canEdit) doc.permissions.canEdit = canEdit;
    if (typeof isPublic === "boolean") doc.permissions.isPublic = isPublic;

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== Delete Document =====================
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // delete files (main + versions)
    [doc.url, ...doc.versions.map((v) => v.url)].forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await doc.deleteOne();
    return res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
