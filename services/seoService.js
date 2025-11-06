const Service = require('../models/servicesModel');

class SeoService {
  /**
   * Update SEO data for a service
   * @param {string} serviceId - The ID of the service to update
   * @param {Array} seoData - Array of SEO objects
   * @returns {Promise<Object>} Updated service with SEO data
   */
  static async updateServiceSeo(serviceId, seoData) {
    if (!Array.isArray(seoData)) {
      throw new Error('SEO data must be an array');
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Update or add SEO entries
    seoData.forEach(newSeo => {
      const existingIndex = service.seo.findIndex(
        s => s.language === newSeo.language
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        service.seo.set(existingIndex, {
          ...service.seo[existingIndex].toObject(),
          ...newSeo,
          updatedAt: new Date()
        });
      } else {
        // Add new entry
        service.seo.push({
          ...newSeo,
          language: newSeo.language || 'en'
        });
      }
    });

    await service.save();
    return service;
  }

  /**
   * Get SEO data for a service by language
   * @param {string} serviceId - The ID of the service
   * @param {string} [language='en'] - Language code (en/ar)
   * @returns {Promise<Object|null>} SEO data or null if not found
   */
  static async getSeoForService(serviceId, language = 'en') {
    const service = await Service.findById(serviceId)
      .select('seo slug sections')
      .lean();

    if (!service) {
      throw new Error('Service not found');
    }

    // Find SEO for requested language or fallback to first available
    let seo = service.seo.find(s => s.language === language);
    if (!seo && service.seo.length > 0) {
      seo = service.seo[0];
    }

    // If no SEO data exists, return default structure
    if (!seo) {
      return {
        language: language,
        metaTitle: service.slug?.[language] || 'Service',
        metaDescription: service.sections?.[0]?.description?.[language] || '',
        robots: { noindex: false, nofollow: false }
      };
    }

    return seo;
  }

  /**
   * Generate JSON-LD structured data for a service
   * @param {Object} service - The service document
   * @param {string} [language='en'] - Language code
   * @returns {Object} JSON-LD structured data
   */
  static generateStructuredData(service, language = 'en') {
    const seo = service.seo?.find(s => s.language === language) || {};
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: seo.metaTitle || service.slug?.[language] || 'Service',
      description: seo.metaDescription || service.sections?.[0]?.description?.[language],
      url: `${baseUrl}/services/${service.slug?.[language] || service._id}`,
      ...(service.bannerImage?.url && {
        image: service.bannerImage.url,
        thumbnailUrl: service.bannerImage.url
      }),
      ...(seo.structuredData || {})
    };
  }
}

module.exports = SeoService;
