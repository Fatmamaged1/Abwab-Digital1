const TermsAndConditions = require("../models/TermsAndConditions");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// Get latest terms & conditions
router.get("/", async (req, res) => {
    try {
        const terms = await TermsAndConditions.findOne().sort({ createdAt: -1 });
        if (!terms) return res.status(404).json({ success: false, message: "Terms and conditions not found" });
        res.json({ success: true, terms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all terms & conditions
router.get("/all", async (req, res) => {
    try {
        const terms = await TermsAndConditions.find().sort({ createdAt: -1 });
        if (!terms.length) return res.status(404).json({ success: false, message: "No terms found" });
        res.json({ success: true, terms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new terms & conditions
router.post("/", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content are required" });
    }
    try {
        const terms = new TermsAndConditions({ title, content });
        await terms.save();
        res.status(201).json({ success: true, terms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update specific terms & conditions by ID
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content are required" });
    }

    try {
        const updated = await TermsAndConditions.findByIdAndUpdate(id, { title, content }, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Terms not found" });
        }
        res.json({ success: true, terms: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete terms & conditions by ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    try {
        const deleted = await TermsAndConditions.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Terms not found" });
        }
        res.json({ success: true, message: "Terms deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
