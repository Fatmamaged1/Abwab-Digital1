const express = require('express');

const { getAllAbout, getAboutById, createOrUpdateAbout, deleteAboutById, updateAboutById } = require('../services/aboutServices');

const multer = require("multer");




// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/about");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });
const router = express.Router();

// Routes
router.get('/', getAllAbout); // Get all data
router.get('/:id', getAboutById); // Get data by ID
router.post('/', upload.single('image'), createOrUpdateAbout); // Create or update about page
router.put('/:id', upload.single('image'), updateAboutById); // Update data by ID
router.delete('/:id', deleteAboutById); // Delete data by ID

module.exports = router;
