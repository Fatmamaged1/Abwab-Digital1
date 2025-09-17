// controllers/salesController.js
const Sales = require("../../models/sales/salesModel");

exports.createSales = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Parse JSON fields manually if sent as text
    const body = { ...req.body };
    if (body.documents && typeof body.documents === "string") {
      body.documents = JSON.parse(body.documents);
    }
    if (body.reminders && typeof body.reminders === "string") {
      body.reminders = JSON.parse(body.reminders);
    }
    if (body.emails && typeof body.emails === "string") {
      body.emails = JSON.parse(body.emails);
    }

    const sale = await Sales.create({ ...body, createdBy: req.user.id });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

  

exports.getSales = async (req, res) => {
  try {
    const sales = await Sales.find().populate("lead");
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
//get sales by lead
exports.getSalesByLead = async (req, res) => {
  try {
    const sales = await Sales.find({ lead: req.params.id }).populate("lead");
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }    
};
//get sales by id
exports.getSalesById = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).populate("lead");
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }    
};
//update sales by id
exports.updateSalesById = async (req, res) => {
  try {
    const sale = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }    
};  
//delete sales by id
exports.deleteSalesById = async (req, res) => {
  try {
    await Sales.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sales deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }    
};