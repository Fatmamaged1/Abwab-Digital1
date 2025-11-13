const express = require('express');
const router = express.Router();
const {
  getAllExecutiveKPIs,
  getExecutiveKPI,
  getExecutiveKPIByPeriod,
  createExecutiveKPI,
  generateKPIsWithAI,
  updateExecutiveKPI,
  updateFinancials,
  updateOperations,
  updateSales,
  updateHR,
  addAlert,
  resolveAlert,
  getExecutiveSummary,
  getKPITrends,
  getExecutiveStatistics,
  deleteExecutiveKPI
} = require('../../controllers/ceo/executiveKPIController');

const { protect, authorize } = require('../../middleware/auth');

// All routes require authentication and CEO/Executive role
router.use(protect);
router.use(authorize('ceo', 'executive', 'admin'));

// @route   GET /api/v1/ceo/executive-kpi
// @desc    Get all executive KPIs
// @access  Private (CEO/Executive)
router.get('/', getAllExecutiveKPIs);

// @route   GET /api/v1/ceo/executive-kpi/stats
// @desc    Get executive statistics
// @access  Private (CEO/Executive)
router.get('/stats', getExecutiveStatistics);

// @route   GET /api/v1/ceo/executive-kpi/trends
// @desc    Get KPI trends
// @access  Private (CEO/Executive)
router.get('/trends', getKPITrends);

// @route   POST /api/v1/ceo/executive-kpi/generate
// @desc    Generate KPIs with AI
// @access  Private (CEO/Executive)
router.post('/generate', generateKPIsWithAI);

// @route   GET /api/v1/ceo/executive-kpi/period/:year/:month
// @desc    Get executive KPI by period
// @access  Private (CEO/Executive)
router.get('/period/:year/:month', getExecutiveKPIByPeriod);

// @route   GET /api/v1/ceo/executive-kpi/:id
// @desc    Get single executive KPI
// @access  Private (CEO/Executive)
router.get('/:id', getExecutiveKPI);

// @route   GET /api/v1/ceo/executive-kpi/:id/summary
// @desc    Get executive summary
// @access  Private (CEO/Executive)
router.get('/:id/summary', getExecutiveSummary);

// @route   POST /api/v1/ceo/executive-kpi
// @desc    Create executive KPI
// @access  Private (CEO/Executive)
router.post('/', createExecutiveKPI);

// @route   PUT /api/v1/ceo/executive-kpi/:id
// @desc    Update executive KPI
// @access  Private (CEO/Executive)
router.put('/:id', updateExecutiveKPI);

// @route   PUT /api/v1/ceo/executive-kpi/:id/financials
// @desc    Update financial metrics
// @access  Private (CEO/Executive)
router.put('/:id/financials', updateFinancials);

// @route   PUT /api/v1/ceo/executive-kpi/:id/operations
// @desc    Update operational metrics
// @access  Private (CEO/Executive)
router.put('/:id/operations', updateOperations);

// @route   PUT /api/v1/ceo/executive-kpi/:id/sales
// @desc    Update sales metrics
// @access  Private (CEO/Executive)
router.put('/:id/sales', updateSales);

// @route   PUT /api/v1/ceo/executive-kpi/:id/hr
// @desc    Update HR metrics
// @access  Private (CEO/Executive)
router.put('/:id/hr', updateHR);

// @route   POST /api/v1/ceo/executive-kpi/:id/alerts
// @desc    Add alert
// @access  Private (CEO/Executive)
router.post('/:id/alerts', addAlert);

// @route   PUT /api/v1/ceo/executive-kpi/:id/alerts/:alertId/resolve
// @desc    Resolve alert
// @access  Private (CEO/Executive)
router.put('/:id/alerts/:alertId/resolve', resolveAlert);

// @route   DELETE /api/v1/ceo/executive-kpi/:id
// @desc    Delete executive KPI
// @access  Private (CEO/Executive)
router.delete('/:id', deleteExecutiveKPI);

module.exports = router;
