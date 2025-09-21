const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/sales/reportController');

// POST /api/v1/reports/generate
router.post('/generate', reportController.generateReport);

module.exports = router;
