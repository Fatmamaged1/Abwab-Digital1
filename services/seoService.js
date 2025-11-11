// services/seoService.js
const Service = require('../models/servicesModel');
const { createDefaultSeo } = require('../utils/reqParser');

class SeoService {
  /**
   * Process SEO data (array or single object)
   * @param {Array|Object} seoData - SEO data to process
   * @param {Object} defaultValues - Default values to use
   * @returns {Array} Array of processed SEO items
   */
  static processSeoData(seoData, defaultValues = {}) {
    if (!seoData) {
      return createDefaultSeo(
        defaultValues.metaTitle || 'Default Title',
        defaultValues.metaDescription || 'Default Description',
        defaultValues.image || ''
      );
    }

    // If seoData is already processed or has the required structure, return as is
    if (seoData.metaTitle && seoData.metaDescription) {
      return seoData;
    }

    // Process the SEO data with the provided defaults
    return {
      metaTitle: seoData.metaTitle || defaultValues.metaTitle || 'Default Title',
      metaDescription: seoData.metaDescription || defaultValues.metaDescription || 'Default Description',
      openGraph: {
        title: seoData.openGraph?.title || seoData.metaTitle || defaultValues.metaTitle || 'Default Title',
        description: seoData.openGraph?.description || seoData.metaDescription || defaultValues.metaDescription || 'Default Description',
        image: seoData.openGraph?.image || defaultValues.image || '',
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title: seoData.twitter?.title || seoData.metaTitle || defaultValues.metaTitle || 'Default Title',
        description: seoData.twitter?.description || seoData.metaDescription || defaultValues.metaDescription || 'Default Description',
        image: seoData.twitter?.image || defaultValues.image || ''
      }
    };
  }
}

module.exports = { processSeoData: SeoService.processSeoData };