// controllers/salesController.js
const Sales = require("../../models/sales/salesModel");

exports.createSales = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    let { reminders, secondSteps, emails } = req.body;

    // نحاول نفك الترميزات إذا جت كنصوص
    if (typeof reminders === "string") {
      try {
        reminders = JSON.parse(reminders);
      } catch {
        reminders = [];
      }
    }

    if (typeof secondSteps === "string") {
      try {
        secondSteps = JSON.parse(secondSteps);
      } catch {
        secondSteps = [];
      }
    }

    if (typeof emails === "string") {
      try {
        emails = JSON.parse(emails);
      } catch {
        emails = [];
      }
    }

    // تجهيز الـ documents
    let documents = [];
    if (req.files && req.files.documents) {
      documents = req.files.documents.map(file => ({
        name: file.originalname,
        url: `${process.env.BASE_URL}/uploads/${file.filename}`
      }));
    }

    // إنشاء السيلز
    const sale = await Sales.create({
      ...req.body,
      reminders,
      secondSteps,
      emails,
      documents,
      createdBy: req.user.id,
    });

    // إظهار فقط url في documents
    const responseData = sale.toObject();
    responseData.documents = responseData.documents.map(doc => doc.url);

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