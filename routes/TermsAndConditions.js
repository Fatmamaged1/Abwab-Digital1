const TermsAndConditions = require("../models/TermsAndConditions");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();


// Get latest terms & conditions
router.get("/", async (req, res) => {
    try {
        const terms = await TermsAndConditions.findOne().sort({ createdAt: -1 });
        if (!terms) return res.status(404).json({ success: false, message: "Terms and conditions not found" });
        res.json({
            success: true,
            terms
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
//Get all terms & conditions
router.get("/all", async (req, res) => {
    try {
        const terms = await TermsAndConditions.find();
        if (!terms) return res.status(404).json({
            success: false,
            message: "Terms and conditions not found"
        });
        res.json({
            success: true,
            terms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create or update terms & conditions
router.post("/", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required"
        });
    }
    try {
        const terms = new TermsAndConditions({ title, content });
        await terms.save();
        res.status(201).json({
            success: true,
            terms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
