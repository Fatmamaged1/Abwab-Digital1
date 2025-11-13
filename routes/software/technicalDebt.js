const express = require('express');
const router = express.Router();
const {
  getAllTechnicalDebt,
  getTechnicalDebt,
  createTechnicalDebt,
  updateTechnicalDebt,
  updateStatus,
  calculateROI,
  addEstimate,
  addResolutionPlan,
  updateProgress,
  getTechnicalDebtByProject,
  getTechnicalDebtStatistics,
  getPriorityRecommendations,
  deleteTechnicalDebt
} = require('../../controllers/software/technicalDebtController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/software/technical-debt
// @desc    Get all technical debt items
// @access  Private
router.get('/', getAllTechnicalDebt);

// @route   GET /api/v1/software/technical-debt/stats
// @desc    Get technical debt statistics
// @access  Private
router.get('/stats', getTechnicalDebtStatistics);

// @route   GET /api/v1/software/technical-debt/priority-recommendations
// @desc    Get priority recommendations
// @access  Private
router.get('/priority-recommendations', getPriorityRecommendations);

// @route   GET /api/v1/software/technical-debt/project/:projectId
// @desc    Get technical debt by project
// @access  Private
router.get('/project/:projectId', getTechnicalDebtByProject);

// @route   GET /api/v1/software/technical-debt/:id
// @desc    Get single technical debt item
// @access  Private
router.get('/:id', getTechnicalDebt);

// @route   POST /api/v1/software/technical-debt
// @desc    Create new technical debt item
// @access  Private
router.post('/', createTechnicalDebt);

// @route   PUT /api/v1/software/technical-debt/:id
// @desc    Update technical debt item
// @access  Private
router.put('/:id', updateTechnicalDebt);

// @route   PUT /api/v1/software/technical-debt/:id/status
// @desc    Update status
// @access  Private
router.put('/:id/status', updateStatus);

// @route   POST /api/v1/software/technical-debt/:id/calculate-roi
// @desc    Calculate ROI for fixing
// @access  Private
router.post('/:id/calculate-roi', calculateROI);

// @route   POST /api/v1/software/technical-debt/:id/estimate
// @desc    Add effort estimate
// @access  Private
router.post('/:id/estimate', addEstimate);

// @route   POST /api/v1/software/technical-debt/:id/resolution-plan
// @desc    Add resolution plan
// @access  Private
router.post('/:id/resolution-plan', addResolutionPlan);

// @route   PUT /api/v1/software/technical-debt/:id/progress
// @desc    Update progress
// @access  Private
router.put('/:id/progress', updateProgress);

// @route   DELETE /api/v1/software/technical-debt/:id
// @desc    Delete technical debt item
// @access  Private
router.delete('/:id', deleteTechnicalDebt);

module.exports = router;
