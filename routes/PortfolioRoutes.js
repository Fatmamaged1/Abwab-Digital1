// routes/portfolioRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
//const upload = multer();
const portfolioController = require('../services/PorfolioServices');

// Set up storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/portfolio');
        cb(null, uploadPath); // Make sure this path exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
  
  // File filter to allow only images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only image files are allowed!', 400), false);
    }
  };
  
  // Multer instance
  const upload = multer({ storage, fileFilter });
  
// Route to create a portfolio item
// Example route using the controller
router.post('/', upload.single("image"), portfolioController.createPortfolioItem);

// Route to get all portfolio items
router.get('/', portfolioController.getAllPortfolioItems);

// Route to get a portfolio item by ID
router.get('/:id', portfolioController.getPortfolioItemById);

// Route to update a portfolio item
router.put('/:id', portfolioController.updatePortfolioItem);

// Route to delete a portfolio item
router.delete('/:id', portfolioController.deletePortfolioItem);

module.exports = router;
