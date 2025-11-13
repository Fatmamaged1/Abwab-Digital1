const express = require('express');
const router = express.Router();
const {
  getAllProjectBilling,
  getProjectBillingByProject,
  createProjectBilling,
  updateProjectBilling,
  addMilestone,
  createMilestoneInvoice,
  updateMilestoneStatus,
  updateTimeTracking,
  addExpense,
  getProjectBillingSummary,
  deleteProjectBilling
} = require('../../controllers/accounting/projectBillingController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/accounting/project-billing
// @desc    Get all project billing records
// @access  Private
router.get('/', getAllProjectBilling);

// @route   GET /api/v1/accounting/project-billing/project/:projectId
// @desc    Get project billing by project ID
// @access  Private
router.get('/project/:projectId', getProjectBillingByProject);

// @route   GET /api/v1/accounting/project-billing/:id/summary
// @desc    Get project billing summary
// @access  Private
router.get('/:id/summary', getProjectBillingSummary);

// @route   POST /api/v1/accounting/project-billing
// @desc    Create project billing
// @access  Private
router.post('/', createProjectBilling);

// @route   PUT /api/v1/accounting/project-billing/:id
// @desc    Update project billing
// @access  Private
router.put('/:id', updateProjectBilling);

// @route   POST /api/v1/accounting/project-billing/:id/milestones
// @desc    Add milestone to project billing
// @access  Private
router.post('/:id/milestones', addMilestone);

// @route   POST /api/v1/accounting/project-billing/:id/milestones/:milestoneId/invoice
// @desc    Create invoice for milestone
// @access  Private
router.post('/:id/milestones/:milestoneId/invoice', createMilestoneInvoice);

// @route   PUT /api/v1/accounting/project-billing/:id/milestones/:milestoneId/status
// @desc    Update milestone status
// @access  Private
router.put('/:id/milestones/:milestoneId/status', updateMilestoneStatus);

// @route   PUT /api/v1/accounting/project-billing/:id/time-tracking
// @desc    Update time tracking
// @access  Private
router.put('/:id/time-tracking', updateTimeTracking);

// @route   POST /api/v1/accounting/project-billing/:id/expenses
// @desc    Add expense to project billing
// @access  Private
router.post('/:id/expenses', addExpense);

// @route   DELETE /api/v1/accounting/project-billing/:id
// @desc    Delete project billing
// @access  Private
router.delete('/:id', deleteProjectBilling);

module.exports = router;
