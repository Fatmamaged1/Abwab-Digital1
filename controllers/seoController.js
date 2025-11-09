const SeoService = require('../services/seoService');
const { validationResult } = require('express-validator');

/**
 * @route   PUT /api/services/:id/seo
 * @desc    Update SEO data for a service
 * @access  Private/Admin
 */
const updateSeo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id: serviceId } = req.params;
    const { seo } = req.body;

    if (!seo || !Array.isArray(seo)) {
      return res.status(400).json({
        success: false,
        message: 'SEO data is required and must be an array'
      });
    }

    const updatedService = await SeoService.updateServiceSeo(serviceId, seo);
    
    res.json({
      success: true,
      data: {
        seo: updatedService.seo
      }
    });
  } catch (error) {
    console.error('Error updating SEO:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SEO data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/services/:id/seo
 * @desc    Get SEO data for a service
 * @access  Public
 */
const getSeo = async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    const { language = 'en' } = req.query;

    const seo = await SeoService.getSeoForService(serviceId, language);
    
    if (!seo) {
      return res.status(404).json({
        success: false,
        message: 'No SEO data found for this service'
      });
    }

    res.json({
      success: true,
      data: seo
    });
  } catch (error) {
    console.error('Error fetching SEO:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SEO data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   GET /api/services/:id/structured-data
 * @desc    Get JSON-LD structured data for a service
 * @access  Public
 */
const getStructuredData = async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    const { language = 'en' } = req.query;

    const service = await Service.findById(serviceId).lean();
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const structuredData = SeoService.generateStructuredData(service, language);
    
    res.setHeader('Content-Type', 'application/ld+json');
    res.send(JSON.stringify(structuredData, null, 2));
  } catch (error) {
    console.error('Error generating structured data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating structured data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  updateSeo,
  getSeo,
  getStructuredData
};
