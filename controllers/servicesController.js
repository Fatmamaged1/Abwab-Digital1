const { createService , getServicesBySlug , getServiceById , getAllServices , updateService} = require("../services/servicesServices");

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

exports.getAllServices = async (req, res) => {
  try {
    const lang = req.query.language || req.query.lang || "en";
    const result = await getAllServices(lang);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Services not found",
      });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllServices controller:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get all services",
      error: error.message
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.language || req.query.lang || "en";
    
    // Prepare update data
    let updateData = { ...req.body };
    
    // If there are files, add them to updateData
    if (req.files) {
      updateData.files = req.files;
    }

    // If header is a string (happens with form-data), parse it
    if (typeof updateData.header === 'string') {
      try {
        updateData.header = JSON.parse(updateData.header);
      } catch (e) {
        console.error('Error parsing header:', e);
        return res.status(400).json({
          success: false,
          message: "Invalid header format. Must be valid JSON"
        });
      }
    }

    const result = await updateService(id, updateData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in updateService controller:', error);
    const statusCode = error.message === "Service not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update service",
      error: error.message
    });
  }
};

