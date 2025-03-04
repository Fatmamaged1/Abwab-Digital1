const Home = require('../models/homeModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Helper function for JSON parsing with error handling
const parseJSON = (data, defaultValue = []) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("JSON Parsing Error:", error.message);
    return defaultValue;
  }
};

const mongoose = require("mongoose");

exports.createHome = async (req, res) => {
  try {
    let homeData = await Home.findOne();
    const isNew = !homeData;

    // Parse JSON fields safely
    const heroSection = parseJSON(req.body.heroSection, {});
    const seo = parseJSON(req.body.seo, []);
    let statistics = parseJSON(req.body.statistics, []);
    const availableDates = parseJSON(req.body.availableDates, []);
    let trustedPartners = parseJSON(req.body.trustedPartners, []);
    let whyChooseUs = parseJSON(req.body.whyChooseUs, []);
    const footer = parseJSON(req.body.footer, {});

    // 📌 Ensure `spinner` is always an array (fixes the issue)
    let spinner = parseJSON(req.body.spinner, []);
    if (!Array.isArray(spinner)) {
      spinner = [];
    }

    // Convert IDs to ObjectId
    const services = req.body.services ? new mongoose.Types.ObjectId(req.body.services) : null;
    const aboutSection = req.body.aboutSection ? new mongoose.Types.ObjectId(req.body.aboutSection) : null;
    const portfolio = req.body.portfolio ? new mongoose.Types.ObjectId(req.body.portfolio) : null;
    const blogSection = req.body.blogSection ? new mongoose.Types.ObjectId(req.body.blogSection) : null;
    const testimonials = req.body.testimonials ? new mongoose.Types.ObjectId(req.body.testimonials) : null;

    // Handle file uploads
    const heroImage = req.files?.heroImage?.[0]?.path || homeData?.heroSection?.heroImage || null;
    const backgroundImage = req.files?.backgroundImage?.[0]?.path || homeData?.backgroundImage || null;
    const uploadedWhyChooseUsIcons = req.files?.iconwhyChooseUs || [];
// ✅ Handle trustedPartners logos
trustedPartners = trustedPartners.map((partner, index) => ({
  ...partner,
  logo: req.files[`trustedPartners[${index}][logo]`]
    ? `uploads/${req.files[`trustedPartners[${index}][logo]`][0].filename}`
    : partner.logo ?? homeData?.trustedPartners?.[index]?.logo ?? null,
}));
    // Validate required fields
    if (!heroSection.title || !heroSection.description) {
      return res.status(400).json({ success: false, message: "Hero Section title and description are required." });
    }

    // Map uploaded whyChooseUs icons
    whyChooseUs = whyChooseUs.map((item, index) => ({
      ...item,
      icon: uploadedWhyChooseUsIcons[index] ? `/uploads/${uploadedWhyChooseUsIcons[index].filename}` : item.icon || null,
      BackgroundColor: item.BackgroundColor || "#ffffff",
    }));

    // Home update object
    const homeUpdate = {
      heroSection: {
        ...homeData?.heroSection,
        ...heroSection,
        heroImage,
        statistics,
      },
      spinner, // ✅ Always an array, even if missing or invalid
      availableDates,
      trustedPartners,
      whyChooseUs,
      footer,
      seo,
      backgroundImage,
      url: req.body.url || "/home",
      services,
      aboutSection,
      portfolio,
      blogSection,
      testimonials,
    };

    console.log("Final homeUpdate before saving:", JSON.stringify(homeUpdate, null, 2));

    if (isNew) {
      homeData = new Home(homeUpdate);
    } else {
      homeData.set(homeUpdate);
    }

    const savedHomeData = await homeData.save();
    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? "Homepage created successfully" : "Homepage updated successfully",
      data: savedHomeData,
    });

  } catch (error) {
    console.error("Error creating/updating homepage:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating/updating homepage data",
      error: error.message,
    });
  }
};


exports.getHomeData = async (req, res) => {
  try {
    console.log('Fetching home data...');
    const { language } = req.query;

    const homeData = await Home.findOne()
      .populate("blogSection", "section image categories")
      .populate("portfolio", "name description images category")
      .populate("testimonials")
      .populate("services", "category description")
      .populate("aboutSection","hero values")
      .lean();

    if (!homeData) {
      return res.status(404).json(formatErrorResponse("Homepage data not found"));
    }

    // Retrieve SEO data for requested language, fallback to first if not found.
    let seoData = homeData.seo.find((seo) => seo.language === language) || homeData.seo[0] || {};

    // Construct base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatImagePath = (imagePath) => {
      if (!imagePath) return null;
      const cleanedPath = imagePath.trim().replace(/\s+/g, "%20");
      return cleanedPath.startsWith("http") ? cleanedPath : `${baseUrl}/${cleanedPath.replace(/\\/g, "/")}`;
    };

    // Format heroSection image
    if (homeData.heroSection) {
      homeData.heroSection.heroImage = formatImagePath(homeData.heroSection.heroImage);
    }
    // Format aboutSection image
    if (homeData.aboutSection) {
      homeData.aboutSection.image = formatImagePath(homeData.aboutSection.image);
    }
    // Format trustedPartners logos
    homeData.trustedPartners = (homeData.trustedPartners || []).map((partner) => ({
      ...partner,
      logo: formatImagePath(partner.logo),
    }));

    // technologyStack is embedded, so return its full data
    const technologyStack = homeData.technologyStack || [];

    return res.json(
      formatSuccessResponse(
        { homeData, seo: seoData, technologyStack },
        "Homepage data retrieved successfully"
      )
    );
  } catch (error) {
    console.error('Error in getHomeData:', error.message);
    return res.status(500).json(formatErrorResponse("Error retrieving homepage data", error.message));
  }
};

