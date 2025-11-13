const express = require('express');
const router = express.Router();
const {
  getAllKPIs,
  getKPIById,
  getKPIByProject,
  createKPI,
  calculateKPIs,
  updateKPI,
  updateMetrics,
  addAlert,
  resolveAlert,
  getActiveAlerts,
  takeSnapshot,
  getTrendAnalysis,
  getKPIStatistics,
  deleteKPI
} = require('../../controllers/agile/projectKPIController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/agile/kpi
// @desc    Get all KPIs with filters
// @access  Private
router.get('/', getAllKPIs);

// @route   GET /api/v1/agile/kpi/stats
// @desc    Get KPI statistics
// @access  Private
router.get('/stats', getKPIStatistics);

// @route   GET /api/v1/agile/kpi/:id
// @desc    Get single KPI by ID
// @access  Private
router.get('/:id', getKPIById);

// @route   GET /api/v1/agile/kpi/project/:projectId
// @desc    Get KPI by project ID
// @access  Private
router.get('/project/:projectId', getKPIByProject);

// @route   POST /api/v1/agile/kpi
// @desc    Create new KPI
// @access  Private
router.post('/', createKPI);

// @route   POST /api/v1/agile/kpi/:id/calculate
// @desc    Calculate/recalculate KPIs
// @access  Private
router.post('/:id/calculate', calculateKPIs);

// @route   PUT /api/v1/agile/kpi/:id
// @desc    Update KPI
// @access  Private
router.put('/:id', updateKPI);

// @route   PUT /api/v1/agile/kpi/:id/metrics
// @desc    Update specific metrics
// @access  Private
router.put('/:id/metrics', updateMetrics);

// @route   POST /api/v1/agile/kpi/:id/alerts
// @desc    Add alert to KPI
// @access  Private
router.post('/:id/alerts', addAlert);

// @route   PUT /api/v1/agile/kpi/:id/alerts/:alertId/resolve
// @desc    Resolve alert
// @access  Private
router.put('/:id/alerts/:alertId/resolve', resolveAlert);

// @route   GET /api/v1/agile/kpi/:id/alerts/active
// @desc    Get active alerts for KPI
// @access  Private
router.get('/:id/alerts/active', getActiveAlerts);

// @route   POST /api/v1/agile/kpi/:id/snapshot
// @desc    Take weekly snapshot
// @access  Private
router.post('/:id/snapshot', takeSnapshot);

// @route   GET /api/v1/agile/kpi/:id/trends
// @desc    Get trend analysis
// @access  Private
router.get('/:id/trends', getTrendAnalysis);

// @route   DELETE /api/v1/agile/kpi/:id
// @desc    Delete KPI
// @access  Private
router.delete('/:id', deleteKPI);

module.exports = router;
