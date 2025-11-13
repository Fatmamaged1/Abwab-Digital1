const PredictiveAnalytics = require('../../models/ceo/predictiveAnalyticsModel');
const AIService = require('../../services/aiService');

// @desc    Get all predictions
// @route   GET /api/v1/ceo/predictive-analytics
// @access  Private (CEO/Executive)
exports.getAllPredictions = async (req, res) => {
  try {
    const { category, metric, confidenceLevel, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (metric) query.metric = metric;
    if (confidenceLevel) query.confidenceLevel = confidenceLevel;

    const predictions = await PredictiveAnalytics.find(query)
      .populate('generatedBy', 'name email')
      .sort({ predictionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PredictiveAnalytics.countDocuments(query);

    res.status(200).json({
      success: true,
      data: predictions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions',
      error: error.message
    });
  }
};

// @desc    Get single prediction
// @route   GET /api/v1/ceo/predictive-analytics/:id
// @access  Private (CEO/Executive)
exports.getPrediction = async (req, res) => {
  try {
    const prediction = await PredictiveAnalytics.findById(req.params.id)
      .populate('generatedBy', 'name email avatar');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prediction',
      error: error.message
    });
  }
};

// @desc    Generate revenue prediction
// @route   POST /api/v1/ceo/predictive-analytics/revenue
// @access  Private (CEO/Executive)
exports.generateRevenuePrediction = async (req, res) => {
  try {
    const { timeframe = 'quarterly', periods = 4 } = req.body;

    // Get historical revenue data
    const Invoice = require('../../models/accounting/invoiceModel');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Last 12 months

    const historicalInvoices = await Invoice.find({
      createdAt: { $gte: startDate },
      status: 'paid'
    });

    // Aggregate by month
    const monthlyRevenue = {};
    historicalInvoices.forEach(invoice => {
      const month = invoice.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + invoice.total;
    });

    const historicalData = Object.entries(monthlyRevenue).map(([period, value]) => ({
      period,
      value
    }));

    // Use AI to predict future revenue
    const aiService = new AIService();
    const aiPrediction = await aiService.predictRevenue({
      historicalData,
      timeframe,
      periods
    });

    if (!aiPrediction) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate revenue prediction'
      });
    }

    // Create prediction record
    const prediction = await PredictiveAnalytics.create({
      category: 'revenue',
      metric: 'total_revenue',
      predictionDate: new Date(),
      timeframe,
      historicalData,
      predictions: aiPrediction.predictions || [],
      confidenceLevel: aiPrediction.confidence || 'medium',
      methodology: 'AI-based time series analysis with historical trends',
      factors: aiPrediction.factors || [
        'Historical revenue trends',
        'Seasonal patterns',
        'Growth rate',
        'Market conditions'
      ],
      accuracy: {
        expectedRange: aiPrediction.expectedRange || { min: 0, max: 0 },
        confidence: aiPrediction.confidenceScore || 75
      },
      recommendations: aiPrediction.recommendations || [],
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: prediction,
      message: 'Revenue prediction generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating revenue prediction',
      error: error.message
    });
  }
};

// @desc    Generate project success prediction
// @route   POST /api/v1/ceo/predictive-analytics/project-success
// @access  Private (CEO/Executive)
exports.generateProjectSuccessPrediction = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Get project data
    const Project = require('../../models/agile/projectModel');
    const project = await Project.findById(projectId)
      .populate('tasks')
      .populate('team');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project KPIs
    const ProjectKPI = require('../../models/agile/projectKPIModel');
    const kpis = await ProjectKPI.find({ project: projectId })
      .sort({ date: -1 })
      .limit(10);

    // Prepare project data for AI analysis
    const projectData = {
      name: project.name,
      status: project.status,
      budget: project.budget,
      actualCost: project.actualCost,
      progress: project.progress,
      timeline: {
        startDate: project.startDate,
        endDate: project.endDate,
        currentDate: new Date()
      },
      team: {
        size: project.team.length,
        roles: project.team.map(t => t.role)
      },
      kpis: kpis.map(kpi => ({
        date: kpi.date,
        healthScore: kpi.healthScore,
        metrics: kpi.metrics
      }))
    };

    // Use AI to predict project success
    const aiService = new AIService();
    const aiPrediction = await aiService.predictProjectSuccess(projectData);

    if (!aiPrediction) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate project success prediction'
      });
    }

    // Create prediction record
    const prediction = await PredictiveAnalytics.create({
      category: 'project_success',
      metric: 'completion_probability',
      predictionDate: new Date(),
      timeframe: 'project_lifecycle',
      predictions: [
        {
          period: 'current',
          value: aiPrediction.successProbability || 0,
          confidence: aiPrediction.confidence || 'medium'
        }
      ],
      confidenceLevel: aiPrediction.confidence || 'medium',
      methodology: 'AI-based project health analysis',
      factors: aiPrediction.riskFactors || [
        'Budget utilization',
        'Timeline adherence',
        'Team performance',
        'Historical KPI trends'
      ],
      accuracy: {
        expectedRange: {
          min: (aiPrediction.successProbability || 0) - 15,
          max: (aiPrediction.successProbability || 0) + 15
        },
        confidence: aiPrediction.confidenceScore || 70
      },
      recommendations: aiPrediction.recommendations || [],
      relatedEntities: [{ model: 'Project', id: projectId }],
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: prediction,
      message: 'Project success prediction generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating project success prediction',
      error: error.message
    });
  }
};

