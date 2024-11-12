// routes/homeRouter.js
const express = require('express');
const { createHome, getHomeData, updateHomeData } = require('../services/homeServices');

const router = express.Router();

// POST: Create homepage data
router.post('/', createHome);

// GET: Retrieve homepage data
router.get('/', getHomeData);

// PUT: Update homepage data
router.put('/', updateHomeData);

module.exports = router;
