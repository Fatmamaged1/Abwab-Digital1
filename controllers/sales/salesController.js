// controllers/sales/salesController.js
const Sales = require("../../models/sales/SalesModel");

exports.createSales = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // تجهيز الـ documents من الملفات المرفوعة
    let documents = [];
    if (req.files && req.files.documents) {
      documents = req.files.documents.map(file => ({
        name: file.originalname,
        url: `${process.env.BASE_URL}/uploads/${file.filename}`
      }));
    }

    // إنشاء البيع
    const sale = await Sales.create({
      ...req.body,
      documents,
      createdBy: req.user.id
    });

    // تعديل الـ response بحيث يظهر فقط url في documents
    const responseData = sale.toObject();
    if (responseData.documents) {
      responseData.documents = responseData.documents.map(doc => doc.url);
    }

    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    console.error(err);
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