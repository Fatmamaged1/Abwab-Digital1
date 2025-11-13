const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  submitForReview,
  startReview,
  approveReview,
  requestChanges,
  analyzeCodeWithAI,
  addComment,
  addInlineComment,
  resolveComment,
  getReviewsByProject,
  getReviewsByReviewer,
  getReviewStatistics,
  deleteReview
} = require('../../controllers/software/codeReviewController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/software/code-reviews
// @desc    Get all code reviews with filters
// @access  Private
router.get('/', getAllReviews);

// @route   GET /api/v1/software/code-reviews/stats
// @desc    Get code review statistics
// @access  Private
router.get('/stats', getReviewStatistics);

// @route   GET /api/v1/software/code-reviews/project/:projectId
// @desc    Get reviews by project
// @access  Private
router.get('/project/:projectId', getReviewsByProject);

// @route   GET /api/v1/software/code-reviews/reviewer/:reviewerId
// @desc    Get reviews by reviewer
// @access  Private
router.get('/reviewer/:reviewerId', getReviewsByReviewer);

// @route   GET /api/v1/software/code-reviews/:id
// @desc    Get single code review
// @access  Private
router.get('/:id', getReview);

// @route   POST /api/v1/software/code-reviews
// @desc    Create new code review
// @access  Private
router.post('/', createReview);

// @route   PUT /api/v1/software/code-reviews/:id
// @desc    Update code review
// @access  Private
router.put('/:id', updateReview);

// @route   PUT /api/v1/software/code-reviews/:id/submit
// @desc    Submit code for review
// @access  Private
router.put('/:id/submit', submitForReview);

// @route   PUT /api/v1/software/code-reviews/:id/start
// @desc    Start reviewing code
// @access  Private
router.put('/:id/start', startReview);

// @route   PUT /api/v1/software/code-reviews/:id/approve
// @desc    Approve code review
// @access  Private
router.put('/:id/approve', approveReview);

// @route   PUT /api/v1/software/code-reviews/:id/request-changes
// @desc    Request changes
// @access  Private
router.put('/:id/request-changes', requestChanges);

// @route   POST /api/v1/software/code-reviews/:id/analyze
// @desc    Analyze code with AI
// @access  Private
router.post('/:id/analyze', analyzeCodeWithAI);

// @route   POST /api/v1/software/code-reviews/:id/comments
// @desc    Add general comment
// @access  Private
router.post('/:id/comments', addComment);

// @route   POST /api/v1/software/code-reviews/:id/inline-comments
// @desc    Add inline comment
// @access  Private
router.post('/:id/inline-comments', addInlineComment);

// @route   PUT /api/v1/software/code-reviews/:id/comments/:commentId/resolve
// @desc    Resolve comment
// @access  Private
router.put('/:id/comments/:commentId/resolve', resolveComment);

// @route   DELETE /api/v1/software/code-reviews/:id
// @desc    Delete code review
// @access  Private
router.delete('/:id', deleteReview);

module.exports = router;
