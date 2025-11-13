const CashFlowForecast = require('../../models/accounting/cashFlowForecastModel');
const AIService = require('../../services/aiService');

// @desc    Get all cash flow forecasts
// @route   GET /api/v1/accounting/cash-flow-forecast
// @access  Private
exports.getAllForecasts = async (req, res) => {
  try {
    const { year, month, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);
    if (type) query['period.type'] = type;

    const forecasts = await CashFlowForecast.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await CashFlowForecast.countDocuments(query);

    res.status(200).json({
      success: true,
      data: forecasts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cash flow forecasts',
      error: error.message
    });
  }
};

// @desc    Get single cash flow forecast
// @route   GET /api/v1/accounting/cash-flow-forecast/:id
// @access  Private
exports.getForecast = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar')
      .populate('projectedInflows.source', 'name')
      .populate('projectedOutflows.category', 'name');

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cash flow forecast',
      error: error.message
    });
  }
};

// @desc    Get forecast by period
// @route   GET /api/v1/accounting/cash-flow-forecast/period/:year/:month
// @access  Private
exports.getForecastByPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;

    const forecast = await CashFlowForecast.findOne({
      'period.year': parseInt(year),
      'period.month': month === 'annual' ? null : parseInt(month),
      'period.type': month === 'annual' ? 'annual' : 'monthly'
    })
      .populate('createdBy', 'name email')
      .populate('projectedInflows.source', 'name')
      .populate('projectedOutflows.category', 'name');

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found for this period'
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast by period',
      error: error.message
    });
  }
};

// @desc    Create cash flow forecast
// @route   POST /api/v1/accounting/cash-flow-forecast
// @access  Private
exports.createForecast = async (req, res) => {
  try {
    const forecastData = {
      ...req.body,
      createdBy: req.user._id
    };

    const forecast = await CashFlowForecast.create(forecastData);

    res.status(201).json({
      success: true,
      data: forecast,
      message: 'Cash flow forecast created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating cash flow forecast',
      error: error.message
    });
  }
};

// @desc    Generate forecast with AI
// @route   POST /api/v1/accounting/cash-flow-forecast/generate
// @access  Private
exports.generateForecastWithAI = async (req, res) => {
  try {
    const { year, month, type = 'monthly', historicalMonths = 6 } = req.body;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }

    if (type === 'monthly' && !month) {
      return res.status(400).json({
        success: false,
        message: 'Month is required for monthly forecast'
      });
    }

    // Get historical data for AI prediction
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - historicalMonths);

    const historicalForecasts = await CashFlowForecast.find({
      'period.year': { $gte: startDate.getFullYear() },
      'period.type': type
    })
      .sort({ 'period.year': 1, 'period.month': 1 })
      .limit(historicalMonths);

    // Prepare historical data for AI
    const historicalData = historicalForecasts.map(forecast => ({
      period: forecast.period,
      totalInflow: forecast.totalProjectedInflow,
      totalOutflow: forecast.totalProjectedOutflow,
      netCashFlow: forecast.netCashFlow,
      closingBalance: forecast.closingBalance
    }));

    // Use AI to predict cash flow
    const aiService = new AIService();
    const aiPrediction = await aiService.predictCashFlow({
      historicalData,
      targetYear: year,
      targetMonth: month,
      type
    });

    if (!aiPrediction) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate AI prediction'
      });
    }

    // Get latest closing balance as opening balance
    const latestForecast = historicalForecasts[historicalForecasts.length - 1];
    const openingBalance = latestForecast ? latestForecast.closingBalance : 0;

    // Create forecast with AI predictions
    const forecast = await CashFlowForecast.create({
      period: {
        year: parseInt(year),
        month: type === 'monthly' ? parseInt(month) : null,
        type
      },
      openingBalance,
      projectedInflows: aiPrediction.projectedInflows || [],
      projectedOutflows: aiPrediction.projectedOutflows || [],
      totalProjectedInflow: aiPrediction.totalInflow || 0,
      totalProjectedOutflow: aiPrediction.totalOutflow || 0,
      netCashFlow: aiPrediction.netCashFlow || 0,
      closingBalance: openingBalance + (aiPrediction.netCashFlow || 0),
      aiPrediction: {
        confidence: aiPrediction.confidence || 'medium',
        basedOnMonths: historicalMonths,
        riskFactors: aiPrediction.riskFactors || [],
        recommendations: aiPrediction.recommendations || [],
        predictedTrend: aiPrediction.trend || 'stable'
      },
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: forecast,
      message: 'Cash flow forecast generated with AI successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating forecast with AI',
      error: error.message
    });
  }
};

