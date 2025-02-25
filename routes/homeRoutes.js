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
    { name: 'backgroundImage', maxCount: 1 },
    { name: 'iconwhyChooseUs', maxCount: 8},
    {  name:'technologyStackIcons',maxCount:8
    },
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
