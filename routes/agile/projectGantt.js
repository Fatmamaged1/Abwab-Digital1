const express = require('express');
const router = express.Router();
const {
  getProjectGantt,
  createOrUpdateGantt,
  addTaskToGantt,
  updateTaskInGantt,
  deleteTaskFromGantt,
  addMilestoneToGantt,
  updateMilestoneInGantt,
  deleteMilestoneFromGantt,
  addDependency,
  removeDependency,
  getCriticalPath,
  getBottleneckPredictions,
  updateTaskProgress,
  getGanttSummary,
  exportGanttChart
} = require('../../controllers/agile/projectGanttController');

// Protect routes with authentication middleware
const { protect } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/v1/agile/gantt/project/:projectId
// @desc    Get Gantt chart by project ID
// @access  Private
router.get('/project/:projectId', getProjectGantt);

// @route   POST /api/v1/agile/gantt
// @route   PUT /api/v1/agile/gantt/:id
// @desc    Create or update Gantt chart
// @access  Private
router.route('/')
  .post(createOrUpdateGantt);

router.route('/:id')
  .put(createOrUpdateGantt);

// @route   POST /api/v1/agile/gantt/:id/tasks
// @desc    Add task to Gantt chart
// @access  Private
router.post('/:id/tasks', addTaskToGantt);

// @route   PUT /api/v1/agile/gantt/:id/tasks/:taskId
// @desc    Update task in Gantt chart
// @access  Private
router.put('/:id/tasks/:taskId', updateTaskInGantt);

// @route   DELETE /api/v1/agile/gantt/:id/tasks/:taskId
// @desc    Delete task from Gantt chart
// @access  Private
router.delete('/:id/tasks/:taskId', deleteTaskFromGantt);

// @route   POST /api/v1/agile/gantt/:id/milestones
// @desc    Add milestone to Gantt chart
// @access  Private
router.post('/:id/milestones', addMilestoneToGantt);

// @route   PUT /api/v1/agile/gantt/:id/milestones/:milestoneId
// @desc    Update milestone in Gantt chart
// @access  Private
router.put('/:id/milestones/:milestoneId', updateMilestoneInGantt);

// @route   DELETE /api/v1/agile/gantt/:id/milestones/:milestoneId
// @desc    Delete milestone from Gantt chart
// @access  Private
router.delete('/:id/milestones/:milestoneId', deleteMilestoneFromGantt);

// @route   POST /api/v1/agile/gantt/:id/dependencies
// @desc    Add dependency between tasks
// @access  Private
router.post('/:id/dependencies', addDependency);

// @route   DELETE /api/v1/agile/gantt/:id/dependencies
// @desc    Remove dependency between tasks
// @access  Private
router.delete('/:id/dependencies', removeDependency);

// @route   GET /api/v1/agile/gantt/:id/critical-path
// @desc    Calculate and get critical path
// @access  Private
router.get('/:id/critical-path', getCriticalPath);

// @route   GET /api/v1/agile/gantt/:id/bottleneck-predictions
// @desc    Get AI-powered bottleneck predictions
// @access  Private
router.get('/:id/bottleneck-predictions', getBottleneckPredictions);

// @route   PUT /api/v1/agile/gantt/:id/tasks/:taskId/progress
// @desc    Update task progress
// @access  Private
router.put('/:id/tasks/:taskId/progress', updateTaskProgress);

// @route   GET /api/v1/agile/gantt/:id/summary
// @desc    Get Gantt chart summary
// @access  Private
router.get('/:id/summary', getGanttSummary);

// @route   GET /api/v1/agile/gantt/:id/export
// @desc    Export Gantt chart data
// @access  Private
router.get('/:id/export', exportGanttChart);

module.exports = router;
