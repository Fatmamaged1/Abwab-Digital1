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

// Controller to create or update homepage data
exports.createHome = async (req, res) => {
  try {
      console.log("Received Body:", req.body);

      let homeData = await Home.findOne();
      const isNew = !homeData;

      // Parse JSON fields
      const heroSection = parseJSON(req.body.heroSection, {});
      const seo = parseJSON(req.body.seo, []);
      let statistics = [];

      if (req.body.statistics) {
          try {
              statistics = typeof req.body.statistics === "string"
                  ? JSON.parse(req.body.statistics)
                  : req.body.statistics;
              console.log("Parsed statistics:", statistics);
          } catch (error) {
              console.error("❌ Error parsing statistics:", error);
              return res.status(400).json({ error: "Invalid JSON format in statistics" });
          }
      }

      const availableDates = parseJSON(req.body.availableDates, []);
      const trustedPartners = parseJSON(req.body.trustedPartners, []);
      const whyChooseUs = parseJSON(req.body.whyChooseUs, []);
      const footer = parseJSON(req.body.footer, {});

      // Convert IDs to ObjectId
      const services = req.body.services ? new mongoose.Types.ObjectId(req.body.services) : null;
      const aboutSection = req.body.aboutSection ? new mongoose.Types.ObjectId(req.body.aboutSection) : null;
      const portfolio = req.body.portfolio ? new mongoose.Types.ObjectId(req.body.portfolio) : null;
      const blogSection = req.body.blogSection ? new mongoose.Types.ObjectId(req.body.blogSection) : null;
      const testimonials = req.body.testimonials ? new mongoose.Types.ObjectId(req.body.testimonials) : null;

      // Handle file uploads
      const heroImage = req.files?.heroImage?.[0]?.path || homeData?.heroSection?.heroImage || null;
      const aboutImage = req.files?.aboutImage?.[0]?.path || homeData?.aboutSection?.image || null;
      const backgroundImage = req.files?.backgroundImage?.[0]?.path || homeData?.backgroundImage || null;

      // Validate required fields
      if (!heroSection.title || !heroSection.description) {
          return res.status(400).json({ success: false, message: "Hero Section title and description are required." });
      }

      // Home update object
      const homeUpdate = {
          heroSection: {
              ...homeData?.heroSection,
              ...heroSection,
              heroImage,
              statistics, // ✅ Fix: Statistics inside heroSection
          },
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

      console.log("Final homeUpdate before saving:", JSON.stringify(homeUpdate, null, 2)); // Debug log

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
    .populate("blogSection", "section image categories") // Fetch all related blogs
    .populate("portfolio", "title description image category") // Fetch all portfolios
    .populate("testimonials") // Fetch all testimonials
    .populate("services", "title description") // Fetch all services
    .populate("aboutSection"); // Fetch all about sections
  
    if (!homeData) {
      return res.status(404).json(formatErrorResponse("Homepage data not found"));
    }

    // Find SEO data for the requested language, fallback to default if not found
    let seoData = homeData.seo.find((seo) => seo.language === language) || homeData.seo[0] || {};

    // Construct base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Function to clean and format image paths
    const formatImagePath = (imagePath) => {
      if (!imagePath) return null;

      // Trim spaces & replace spaces with "%20" for valid URLs
      const cleanedPath = imagePath.trim().replace(/\s+/g, "%20");

      return cleanedPath.startsWith("http") ? cleanedPath : `${baseUrl}/${cleanedPath.replace(/\\/g, "/")}`;
    };

    // Ensure heroSection images are formatted properly
    if (homeData.heroSection) {
      homeData.heroSection.heroImage = formatImagePath(homeData.heroSection.heroImage);
    }

    // Ensure aboutSection images are formatted properly
    if (homeData.aboutSection) {
      homeData.aboutSection.image = formatImagePath(homeData.aboutSection.image);
    }

    // Format trustedPartners images
    homeData.trustedPartners = (homeData.trustedPartners || []).map((partner) => ({
      ...partner,
      logo: formatImagePath(partner.logo),
    }));

    return res.json(formatSuccessResponse({ homeData, seo: seoData }, "Homepage data retrieved successfully"));

  } catch (error) {
    console.error('Error in getHomeData:', error.message);
    return res.status(500).json(formatErrorResponse("Error retrieving homepage data", error.message));
  }
};
