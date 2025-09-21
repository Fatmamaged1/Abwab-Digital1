// controllers/sales/analyticsController.js
const Lead = require('../../models/sales/leadModel');
const Activity = require('../../models/sales/activityModel');
const Sale = require('../../models/sales/SaleModel'); // لو عندك

// Analytics Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { period = "monthly", rep, region, type } = req.query;

    // 🔹 تصفية الفترة الزمنية
    let dateFilter = {};
    const now = new Date();
    if (period === "daily") {
      dateFilter = { $gte: new Date(now.setHours(0,0,0,0)) };
    } else if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { $gte: weekAgo };
    } else if (period === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { $gte: monthAgo };
    }

    // 🔹 المؤشرات الرئيسية
    const totalLeads = await Lead.countDocuments({ createdAt: dateFilter });
    const convertedLeads = await Lead.countDocuments({ status: "converted", createdAt: dateFilter });
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const avgStageDuration = await Lead.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: "$stage", avgDuration: { $avg: "$stageDuration" } } }
    ]);

    const totalActivities = await Activity.countDocuments({ createdAt: dateFilter });
    const successfulActivities = await Activity.countDocuments({ outcome: "success", createdAt: dateFilter });
    const activityEffectiveness = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;

    const revenueForecast = await Sale.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: null, forecast: { $sum: "$expectedRevenue" } } }
    ]);

    const engagementRate = await Activity.countDocuments({ outcome: "document_viewed", createdAt: dateFilter });

    return res.json({
      success: true,
      data: {
        conversionRate,
        avgStageDuration,
        activityEffectiveness,
        revenueForecast: revenueForecast[0]?.forecast || 0,
        engagementRate
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
