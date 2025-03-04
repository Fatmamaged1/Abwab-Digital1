const express = require('express');
const homeController = require('../services/homeServices');
const upload = require('../middleware/upload');

const router = express.Router();

// Create Home data with image upload
// ✅ Update router to handle `trustedPartners` logos
router.post(
  "/home",
  upload.fields([
    { name: "heroImage", maxCount: 1 },
    { name: "aboutSectionImage", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
    { name: "iconwhyChooseUs", maxCount: 8 },
    { name: "technologyStackIcons", maxCount: 8 },
    // ✅ Dynamically handle multiple `trustedPartners` logos
    { name: "trustedPartners[0][logo]", maxCount: 1 },
    { name: "trustedPartners[1][logo]", maxCount: 1 },
    { name: "trustedPartners[2][logo]", maxCount: 1 },
    { name: "trustedPartners[3][logo]", maxCount: 1 },
  ]),
  homeController.createHome
);

/*Update Home data
router.put(
  '/home',
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutSectionImage', maxCount: 1 },
  ]),
  homeController.updateHomeData
);*/

// Get Home data
router.get('/home', homeController.getHomeData);

module.exports = router;
