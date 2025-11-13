const express = require('express');
const router = express.Router();
const {
  getAllForecasts,
  getForecast,
  getForecastByPeriod,
  createForecast,
  generateForecastWithAI,
  updateForecast,
  addProjectedInflow,
  addProjectedOutflow,
  updateActuals,
  getForecastSummary,
  getForecastTrends,
  getCashFlowStatistics,
  deleteForecast
} = require('../../controllers/accounting/cashFlowForecastController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/accounting/cash-flow-forecast
// @desc    Get all cash flow forecasts
// @access  Private
router.get('/', getAllForecasts);

// @route   GET /api/v1/accounting/cash-flow-forecast/trends
// @desc    Get forecast trends
// @access  Private
router.get('/trends', getForecastTrends);

// @route   GET /api/v1/accounting/cash-flow-forecast/stats
// @desc    Get cash flow statistics
// @access  Private
router.get('/stats', getCashFlowStatistics);

// @route   POST /api/v1/accounting/cash-flow-forecast/generate
// @desc    Generate forecast with AI
// @access  Private
router.post('/generate', generateForecastWithAI);

// @route   GET /api/v1/accounting/cash-flow-forecast/period/:year/:month
// @desc    Get forecast by period
// @access  Private
router.get('/period/:year/:month', getForecastByPeriod);

// @route   GET /api/v1/accounting/cash-flow-forecast/:id
// @desc    Get single cash flow forecast
// @access  Private
router.get('/:id', getForecast);

// @route   GET /api/v1/accounting/cash-flow-forecast/:id/summary
// @desc    Get forecast summary
// @access  Private
router.get('/:id/summary', getForecastSummary);

// @route   POST /api/v1/accounting/cash-flow-forecast
// @desc    Create cash flow forecast
// @access  Private
router.post('/', createForecast);

// @route   PUT /api/v1/accounting/cash-flow-forecast/:id
// @desc    Update cash flow forecast
// @access  Private
router.put('/:id', updateForecast);

// @route   POST /api/v1/accounting/cash-flow-forecast/:id/inflows
// @desc    Add projected inflow
// @access  Private
router.post('/:id/inflows', addProjectedInflow);

// @route   POST /api/v1/accounting/cash-flow-forecast/:id/outflows
// @desc    Add projected outflow
// @access  Private
router.post('/:id/outflows', addProjectedOutflow);

// @route   PUT /api/v1/accounting/cash-flow-forecast/:id/actuals
// @desc    Update actual values
// @access  Private
router.put('/:id/actuals', updateActuals);

// @route   DELETE /api/v1/accounting/cash-flow-forecast/:id
// @desc    Delete cash flow forecast
// @access  Private
router.delete('/:id', deleteForecast);

module.exports = router;
