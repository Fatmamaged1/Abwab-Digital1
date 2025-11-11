const { createService , getServicesBySlug , getServiceById , getAllServices , getAllServicesDataById , updateService} = require("../services/servicesServices");

exports.createService = async (req, res) => {
  try {
    const result = await createService(req, res);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createService controller:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: error.message
    });
  }
};

exports.getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = req.query.language || req.query.lang || "en";
    const result = await getServicesBySlug(slug, lang);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getServiceBySlug controller:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get service by slug",
      error: error.message
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.language || req.query.lang || "en";
    const result = await getServiceById(id, lang);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getServiceById controller:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get service by id",
      error: error.message
    });
  }
};

