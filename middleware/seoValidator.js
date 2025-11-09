const { body, validationResult } = require('express-validator');

const validateSeoData = [
  // SEO array validation
  body('seo')
    .optional()
    .isArray()
    .withMessage('SEO must be an array')
    .custom((seoArray) => {
      if (!Array.isArray(seoArray)) return true;
      
      // Check for duplicate languages
      const languages = seoArray.map(item => item.language);
      if (new Set(languages).size !== languages.length) {
        throw new Error('Duplicate languages in SEO array');
      }
      
      return true;
    }),
    
  // Individual SEO item validation
  body('seo.*.language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be either "en" or "ar"'),
    
  body('seo.*.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 70 })
    .withMessage('Meta title cannot exceed 70 characters'),
    
  body('seo.*.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
    
  body('seo.*.keywords')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 keywords allowed'),
    
  body('seo.*.keywords.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Keyword cannot exceed 50 characters'),
    
  body('seo.*.canonicalUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),
    
  // Handle validation result
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = validateSeoData;