// @desc    Update cash flow forecast
// @route   PUT /api/v1/accounting/cash-flow-forecast/:id
// @access  Private
exports.updateForecast = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        forecast[key] = req.body[key];
      }
    });

    forecast.updatedBy = req.user._id;
    await forecast.save();

    res.status(200).json({
      success: true,
      data: forecast,
      message: 'Cash flow forecast updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cash flow forecast',
      error: error.message
    });
  }
};

// @desc    Add projected inflow
// @route   POST /api/v1/accounting/cash-flow-forecast/:id/inflows
// @access  Private
exports.addProjectedInflow = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    const inflow = {
      source: req.body.source,
      category: req.body.category,
      amount: req.body.amount,
      expectedDate: req.body.expectedDate,
      probability: req.body.probability || 'high',
      notes: req.body.notes
    };

    forecast.projectedInflows.push(inflow);

    // Recalculate totals
    forecast.totalProjectedInflow = forecast.projectedInflows.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    forecast.netCashFlow = forecast.totalProjectedInflow - forecast.totalProjectedOutflow;
    forecast.closingBalance = forecast.openingBalance + forecast.netCashFlow;

    await forecast.save();

    res.status(200).json({
      success: true,
      data: forecast,
      message: 'Projected inflow added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding projected inflow',
      error: error.message
    });
  }
};

// @desc    Add projected outflow
// @route   POST /api/v1/accounting/cash-flow-forecast/:id/outflows
// @access  Private
exports.addProjectedOutflow = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    const outflow = {
      category: req.body.category,
      description: req.body.description,
      amount: req.body.amount,
      dueDate: req.body.dueDate,
      priority: req.body.priority || 'medium',
      recurring: req.body.recurring || false,
      notes: req.body.notes
    };

    forecast.projectedOutflows.push(outflow);

    // Recalculate totals
    forecast.totalProjectedOutflow = forecast.projectedOutflows.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    forecast.netCashFlow = forecast.totalProjectedInflow - forecast.totalProjectedOutflow;
    forecast.closingBalance = forecast.openingBalance + forecast.netCashFlow;

    await forecast.save();

    res.status(200).json({
      success: true,
      data: forecast,
      message: 'Projected outflow added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding projected outflow',
      error: error.message
    });
  }
};

// @desc    Update actual values
// @route   PUT /api/v1/accounting/cash-flow-forecast/:id/actuals
// @access  Private
exports.updateActuals = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    const { actualInflow, actualOutflow } = req.body;

    if (actualInflow !== undefined) forecast.actualInflow = actualInflow;
    if (actualOutflow !== undefined) forecast.actualOutflow = actualOutflow;

    // Calculate variance
    if (forecast.actualInflow !== null && forecast.actualOutflow !== null) {
      forecast.variance = {
        inflowVariance: forecast.actualInflow - forecast.totalProjectedInflow,
        outflowVariance: forecast.actualOutflow - forecast.totalProjectedOutflow,
        netVariance:
          forecast.actualInflow -
          forecast.actualOutflow -
          forecast.netCashFlow
      };
    }

    forecast.updatedBy = req.user._id;
    await forecast.save();

    res.status(200).json({
      success: true,
      data: forecast,
      message: 'Actual values updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating actual values',
      error: error.message
    });
  }
};

// @desc    Get forecast summary
// @route   GET /api/v1/accounting/cash-flow-forecast/:id/summary
// @access  Private
exports.getForecastSummary = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findById(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    const summary = {
      period: forecast.period,
      openingBalance: forecast.openingBalance,
      projectedInflows: {
        total: forecast.totalProjectedInflow,
        count: forecast.projectedInflows.length,
        byCategory: forecast.projectedInflows.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.amount;
          return acc;
        }, {})
      },
      projectedOutflows: {
        total: forecast.totalProjectedOutflow,
        count: forecast.projectedOutflows.length,
        byCategory: forecast.projectedOutflows.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.amount;
          return acc;
        }, {}),
        byPriority: forecast.projectedOutflows.reduce((acc, item) => {
          acc[item.priority] = (acc[item.priority] || 0) + item.amount;
          return acc;
        }, {})
      },
      netCashFlow: forecast.netCashFlow,
      closingBalance: forecast.closingBalance,
      variance: forecast.variance,
      aiPrediction: forecast.aiPrediction,
      status: forecast.closingBalance < 0 ? 'deficit' : 'surplus',
      cashFlowHealth:
        forecast.netCashFlow > 0
          ? 'positive'
          : forecast.netCashFlow < 0
          ? 'negative'
          : 'neutral'
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast summary',
      error: error.message
    });
  }
};