// @desc    Generate churn prediction
// @route   POST /api/v1/ceo/predictive-analytics/churn
// @access  Private (CEO/Executive)
exports.generateChurnPrediction = async (req, res) => {
  try {
    // Get client engagement data
    const Client = require('../../models/sales/clientModel');
    const clients = await Client.find({ status: 'active' });

    const churnRisks = [];

    for (const client of clients) {
      // Calculate engagement metrics
      const daysSinceLastInteraction = client.lastInteraction
        ? Math.floor((new Date() - new Date(client.lastInteraction)) / (1000 * 60 * 60 * 24))
        : 999;

      const contractDaysRemaining = client.contractEndDate
        ? Math.floor((new Date(client.contractEndDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 999;

      const avgProjectValue = client.totalRevenue / (client.projectsCompleted || 1);

      // Simple churn risk calculation (can be enhanced with AI)
      let churnRisk = 'low';
      let churnProbability = 0;

      if (daysSinceLastInteraction > 90 || contractDaysRemaining < 30) {
        churnRisk = 'high';
        churnProbability = 75;
      } else if (daysSinceLastInteraction > 60 || contractDaysRemaining < 60) {
        churnRisk = 'medium';
        churnProbability = 45;
      } else {
        churnRisk = 'low';
        churnProbability = 15;
      }

      churnRisks.push({
        client: client._id,
        clientName: client.name,
        churnRisk,
        churnProbability,
        factors: {
          daysSinceLastInteraction,
          contractDaysRemaining,
          avgProjectValue,
          satisfaction: client.satisfactionScore || 0
        }
      });
    }

    // Sort by highest risk
    churnRisks.sort((a, b) => b.churnProbability - a.churnProbability);

    // Use AI to enhance predictions
    const aiService = new AIService();
    const aiPrediction = await aiService.predictChurn({
      clients: churnRisks.slice(0, 20) // Top 20 at-risk clients
    });

    // Create prediction record
    const prediction = await PredictiveAnalytics.create({
      category: 'churn',
      metric: 'client_retention',
      predictionDate: new Date(),
      timeframe: 'monthly',
      predictions: [
        {
          period: 'next_30_days',
          value: churnRisks.filter(c => c.churnRisk === 'high').length,
          confidence: 'medium'
        }
      ],
      confidenceLevel: aiPrediction?.confidence || 'medium',
      methodology: 'Engagement-based churn risk analysis with AI enhancement',
      factors: [
        'Days since last interaction',
        'Contract expiration proximity',
        'Project value trends',
        'Client satisfaction scores'
      ],
      accuracy: {
        expectedRange: { min: 0, max: churnRisks.length },
        confidence: 70
      },
      recommendations: aiPrediction?.recommendations || [
        'Re-engage high-risk clients with personalized outreach',
        'Offer contract renewal incentives',
        'Schedule quarterly business reviews'
      ],
      metadata: {
        totalClientsAnalyzed: clients.length,
        highRisk: churnRisks.filter(c => c.churnRisk === 'high').length,
        mediumRisk: churnRisks.filter(c => c.churnRisk === 'medium').length,
        lowRisk: churnRisks.filter(c => c.churnRisk === 'low').length
      },
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: {
        prediction,
        churnRisks: churnRisks.slice(0, 20) // Top 20
      },
      message: 'Churn prediction generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating churn prediction',
      error: error.message
    });
  }
};

// @desc    Generate resource utilization prediction
// @route   POST /api/v1/ceo/predictive-analytics/resource-utilization
// @access  Private (CEO/Executive)
exports.generateResourcePrediction = async (req, res) => {
  try {
    const { timeframe = 'monthly', periods = 3 } = req.body;

    // Get current resource utilization
    const CapacityPlanner = require('../../models/hr/capacityPlannerModel');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

    const historicalCapacity = await CapacityPlanner.find({
      'period.startDate': { $gte: startDate }
    }).sort({ 'period.startDate': 1 });

    const historicalData = historicalCapacity.map(cap => ({
      period: cap.period.startDate.toISOString().substring(0, 7),
      value: cap.utilization
    }));

    // Use AI to predict future utilization
    const aiService = new AIService();
    const aiPrediction = await aiService.predictResourceUtilization({
      historicalData,
      timeframe,
      periods
    });

    const prediction = await PredictiveAnalytics.create({
      category: 'resources',
      metric: 'utilization_rate',
      predictionDate: new Date(),
      timeframe,
      historicalData,
      predictions: aiPrediction?.predictions || [],
      confidenceLevel: aiPrediction?.confidence || 'medium',
      methodology: 'Historical capacity analysis with trend projection',
      factors: [
        'Historical utilization trends',
        'Project pipeline',
        'Team size changes',
        'Seasonal variations'
      ],
      accuracy: {
        expectedRange: aiPrediction?.expectedRange || { min: 0, max: 100 },
        confidence: aiPrediction?.confidenceScore || 70
      },
      recommendations: aiPrediction?.recommendations || [],
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: prediction,
      message: 'Resource utilization prediction generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating resource prediction',
      error: error.message
    });
  }
};

// @desc    Update prediction with actual data
// @route   PUT /api/v1/ceo/predictive-analytics/:id/actual
// @access  Private (CEO/Executive)
exports.updateActualData = async (req, res) => {
  try {
    const prediction = await PredictiveAnalytics.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    const { period, actualValue } = req.body;

    if (!period || actualValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Period and actual value are required'
      });
    }

    // Find the prediction for this period
    const predictionIndex = prediction.predictions.findIndex(
      p => p.period === period
    );

    if (predictionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prediction for this period not found'
      });
    }

    // Update with actual data
    prediction.predictions[predictionIndex].actualValue = actualValue;

    // Calculate accuracy
    const predictedValue = prediction.predictions[predictionIndex].value;
    const variance = Math.abs(predictedValue - actualValue);
    const accuracy = Math.max(0, 100 - (variance / predictedValue) * 100);

    prediction.predictions[predictionIndex].accuracy = accuracy;

    await prediction.save();

    res.status(200).json({
      success: true,
      data: prediction,
      message: 'Actual data updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating actual data',
      error: error.message
    });
  }
};

