const ExecutiveKPI = require('../../models/ceo/executiveKPIModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get executive dashboard summary
 * @route   GET /api/ceo/executive-kpi/dashboard
 * @access  Private (CEO, Executives)
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const summary = await ExecutiveKPI.getExecutiveSummary(targetDate);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching executive dashboard',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all executive KPIs
 * @route   GET /api/ceo/executive-kpi
 * @access  Private (CEO, Executives)
 */
exports.getAllKPIs = async (req, res) => {
  try {
    const { page = 1, limit = 30, period, startDate, endDate } = req.query;

    const query = {};
    if (period) query.period = period;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const kpis = await ExecutiveKPI.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await ExecutiveKPI.countDocuments(query);

    res.status(200).json({
      success: true,
      data: kpis,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KPIs',
      error: error.message,
    });
  }
};

/**
 * @desc    Get KPI by ID
 * @route   GET /api/ceo/executive-kpi/:id
 * @access  Private (CEO, Executives)
 */
exports.getKPIById = async (req, res) => {
  try {
    const kpi = await ExecutiveKPI.findById(req.params.id).populate(
      'calculatedBy',
      'name email'
    );

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found',
      });
    }

    res.status(200).json({
      success: true,
      data: kpi,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI',
      error: error.message,
    });
  }
};

/**
 * @desc    Create/Calculate executive KPI
 * @route   POST /api/ceo/executive-kpi/calculate
 * @access  Private (System/Admin)
 */
exports.calculateKPI = async (req, res) => {
  try {
    const { date, period } = req.body;

    // Check if KPI already exists
    const existing = await ExecutiveKPI.findOne({ date, period });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'KPI for this date and period already exists',
      });
    }

    // Here you would aggregate data from all other modules
    // This is a placeholder - actual implementation would fetch real data

    const kpiData = {
      date: date || new Date(),
      period: period || 'daily',
      financial: {
        revenue: {
          total: 0, // Fetch from accounting
          target: 0,
        },
        profit: {
          gross: 0,
          net: 0,
        },
        // ... other financial metrics
      },
      sales: {
        // Fetch from sales module
      },
      projects: {
        // Fetch from project management
      },
      hr: {
        // Fetch from HR module
      },
      marketing: {
        // Fetch from marketing module
      },
      software: {
        // Fetch from software module
      },
      calculatedBy: req.user._id,
    };

    const kpi = await ExecutiveKPI.create(kpiData);

    // Generate AI insights
    const aiInsights = await aiService.generateExecutiveSummary(kpi);
    if (aiInsights) {
      kpi.aiInsights = aiInsights;
      await kpi.save();
    }

    res.status(201).json({
      success: true,
      message: 'KPI calculated successfully',
      data: kpi,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error calculating KPI',
      error: error.message,
    });
  }
};

/**
 * @desc    Get KPI trends
 * @route   GET /api/ceo/executive-kpi/trends
 * @access  Private (CEO, Executives)
 */
exports.getKPITrends = async (req, res) => {
  try {
    const { period = 'monthly', limit = 12 } = req.query;

    const trends = await ExecutiveKPI.getKPITrends(period, parseInt(limit));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI trends',
      error: error.message,
    });
  }
};

/**
 * @desc    Get critical alerts
 * @route   GET /api/ceo/executive-kpi/alerts
 * @access  Private (CEO, Executives)
 */
exports.getCriticalAlerts = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const kpis = await ExecutiveKPI.find({
      date: { $gte: startDate },
    })
      .sort({ date: -1 })
      .select('date alerts healthScores');

    const allAlerts = kpis.flatMap((kpi) =>
      kpi.alerts.map((alert) => ({
        ...alert.toObject(),
        date: kpi.date,
        overallHealth: kpi.healthScores?.overall,
      }))
    );

    // Group alerts by type and severity
    const groupedAlerts = {
      critical: allAlerts.filter((a) => a.type === 'critical'),
      warning: allAlerts.filter((a) => a.type === 'warning'),
      info: allAlerts.filter((a) => a.type === 'info'),
      byCategory: allAlerts.reduce((acc, alert) => {
        if (!acc[alert.category]) acc[alert.category] = [];
        acc[alert.category].push(alert);
        return acc;
      }, {}),
    };

    res.status(200).json({
      success: true,
      data: groupedAlerts,
      summary: {
        total: allAlerts.length,
        critical: groupedAlerts.critical.length,
        warning: groupedAlerts.warning.length,
        info: groupedAlerts.info.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message,
    });
  }
};

