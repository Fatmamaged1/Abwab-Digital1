const express = require('express');
const router = express.Router();
const {
  getAllCapacityPlans,
  getCapacityPlan,
  getCapacityPlanByPeriod,
  createCapacityPlan,
  generateCapacityWithAI,
  updateCapacityPlan,
  addResourceAllocation,
  updateResourceAllocation,
  removeResourceAllocation,
  getUtilizationReport,
  getCapacityStatistics,
  getBottleneckAnalysis,
  deleteCapacityPlan
} = require('../../controllers/hr/capacityPlannerController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/hr/capacity-planner
// @desc    Get all capacity plans
// @access  Private
router.get('/', getAllCapacityPlans);

// @route   GET /api/v1/hr/capacity-planner/stats
// @desc    Get capacity statistics
// @access  Private
router.get('/stats', getCapacityStatistics);

// @route   GET /api/v1/hr/capacity-planner/utilization-report
// @desc    Get utilization report
// @access  Private
router.get('/utilization-report', getUtilizationReport);

// @route   POST /api/v1/hr/capacity-planner/generate
// @desc    Generate capacity plan with AI
// @access  Private
router.post('/generate', generateCapacityWithAI);

// @route   GET /api/v1/hr/capacity-planner/period/:startDate/:endDate
// @desc    Get capacity plan by period
// @access  Private
router.get('/period/:startDate/:endDate', getCapacityPlanByPeriod);

// @route   GET /api/v1/hr/capacity-planner/:id
// @desc    Get single capacity plan
// @access  Private
router.get('/:id', getCapacityPlan);

// @route   GET /api/v1/hr/capacity-planner/:id/bottleneck-analysis
// @desc    Get bottleneck analysis
// @access  Private
router.get('/:id/bottleneck-analysis', getBottleneckAnalysis);

// @route   POST /api/v1/hr/capacity-planner
// @desc    Create capacity plan
// @access  Private
router.post('/', createCapacityPlan);

// @route   PUT /api/v1/hr/capacity-planner/:id
// @desc    Update capacity plan
// @access  Private
router.put('/:id', updateCapacityPlan);

// @route   POST /api/v1/hr/capacity-planner/:id/allocations
// @desc    Add resource allocation
// @access  Private
router.post('/:id/allocations', addResourceAllocation);

// @route   PUT /api/v1/hr/capacity-planner/:id/allocations/:allocationId
// @desc    Update resource allocation
// @access  Private
router.put('/:id/allocations/:allocationId', updateResourceAllocation);

// @route   DELETE /api/v1/hr/capacity-planner/:id/allocations/:allocationId
// @desc    Remove resource allocation
// @access  Private
router.delete('/:id/allocations/:allocationId', removeResourceAllocation);

// @route   DELETE /api/v1/hr/capacity-planner/:id
// @desc    Delete capacity plan
// @access  Private
router.delete('/:id', deleteCapacityPlan);

module.exports = router;
