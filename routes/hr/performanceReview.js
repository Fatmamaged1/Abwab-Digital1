const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReview,
  getReviewsByEmployee,
  createReview,
  generateReviewWithAI,
  updateReview,
  updateRatings,
  addPeerFeedback,
  addComment,
  submitReview,
  approveReview,
  completeReview,
  createImprovementPlan,
  updateImprovementProgress,
  getReviewStatistics,
  getEmployeePerformanceTrends,
  deleteReview
} = require('../../controllers/hr/performanceReviewController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/hr/performance-reviews
// @desc    Get all performance reviews
// @access  Private
router.get('/', getAllReviews);

// @route   GET /api/v1/hr/performance-reviews/stats
// @desc    Get review statistics
// @access  Private
router.get('/stats', getReviewStatistics);

// @route   POST /api/v1/hr/performance-reviews/generate
// @desc    Generate review with AI insights
// @access  Private
router.post('/generate', generateReviewWithAI);

// @route   GET /api/v1/hr/performance-reviews/employee/:employeeId
// @desc    Get reviews by employee
// @access  Private
router.get('/employee/:employeeId', getReviewsByEmployee);

// @route   GET /api/v1/hr/performance-reviews/employee/:employeeId/trends
// @desc    Get employee performance trends
// @access  Private
router.get('/employee/:employeeId/trends', getEmployeePerformanceTrends);

// @route   GET /api/v1/hr/performance-reviews/:id
// @desc    Get single performance review
// @access  Private
router.get('/:id', getReview);

// @route   POST /api/v1/hr/performance-reviews
// @desc    Create performance review
// @access  Private
router.post('/', createReview);

// @route   PUT /api/v1/hr/performance-reviews/:id
// @desc    Update performance review
// @access  Private
router.put('/:id', updateReview);

// @route   PUT /api/v1/hr/performance-reviews/:id/ratings
// @desc    Update review ratings
// @access  Private
router.put('/:id/ratings', updateRatings);

// @route   POST /api/v1/hr/performance-reviews/:id/peer-feedback
// @desc    Add peer feedback
// @access  Private
router.post('/:id/peer-feedback', addPeerFeedback);

// @route   POST /api/v1/hr/performance-reviews/:id/comments
// @desc    Add comment to review
// @access  Private
router.post('/:id/comments', addComment);

// @route   PUT /api/v1/hr/performance-reviews/:id/submit
// @desc    Submit review for approval
// @access  Private
router.put('/:id/submit', submitReview);

// @route   PUT /api/v1/hr/performance-reviews/:id/approve
// @desc    Approve review
// @access  Private
router.put('/:id/approve', approveReview);

// @route   PUT /api/v1/hr/performance-reviews/:id/complete
// @desc    Complete review
// @access  Private
router.put('/:id/complete', completeReview);

// @route   POST /api/v1/hr/performance-reviews/:id/improvement-plan
// @desc    Create improvement plan
// @access  Private
router.post('/:id/improvement-plan', createImprovementPlan);

// @route   PUT /api/v1/hr/performance-reviews/:id/improvement-plan/progress
// @desc    Update improvement plan progress
// @access  Private
router.put('/:id/improvement-plan/progress', updateImprovementProgress);

// @route   DELETE /api/v1/hr/performance-reviews/:id
// @desc    Delete performance review
// @access  Private
router.delete('/:id', deleteReview);

module.exports = router;
