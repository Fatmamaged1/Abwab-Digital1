const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const portfolioController = require("../services/PorfolioServices");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/portfolio"); // Save files to 'uploads/portfolio'
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Route for creating and updating portfolio with multiple images
router.post('/', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'designScreens.web', maxCount: 10 },
    { name: 'designScreens.app', maxCount: 10 }
]), portfolioController.createPortfolioItem);

router.put('/:id', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'designScreens.web', maxCount: 10 },
    { name: 'designScreens.app', maxCount: 10 }
]), portfolioController.updatePortfolioItem);

// Other CRUD routes
router.get("/", portfolioController.getAllPortfolioItems);
router.get("/:id", portfolioController.getPortfolioItemById);
router.delete("/:id", portfolioController.deletePortfolioItem);

module.exports = router;
