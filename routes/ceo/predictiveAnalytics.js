const express = require('express');
const router = express.Router();
const {
  getAllPredictions,
  getPrediction,
  generateRevenuePrediction,
  generateProjectSuccessPrediction,
  generateChurnPrediction,
  generateResourcePrediction,
  updateActualData,
  getAccuracyReport,
  getPredictionStatistics,
  getRecommendations,
  deletePrediction
} = require('../../controllers/ceo/predictiveAnalyticsController');

const { protect, authorize } = require('../../middleware/auth');

// All routes require authentication and CEO/Executive role
router.use(protect);
router.use(authorize('ceo', 'executive', 'admin'));

// @route   GET /api/v1/ceo/predictive-analytics
// @desc    Get all predictions
// @access  Private (CEO/Executive)
router.get('/', getAllPredictions);

// @route   GET /api/v1/ceo/predictive-analytics/stats
// @desc    Get prediction statistics
// @access  Private (CEO/Executive)
router.get('/stats', getPredictionStatistics);

// @route   GET /api/v1/ceo/predictive-analytics/accuracy-report
// @desc    Get prediction accuracy report
// @access  Private (CEO/Executive)
router.get('/accuracy-report', getAccuracyReport);

// @route   GET /api/v1/ceo/predictive-analytics/recommendations
// @desc    Get recommendations from predictions
// @access  Private (CEO/Executive)
router.get('/recommendations', getRecommendations);

// @route   POST /api/v1/ceo/predictive-analytics/revenue
// @desc    Generate revenue prediction
// @access  Private (CEO/Executive)
router.post('/revenue', generateRevenuePrediction);

// @route   POST /api/v1/ceo/predictive-analytics/project-success
// @desc    Generate project success prediction
// @access  Private (CEO/Executive)
router.post('/project-success', generateProjectSuccessPrediction);

// @route   POST /api/v1/ceo/predictive-analytics/churn
// @desc    Generate churn prediction
// @access  Private (CEO/Executive)
router.post('/churn', generateChurnPrediction);

// @route   POST /api/v1/ceo/predictive-analytics/resource-utilization
// @desc    Generate resource utilization prediction
// @access  Private (CEO/Executive)
router.post('/resource-utilization', generateResourcePrediction);

// @route   GET /api/v1/ceo/predictive-analytics/:id
// @desc    Get single prediction
// @access  Private (CEO/Executive)
router.get('/:id', getPrediction);

// @route   PUT /api/v1/ceo/predictive-analytics/:id/actual
// @desc    Update prediction with actual data
// @access  Private (CEO/Executive)
router.put('/:id/actual', updateActualData);

// @route   DELETE /api/v1/ceo/predictive-analytics/:id
// @desc    Delete prediction
// @access  Private (CEO/Executive)
router.delete('/:id', deletePrediction);

module.exports = router;
