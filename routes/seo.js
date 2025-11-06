const express = require('express');
const router = express.Router();
const { updateSeo, getSeo, getStructuredData } = require('../controllers/seoController');
const validateSeoData = require('../middleware/seoValidator');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/services/:id/seo', getSeo);
router.get('/services/:id/structured-data', getStructuredData);

// Protected routes (require authentication and admin role)
router.use(protect);

router.put('/services/:id/seo', validateSeoData, updateSeo);

module.exports = router;
