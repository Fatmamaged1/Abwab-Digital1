// controllers/salesController.js
const Sales = require("../../models/sales/salesModel");

exports.createSales = async (req, res) => {
  try {
    const sale = await Sales.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
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