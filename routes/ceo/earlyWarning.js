const express = require('express');
const router = express.Router();
const {
  getAllWarnings,
  getWarning,
  createWarning,
  scanForWarnings,
  updateWarning,
  acknowledgeWarning,
  resolveWarning,
  escalateWarning,
  addActionTaken,
  getActiveWarnings,
  getWarningsByCategory,
  getWarningStatistics,
  getTrendAnalysis,
  deleteWarning
} = require('../../controllers/ceo/earlyWarningController');

const { protect, authorize } = require('../../middleware/auth');

// All routes require authentication and CEO/Executive role
router.use(protect);
router.use(authorize('ceo', 'executive', 'admin'));

// @route   GET /api/v1/ceo/early-warning
// @desc    Get all warnings
// @access  Private (CEO/Executive)
router.get('/', getAllWarnings);

// @route   GET /api/v1/ceo/early-warning/active
// @desc    Get active warnings
// @access  Private (CEO/Executive)
router.get('/active', getActiveWarnings);

// @route   GET /api/v1/ceo/early-warning/stats
// @desc    Get warning statistics
// @access  Private (CEO/Executive)
router.get('/stats', getWarningStatistics);

// @route   GET /api/v1/ceo/early-warning/trends
// @desc    Get trend analysis
// @access  Private (CEO/Executive)
router.get('/trends', getTrendAnalysis);

// @route   POST /api/v1/ceo/early-warning/scan
// @desc    Scan for new warnings with AI
// @access  Private (CEO/Executive)
router.post('/scan', scanForWarnings);

// @route   GET /api/v1/ceo/early-warning/category/:category
// @desc    Get warnings by category
// @access  Private (CEO/Executive)
router.get('/category/:category', getWarningsByCategory);

// @route   GET /api/v1/ceo/early-warning/:id
// @desc    Get single warning
// @access  Private (CEO/Executive)
router.get('/:id', getWarning);

// @route   POST /api/v1/ceo/early-warning
// @desc    Create warning
// @access  Private (CEO/Executive)
router.post('/', createWarning);

// @route   PUT /api/v1/ceo/early-warning/:id
// @desc    Update warning
// @access  Private (CEO/Executive)
router.put('/:id', updateWarning);

// @route   PUT /api/v1/ceo/early-warning/:id/acknowledge
// @desc    Acknowledge warning
// @access  Private (CEO/Executive)
router.put('/:id/acknowledge', acknowledgeWarning);

// @route   PUT /api/v1/ceo/early-warning/:id/resolve
// @desc    Resolve warning
// @access  Private (CEO/Executive)
router.put('/:id/resolve', resolveWarning);

// @route   PUT /api/v1/ceo/early-warning/:id/escalate
// @desc    Escalate warning
// @access  Private (CEO/Executive)
router.put('/:id/escalate', escalateWarning);

// @route   POST /api/v1/ceo/early-warning/:id/actions
// @desc    Add action taken
// @access  Private (CEO/Executive)
router.post('/:id/actions', addActionTaken);

// @route   DELETE /api/v1/ceo/early-warning/:id
// @desc    Delete warning
// @access  Private (CEO/Executive)
router.delete('/:id', deleteWarning);

module.exports = router;
