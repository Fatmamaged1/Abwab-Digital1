const express = require('express');
const router = express.Router();
const {
  getAllLeadScores,
  getLeadScoreById,
  createLeadScore,
  updateLeadScore,
  scoreLeadWithAI,
  addInteraction,
  getHighPriorityLeads,
  getLeadScoringStats,
  getScoreDistribution,
  assignLead,
  getScoreHistory,
  bulkScoreLeads,
  deleteLeadScore
} = require('../../controllers/sales/leadScoringController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/sales/lead-scoring
// @desc    Get all lead scores
// @access  Private
router.get('/', getAllLeadScores);

// @route   GET /api/v1/sales/lead-scoring/high-priority
// @desc    Get high priority leads
// @access  Private
router.get('/high-priority', getHighPriorityLeads);

// @route   GET /api/v1/sales/lead-scoring/stats
// @desc    Get lead scoring statistics
// @access  Private
router.get('/stats', getLeadScoringStats);

// @route   GET /api/v1/sales/lead-scoring/distribution
// @desc    Get score distribution
// @access  Private
router.get('/distribution', getScoreDistribution);

// @route   POST /api/v1/sales/lead-scoring/bulk-score
// @desc    Bulk score leads
// @access  Private
router.post('/bulk-score', bulkScoreLeads);

// @route   GET /api/v1/sales/lead-scoring/:id
// @desc    Get lead score by ID
// @access  Private
router.get('/:id', getLeadScoreById);

// @route   POST /api/v1/sales/lead-scoring
// @desc    Create/Calculate lead score
// @access  Private
router.post('/', createLeadScore);

// @route   PUT /api/v1/sales/lead-scoring/:id
// @desc    Update lead score
// @access  Private
router.put('/:id', updateLeadScore);

// @route   POST /api/v1/sales/lead-scoring/:id/ai-score
// @desc    Score lead with AI
// @access  Private
router.post('/:id/ai-score', scoreLeadWithAI);

// @route   POST /api/v1/sales/lead-scoring/:id/interactions
// @desc    Add interaction to lead
// @access  Private
router.post('/:id/interactions', addInteraction);

// @route   POST /api/v1/sales/lead-scoring/:id/assign
// @desc    Assign lead to sales rep
// @access  Private
router.post('/:id/assign', assignLead);

// @route   GET /api/v1/sales/lead-scoring/:id/history
// @desc    Get score history
// @access  Private
router.get('/:id/history', getScoreHistory);

// @route   DELETE /api/v1/sales/lead-scoring/:id
// @desc    Delete lead score
// @access  Private
router.delete('/:id', deleteLeadScore);

module.exports = router;
