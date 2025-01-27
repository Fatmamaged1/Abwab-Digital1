const Home = require('../models/homeModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Controller to create initial homepage data
exports.createHome = async (req, res) => {
  try {
    console.log(req.body);
    // Check if a Home document already exists
    const existingHome = await Home.findOne();
    if (existingHome) {
      return res.status(400).json(formatErrorResponse("Homepage data already exists"));
    }

    // Handle image upload paths
    const heroImage = req.files?.heroImage?.[0]?.path;
    const aboutImage = req.files?.aboutSectionImage?.[0]?.path;

    // Parse JSON fields
    const seo = JSON.parse(req.body.seo || "[]"); // SEO for multiple languages
    const parsedStatistics = JSON.parse(req.body.statistics || "[]");
    const parsedTrustedPartners = JSON.parse(req.body.trustedPartners || "[]");
    const parsedValues = JSON.parse(req.body.values || "[]");
    const parsedAvailableDates = JSON.parse(req.body.availableDates || "[]");
    const parsedFooter = JSON.parse(req.body.footer || "{}");

    // Create a new Home document
    const homeData = new Home({
      heroSection: {
        ...req.body.heroSection,
        heroImage: heroImage || null,
        altText: req.body.heroAltText || "", // Alt text for hero image
      },
      aboutSection: {
        title: req.body.aboutTitle,
        description: req.body.aboutDescription,
        image: aboutImage || null,
        altText: req.body.aboutAltText || "", // Alt text for about section image
        values: parsedValues,
      },
      statistics: parsedStatistics,
      scheduleSection: {
        title: req.body.scheduleTitle,
        availableDates: parsedAvailableDates,
      },
      trustedPartners: parsedTrustedPartners,
      footer: parsedFooter,
      blogSection: req.body.blogSection || [],
      portfolio: req.body.portfolio || [],
      whyChooseUs: req.body.whyChooseUs || [],
      testimonials: req.body.testimonials || [],
      services: req.body.services || [],
      seo,
      url: req.body.url || "/home",
    });

    const savedHomeData = await homeData.save();
    return res.status(201).json(formatSuccessResponse(savedHomeData, "Homepage data created successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error creating homepage data", error.message));
  }
};

exports.updateHomeData = async (req, res) => {
  try {
    const homeData = await Home.findOne();
    if (!homeData) {
      return res.status(404).json(formatErrorResponse("Homepage data not found"));
    }

    // Parse JSON strings for fields
    const seo = req.body.seo ? JSON.parse(req.body.seo) : homeData.seo;
    const statistics = req.body.statistics ? JSON.parse(req.body.statistics) : homeData.statistics;
    const trustedPartners = req.body.trustedPartners ? JSON.parse(req.body.trustedPartners) : homeData.trustedPartners;

    // Handle image uploads
    const heroImage = req.files?.heroImage?.[0]?.path;
    const aboutImage = req.files?.aboutSectionImage?.[0]?.path;

    // Update the home data
    homeData.set({
      ...req.body,
      heroSection: {
        ...homeData.heroSection,
        ...req.body.heroSection,
        heroImage: heroImage || homeData.heroSection.heroImage,
        altText: req.body.heroAltText || homeData.heroSection.altText,
      },
      aboutSection: {
        ...homeData.aboutSection,
        ...req.body.aboutSection,
        image: aboutImage || homeData.aboutSection.image,
        altText: req.body.aboutAltText || homeData.aboutSection.altText,
      },
      statistics,
      trustedPartners,
      seo,
    });

    const savedData = await homeData.save();
    return res.json(formatSuccessResponse(savedData, "Homepage data updated successfully"));
  } catch (error) {
    return res.status(500).json(formatErrorResponse("Error updating homepage data", error.message));
  }
};

exports.getHomeData = async (req) => {
  try {
    console.log('Fetching home data...');
    const { language } = req.query; // Language query parameter (e.g., ?language=en)

    const homeData = await Home.findOne()
      .populate('blogSection')
      .populate('portfolio')
      .populate('testimonials')
      .populate('services');

    if (!homeData) {
      console.error('No home data found');
      throw new Error("Homepage data not found");
    }

    // Find language-specific SEO data
    const seoData = homeData.seo.find((seo) => seo.language === language);

    if (!seoData) {
      throw new Error(`SEO data not found for language: ${language}`);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatImagePath = (imagePath) =>
      imagePath?.startsWith('http') ? imagePath : `${baseUrl}/${imagePath?.replace(/\\/g, '/')}`;

    // Format image paths
    homeData.heroSection.heroImage = formatImagePath(homeData.heroSection.heroImage);
    homeData.aboutSection.image = formatImagePath(homeData.aboutSection.image);

    homeData.trustedPartners = homeData.trustedPartners.map((partner) => ({
      ...partner,
      logo: formatImagePath(partner.logo),
    }));

    return {
      success: true,
      message: "Homepage data retrieved successfully",
      data: {
        homeData,
        seo: seoData,
      },
    };
  } catch (error) {
    console.error('Error in getHomeData:', error.message || error);
    throw new Error(error.message || "Error retrieving homepage data");
  }
};
