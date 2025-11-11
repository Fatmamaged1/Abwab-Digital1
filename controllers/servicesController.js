const { createService } = require("../services/servicesServices");

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