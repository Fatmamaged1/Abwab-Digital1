const express = require('express');
const homeController = require('../services/homeServices');
const upload = require('../middleware/upload');

const router = express.Router();

// Create Home data with image upload
router.post(
  '/home',
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutSectionImage', maxCount: 1 },
  ]),
  homeController.createHome
);

// Update Home data
router.put(
  '/home',
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutSectionImage', maxCount: 1 },
  ]),
  homeController.updateHomeData
);

// Get Home data
router.get('/home', async (req, res) => {
  try {
    const homeDataResponse = await homeController.getHomeData(req);

    if (!homeDataResponse || !homeDataResponse.data) {
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving homepage data',
      });
    }

    res.json({
      status: 'success',
      seo: homeDataResponse.data.seo,
      data: homeDataResponse.data.homeData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving homepage data',
      error: error.message,
    });
  }
});

module.exports = router;
