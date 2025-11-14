const express = require('express');
const {
  getAttendances,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getMyMonthlyAttendance,
  getAttendanceStats,
  getMyTodayAttendance,
  getTeamAttendanceToday,
} = require('../../controllers/hr/attendanceController');

const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-start', startBreak);
router.post('/break-end', endBreak);
router.get('/my/today', getMyTodayAttendance);
router.get('/my/month/:year/:month', getMyMonthlyAttendance);
router.get('/team/today', getTeamAttendanceToday);
router.get('/stats/:employeeId', getAttendanceStats);

// Main CRUD routes
router
  .route('/')
  .get(getAttendances)
  .post(authorize('admin', 'hr', 'manager'), createAttendance);

router
  .route('/:id')
  .get(getAttendance)
  .put(authorize('admin', 'hr', 'manager'), updateAttendance)
  .delete(authorize('admin', 'hr'), deleteAttendance);

module.exports = router;
