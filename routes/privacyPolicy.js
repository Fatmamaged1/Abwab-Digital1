const express = require("express");
const router = express.Router();
const PrivacyPolicy = require("../models/PrivacyPolicy");

// Get the latest privacy policy
router.get("/", async (req, res) => {
    try {
        const policy = await PrivacyPolicy.findOne().sort({ createdAt: -1 });
        if (!policy) return res.status(404).json({
            success: false,
            message: "Privacy policy not found"
        });
        res.json({
            success: true,
            policy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
//Get all privacy policy
router.get("/all", async (req, res) => {
    try {
        const policies = await PrivacyPolicy.find();
        if (!policies) return res.status(404).json({
            success: false,
            message: "Privacy policy not found"
        });
        res.json({
            success: true,
            policies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Create or update privacy policy
router.post("/", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required"
        });
    }
    try {
        const policy = new PrivacyPolicy({ title, content });
        await policy.save();
        res.status(201).json({
            success: true,
            message: "Privacy policy created successfully",
            policy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// delete privacy policy
router.delete("/:id", async (req, res) => {
    try {
        const deletedPolicy = await PrivacyPolicy.findByIdAndDelete(req.params.id);
        if (!deletedPolicy) return res.status(404).json({
            success: false,
            message: "Privacy policy not found"
        });
        res.json({
            success: true,
            message: "Privacy policy deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// update privacy policy
router.put("/:id", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required"
        });
    }
    try {
        const updatedPolicy = await PrivacyPolicy.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        if (!updatedPolicy) return res.status(404).json({
            success: false,
            message: "Privacy policy not found"
        });
        res.json({
            success: true,
            message: "Privacy policy updated successfully",
            policy: updatedPolicy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
module.exports = router;
