// routes/sales/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/sales/analyticsController');

router.get('/dashboard', analyticsController.getDashboard);

module.exports = router;