/**
 * @desc    Get health scores overview
 * @route   GET /api/ceo/executive-kpi/health
 * @access  Private (CEO, Executives)
 */
exports.getHealthScores = async (req, res) => {
  try {
    const latestKPI = await ExecutiveKPI.findOne()
      .sort({ date: -1 })
      .select('healthScores date');

    if (!latestKPI) {
      return res.status(404).json({
        success: false,
        message: 'No KPI data available',
      });
    }

    // Get historical health scores for trend
    const historicalKPIs = await ExecutiveKPI.find()
      .sort({ date: -1 })
      .limit(30)
      .select('healthScores date');

    const healthTrend = historicalKPIs.map((kpi) => ({
      date: kpi.date,
      overall: kpi.healthScores?.overall,
      financial: kpi.healthScores?.financial,
      operational: kpi.healthScores?.operational,
      team: kpi.healthScores?.team,
      client: kpi.healthScores?.client,
    }));

    res.status(200).json({
      success: true,
      data: {
        current: latestKPI.healthScores,
        date: latestKPI.date,
        trend: healthTrend,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching health scores',
      error: error.message,
    });
  }
};

/**
 * @desc    Get financial overview
 * @route   GET /api/ceo/executive-kpi/financial
 * @access  Private (CEO, Executives)
 */
exports.getFinancialOverview = async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;

    const kpis = await ExecutiveKPI.find({ period })
      .sort({ date: -1 })
      .limit(parseInt(months))
      .select('date financial');

    const overview = {
      current: kpis[0]?.financial,
      history: kpis.map((kpi) => ({
        date: kpi.date,
        revenue: kpi.financial?.revenue?.total,
        profit: kpi.financial?.profit?.net,
        margin: kpi.financial?.profit?.margin,
        cashRunway: kpi.financial?.cashFlow?.runway,
      })),
      trends: {
        revenue: calculateTrend(kpis.map((k) => k.financial?.revenue?.total || 0)),
        profit: calculateTrend(kpis.map((k) => k.financial?.profit?.net || 0)),
      },
    };

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching financial overview',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate AI insights for KPI
 * @route   POST /api/ceo/executive-kpi/:id/generate-insights
 * @access  Private (CEO, Executives)
 */
exports.generateAIInsights = async (req, res) => {
  try {
    const kpi = await ExecutiveKPI.findById(req.params.id);

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found',
      });
    }

    const insights = await aiService.generateExecutiveSummary(kpi);

    kpi.aiInsights = insights;
    await kpi.save();

    res.status(200).json({
      success: true,
      message: 'AI insights generated successfully',
      data: insights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating AI insights',
      error: error.message,
    });
  }
};

/**
 * @desc    Export KPI report
 * @route   GET /api/ceo/executive-kpi/:id/export
 * @access  Private (CEO, Executives)
 */
exports.exportKPIReport = async (req, res) => {
  try {
    const kpi = await ExecutiveKPI.findById(req.params.id);

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found',
      });
    }

    // TODO: Implement PDF/Excel export
    res.status(200).json({
      success: true,
      message: 'Export functionality to be implemented',
      data: kpi,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting KPI',
      error: error.message,
    });
  }
};

// Helper function to calculate trend
function calculateTrend(values) {
  if (values.length < 2) return 'stable';

  const recent = values.slice(0, Math.ceil(values.length / 2));
  const older = values.slice(Math.ceil(values.length / 2));

  const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
  const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;

  if (recentAvg > olderAvg * 1.1) return 'increasing';
  if (recentAvg < olderAvg * 0.9) return 'decreasing';
  return 'stable';
}

module.exports = exports;
