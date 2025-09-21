const Lead = require('../../models/sales/leadModel');
const Activity = require('../../models/sales/activityModel');
const Sale = require('../../models/sales/salesModel'); // لو عندك صفقات مبيعات

// 📊 Generate Report
exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "Report type is required" });
    }

    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    let reportData = {};

    switch (type) {
      // ✅ Leads Report
      case "leads":
        reportData.total = await Lead.countDocuments(filter);
        reportData.byStatus = await Lead.aggregate([
          { $match: filter },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        reportData.byStage = await Lead.aggregate([
          { $match: filter },
          { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);
        break;

      // ✅ Sales Report
      case "sales":
        reportData.totalDeals = await Sale.countDocuments(filter);
        reportData.completedDeals = await Sale.countDocuments({ ...filter, status: "won" });
        reportData.revenue = await Sale.aggregate([
          { $match: { ...filter, status: "won" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        break;

      // ✅ Activities Report
      case "activities":
        reportData.total = await Activity.countDocuments(filter);
        reportData.byType = await Activity.aggregate([
          { $match: filter },
          { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
        reportData.byOutcome = await Activity.aggregate([
          { $match: filter },
          { $group: { _id: "$outcome", count: { $sum: 1 } } }
        ]);
        break;

      // ✅ Follow-ups Report
      case "followups":
        reportData.overdue = await Activity.countDocuments({
          ...filter,
          scheduledDate: { $lt: new Date() },
          isCompleted: false
        });
        reportData.upcoming = await Activity.countDocuments({
          ...filter,
          scheduledDate: { $gte: new Date() },
          isCompleted: false
        });
        break;

      default:
        return res.status(400).json({ success: false, message: "Invalid report type" });
    }

    return res.json({ success: true, type, data: reportData });

  } catch (error) {
    console.error("Generate Report Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