// @desc    Get forecast trends
// @route   GET /api/v1/accounting/cash-flow-forecast/trends
// @access  Private
exports.getForecastTrends = async (req, res) => {
  try {
    const { startYear, endYear, type = 'monthly' } = req.query;

    const query = { 'period.type': type };
    if (startYear && endYear) {
      query['period.year'] = {
        $gte: parseInt(startYear),
        $lte: parseInt(endYear)
      };
    }

    const forecasts = await CashFlowForecast.find(query)
      .select('period totalProjectedInflow totalProjectedOutflow netCashFlow closingBalance actualInflow actualOutflow')
      .sort({ 'period.year': 1, 'period.month': 1 });

    const trends = forecasts.map(forecast => ({
      period: forecast.period,
      projected: {
        inflow: forecast.totalProjectedInflow,
        outflow: forecast.totalProjectedOutflow,
        netCashFlow: forecast.netCashFlow,
        closingBalance: forecast.closingBalance
      },
      actual: {
        inflow: forecast.actualInflow,
        outflow: forecast.actualOutflow
      }
    }));

    // Calculate overall trend
    const avgNetCashFlow =
      trends.reduce((sum, t) => sum + t.projected.netCashFlow, 0) / trends.length;
    const overallTrend = avgNetCashFlow > 0 ? 'growing' : avgNetCashFlow < 0 ? 'declining' : 'stable';

    res.status(200).json({
      success: true,
      data: {
        trends,
        summary: {
          totalPeriods: trends.length,
          avgNetCashFlow,
          overallTrend
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast trends',
      error: error.message
    });
  }
};

// @desc    Get cash flow statistics
// @route   GET /api/v1/accounting/cash-flow-forecast/stats
// @access  Private
exports.getCashFlowStatistics = async (req, res) => {
  try {
    const { year, type } = req.query;
    const query = {};

    if (year) query['period.year'] = parseInt(year);
    if (type) query['period.type'] = type;

    const stats = await CashFlowForecast.aggregate([
      { $match: query },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalForecasts: { $sum: 1 },
                avgInflow: { $avg: '$totalProjectedInflow' },
                avgOutflow: { $avg: '$totalProjectedOutflow' },
                avgNetCashFlow: { $avg: '$netCashFlow' },
                totalProjectedInflow: { $sum: '$totalProjectedInflow' },
                totalProjectedOutflow: { $sum: '$totalProjectedOutflow' }
              }
            }
          ],
          byMonth: [
            {
              $group: {
                _id: '$period.month',
                count: { $sum: 1 },
                avgInflow: { $avg: '$totalProjectedInflow' },
                avgOutflow: { $avg: '$totalProjectedOutflow' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          cashFlowHealth: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $gt: ['$netCashFlow', 0] },
                    'positive',
                    { $cond: [{ $lt: ['$netCashFlow', 0] }, 'negative', 'neutral'] }
                  ]
                },
                count: { $sum: 1 }
              }
            }
          ],
          accuracy: [
            {
              $match: {
                actualInflow: { $ne: null },
                actualOutflow: { $ne: null }
              }
            },
            {
              $group: {
                _id: null,
                avgInflowAccuracy: {
                  $avg: {
                    $abs: {
                      $divide: [
                        { $subtract: ['$actualInflow', '$totalProjectedInflow'] },
                        '$totalProjectedInflow'
                      ]
                    }
                  }
                },
                avgOutflowAccuracy: {
                  $avg: {
                    $abs: {
                      $divide: [
                        { $subtract: ['$actualOutflow', '$totalProjectedOutflow'] },
                        '$totalProjectedOutflow'
                      ]
                    }
                  }
                }
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
      message: 'Error fetching cash flow statistics',
      error: error.message
    });
  }
};

// @desc    Delete cash flow forecast
// @route   DELETE /api/v1/accounting/cash-flow-forecast/:id
// @access  Private
exports.deleteForecast = async (req, res) => {
  try {
    const forecast = await CashFlowForecast.findByIdAndDelete(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow forecast not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cash flow forecast deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting cash flow forecast',
      error: error.message
    });
  }
};
