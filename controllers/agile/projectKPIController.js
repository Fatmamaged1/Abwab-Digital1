const ProjectKPI = require('../../models/agile/projectKPIModel');
const AIService = require('../../services/aiService');

// @desc    Get KPIs for a project
// @route   GET /api/v1/agile/projects/:projectId/kpis
// @access  Private
exports.getProjectKPIs = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId })
      .populate('project', 'name budget startDate endDate');

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found for this project'
      });
    }

    res.status(200).json({
      success: true,
      data: kpi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KPIs',
      error: error.message
    });
  }
};

// @desc    Calculate and update KPIs
// @route   POST /api/v1/agile/projects/:projectId/kpis/calculate
// @access  Private
exports.calculateKPIs = async (req, res) => {
  try {
    const { metrics } = req.body;

    let kpi = await ProjectKPI.findOne({ project: req.params.projectId });

    if (!kpi) {
      kpi = new ProjectKPI({
        project: req.params.projectId,
        metrics: {}
      });
    }

    // Update metrics
    if (metrics) {
      kpi.metrics = { ...kpi.metrics, ...metrics };
    }

    // Calculate health score
    kpi.healthScore = kpi.calculateHealthScore();

    // Calculate trend
    kpi.trend = kpi.calculateTrend();

    // Save weekly snapshot
    kpi.weeklySnapshots.push({
      week: new Date().getWeek(),
      year: new Date().getFullYear(),
      metrics: { ...kpi.metrics },
      healthScore: kpi.healthScore,
      date: new Date()
    });

    // Keep only last 12 weeks
    if (kpi.weeklySnapshots.length > 12) {
      kpi.weeklySnapshots = kpi.weeklySnapshots.slice(-12);
    }

    kpi.calculatedAt = Date.now();
    await kpi.save();

    res.status(200).json({
      success: true,
      data: kpi,
      message: 'KPIs calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating KPIs',
      error: error.message
    });
  }
};

// @desc    Add KPI alert
// @route   POST /api/v1/agile/projects/:projectId/kpis/alerts
// @access  Private
exports.addKPIAlert = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId });

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    const alert = {
      type: req.body.type,
      severity: req.body.severity,
      message: req.body.message,
      metric: req.body.metric,
      threshold: req.body.threshold,
      actualValue: req.body.actualValue,
      resolved: false,
      timestamp: new Date()
    };

    kpi.alerts.push(alert);
    await kpi.save();

    res.status(200).json({
      success: true,
      data: kpi,
      message: 'Alert added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding alert',
      error: error.message
    });
  }
};

// @desc    Resolve KPI alert
// @route   PUT /api/v1/agile/projects/:projectId/kpis/alerts/:alertId/resolve
// @access  Private
exports.resolveKPIAlert = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId });

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    const alert = kpi.alerts.id(req.params.alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;

    await kpi.save();

    res.status(200).json({
      success: true,
      data: kpi,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
};

// @desc    Get KPI trends
// @route   GET /api/v1/agile/projects/:projectId/kpis/trends
// @access  Private
exports.getKPITrends = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId });

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    const trends = {
      healthScore: kpi.weeklySnapshots.map(s => ({
        week: s.week,
        year: s.year,
        value: s.healthScore,
        date: s.date
      })),
      budgetUtilization: kpi.weeklySnapshots.map(s => ({
        week: s.week,
        year: s.year,
        value: s.metrics.budgetUtilization,
        date: s.date
      })),
      scheduleVariance: kpi.weeklySnapshots.map(s => ({
        week: s.week,
        year: s.year,
        value: s.metrics.scheduleVariance,
        date: s.date
      })),
      trend: kpi.trend
    };

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI trends',
      error: error.message
    });
  }
};

// @desc    Get active alerts
// @route   GET /api/v1/agile/projects/:projectId/kpis/alerts/active
// @access  Private
exports.getActiveAlerts = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId });

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    const activeAlerts = kpi.alerts.filter(alert => !alert.resolved);

    // Sort by severity: critical > high > medium > low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    activeAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.status(200).json({
      success: true,
      data: {
        alerts: activeAlerts,
        count: activeAlerts.length,
        criticalCount: activeAlerts.filter(a => a.severity === 'critical').length,
        highCount: activeAlerts.filter(a => a.severity === 'high').length,
        mediumCount: activeAlerts.filter(a => a.severity === 'medium').length,
        lowCount: activeAlerts.filter(a => a.severity === 'low').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active alerts',
      error: error.message
    });
  }
};

// @desc    Get project health summary
// @route   GET /api/v1/agile/projects/:projectId/kpis/health
// @access  Private
exports.getProjectHealth = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOne({ project: req.params.projectId })
      .populate('project', 'name status');

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    const health = {
      score: kpi.healthScore,
      status: kpi.healthScore >= 80 ? 'healthy' : kpi.healthScore >= 60 ? 'warning' : 'critical',
      trend: kpi.trend,
      metrics: kpi.metrics,
      activeAlertsCount: kpi.alerts.filter(a => !a.resolved).length,
      criticalAlertsCount: kpi.alerts.filter(a => !a.resolved && a.severity === 'critical').length
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project health',
      error: error.message
    });
  }
};

// @desc    Delete KPIs
// @route   DELETE /api/v1/agile/projects/:projectId/kpis
// @access  Private
exports.deleteKPIs = async (req, res) => {
  try {
    const kpi = await ProjectKPI.findOneAndDelete({ project: req.params.projectId });

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPIs not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'KPIs deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting KPIs',
      error: error.message
    });
  }
};

// Helper to add week number to Date object
Date.prototype.getWeek = function() {
  const onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};
