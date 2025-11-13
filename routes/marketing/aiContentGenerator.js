const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getRequest,
  generateContent,
  regenerateContent,
  approveContent,
  rateContent,
  getVariations,
  generateVariations,
  getStatistics,
  exportContent,
  deleteRequest
} = require('../../controllers/marketing/aiContentGeneratorController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/marketing/ai-content
// @desc    Get all AI content generation requests
// @access  Private
router.get('/', getAllRequests);

// @route   GET /api/v1/marketing/ai-content/stats
// @desc    Get AI content generation statistics
// @access  Private
router.get('/stats', getStatistics);

// @route   POST /api/v1/marketing/ai-content/generate
// @desc    Generate content with AI
// @access  Private
router.post('/generate', generateContent);

// @route   GET /api/v1/marketing/ai-content/:id
// @desc    Get single AI content request
// @access  Private
router.get('/:id', getRequest);

// @route   POST /api/v1/marketing/ai-content/:id/regenerate
// @desc    Regenerate content with new parameters
// @access  Private
router.post('/:id/regenerate', regenerateContent);

// @route   PUT /api/v1/marketing/ai-content/:id/approve
// @desc    Approve generated content
// @access  Private
router.put('/:id/approve', approveContent);

// @route   PUT /api/v1/marketing/ai-content/:id/rate
// @desc    Rate generated content
// @access  Private
router.put('/:id/rate', rateContent);

// @route   GET /api/v1/marketing/ai-content/:id/variations
// @desc    Get content variations
// @access  Private
router.get('/:id/variations', getVariations);

// @route   POST /api/v1/marketing/ai-content/:id/variations
// @desc    Generate additional variations
// @access  Private
router.post('/:id/variations', generateVariations);

// @route   GET /api/v1/marketing/ai-content/:id/export
// @desc    Export content
// @access  Private
router.get('/:id/export', exportContent);

// @route   DELETE /api/v1/marketing/ai-content/:id
// @desc    Delete AI content request
// @access  Private
router.delete('/:id', deleteRequest);

module.exports = router;
