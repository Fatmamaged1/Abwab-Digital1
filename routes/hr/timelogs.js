const express = require('express');
const {
  getTimeLogs,
  getTimeLog,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  startTimer,
  stopTimer,
  submitTimeLog,
  approveTimeLog,
  rejectTimeLog,
  getMyTimeLogs,
  getActiveTimer,
  getProjectTimeStats,
  getEmployeeTimeStats,
  getMyWeeklyReport,
} = require('../../controllers/hr/timeLogController');

const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.post('/start', startTimer);
router.get('/my/logs', getMyTimeLogs);
router.get('/my/active', getActiveTimer);
router.get('/my/weekly', getMyWeeklyReport);
router.get('/project/:projectId/stats', getProjectTimeStats);
router.get('/employee/:employeeId/stats', getEmployeeTimeStats);

// Main CRUD routes
router.route('/').get(getTimeLogs).post(createTimeLog);

router.route('/:id').get(getTimeLog).put(updateTimeLog).delete(deleteTimeLog);

// Timer and approval routes
router.put('/:id/stop', stopTimer);
router.put('/:id/submit', submitTimeLog);
router.put('/:id/approve', authorize('admin', 'hr', 'manager'), approveTimeLog);
router.put('/:id/reject', authorize('admin', 'hr', 'manager'), rejectTimeLog);

module.exports = router;
