const express = require('express');
const {
  getLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getMyLeaves,
  getLeaveBalance,
  getMyLeaveBalance,
  getTeamLeaveCalendar,
  getLeaveStats,
  getPendingLeaveRequests,
} = require('../../controllers/hr/leaveController');

const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/my/leaves', getMyLeaves);
router.get('/my/balance', getMyLeaveBalance);
router.get('/team/calendar', getTeamLeaveCalendar);
router.get('/pending/requests', getPendingLeaveRequests);
router.get('/balance/:employeeId/:leaveType/:year', getLeaveBalance);
router.get('/stats/:employeeId/:year', getLeaveStats);

// Main CRUD routes
router.route('/').get(getLeaves).post(createLeave);

router.route('/:id').get(getLeave).put(updateLeave).delete(deleteLeave);

// Approval routes
router.put(
  '/:id/approve',
  authorize('admin', 'hr', 'manager'),
  approveLeave
);
router.put('/:id/reject', authorize('admin', 'hr', 'manager'), rejectLeave);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