// @desc    Get prediction accuracy report
// @route   GET /api/v1/ceo/predictive-analytics/accuracy-report
// @access  Private (CEO/Executive)
exports.getAccuracyReport = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const query = {};

    if (category) query.category = category;
    if (startDate && endDate) {
      query.predictionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const predictions = await PredictiveAnalytics.find(query);

    // Calculate overall accuracy
    let totalPredictions = 0;
    let totalAccuracy = 0;

    predictions.forEach(pred => {
      pred.predictions.forEach(p => {
        if (p.actualValue !== undefined && p.actualValue !== null) {
          totalPredictions++;
          const variance = Math.abs(p.value - p.actualValue);
          const accuracy = Math.max(0, 100 - (variance / p.value) * 100);
          totalAccuracy += accuracy;
        }
      });
    });

    const avgAccuracy = totalPredictions > 0 ? totalAccuracy / totalPredictions : 0;

    // Group by category
    const byCategory = {};
    predictions.forEach(pred => {
      if (!byCategory[pred.category]) {
        byCategory[pred.category] = {
          count: 0,
          totalAccuracy: 0,
          predictions: 0
        };
      }

      byCategory[pred.category].count++;

      pred.predictions.forEach(p => {
        if (p.actualValue !== undefined && p.actualValue !== null) {
          byCategory[pred.category].predictions++;
          const variance = Math.abs(p.value - p.actualValue);
          const accuracy = Math.max(0, 100 - (variance / p.value) * 100);
          byCategory[pred.category].totalAccuracy += accuracy;
        }
      });
    });

    Object.keys(byCategory).forEach(cat => {
      const data = byCategory[cat];
      byCategory[cat].avgAccuracy =
        data.predictions > 0 ? data.totalAccuracy / data.predictions : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalPredictionsMade: predictions.length,
          totalPredictionsWithActuals: totalPredictions,
          avgAccuracy: avgAccuracy.toFixed(2)
        },
        byCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating accuracy report',
      error: error.message
    });
  }
};

// @desc    Get prediction statistics
// @route   GET /api/v1/ceo/predictive-analytics/stats
// @access  Private (CEO/Executive)
exports.getPredictionStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.predictionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await PredictiveAnalytics.aggregate([
      { $match: query },
      {
        $facet: {
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 }
              }
            }
          ],
          byConfidence: [
            {
              $group: {
                _id: '$confidenceLevel',
                count: { $sum: 1 }
              }
            }
          ],
          overall: [
            {
              $group: {
                _id: null,
                totalPredictions: { $sum: 1 },
                avgConfidence: { $avg: '$accuracy.confidence' }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prediction statistics',
      error: error.message
    });
  }
};

// @desc    Get recommendations from predictions
// @route   GET /api/v1/ceo/predictive-analytics/recommendations
// @access  Private (CEO/Executive)
exports.getRecommendations = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { confidenceLevel: { $in: ['high', 'medium'] } };

    if (category) query.category = category;

    const predictions = await PredictiveAnalytics.find(query)
      .sort({ predictionDate: -1 })
      .limit(10);

    const allRecommendations = [];

    predictions.forEach(pred => {
      pred.recommendations.forEach(rec => {
        allRecommendations.push({
          category: pred.category,
          metric: pred.metric,
          recommendation: rec,
          confidence: pred.confidenceLevel,
          predictionDate: pred.predictionDate
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        count: allRecommendations.length,
        recommendations: allRecommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
};

// @desc    Delete prediction
// @route   DELETE /api/v1/ceo/predictive-analytics/:id
// @access  Private (CEO/Executive)
exports.deletePrediction = async (req, res) => {
  try {
    const prediction = await PredictiveAnalytics.findByIdAndDelete(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting prediction',
      error: error.message
    });
  }
};
