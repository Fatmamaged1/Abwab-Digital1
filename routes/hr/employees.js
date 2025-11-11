const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  addEmployeeNote,
  updateLeaveBalance,
  addPerformanceRating,
  getMyProfile,
  getEmployeesByDepartment,
  getTeamMembers,
} = require('../../controllers/hr/employeeController');

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/stats', getEmployeeStats);
router.get('/me/profile', getMyProfile);
router.get('/department/:departmentId', getEmployeesByDepartment);
router.get('/team/:managerId', getTeamMembers);

// Main CRUD routes
router
  .route('/')
  .get(getEmployees)
  .post(authorize('admin', 'hr', 'manager'), createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(authorize('admin', 'hr', 'manager'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

// Additional routes
router.post('/:id/notes', addEmployeeNote);
router.put(
  '/:id/leave-balance',
  authorize('admin', 'hr'),
  updateLeaveBalance
);
router.post(
  '/:id/performance',
  authorize('admin', 'hr', 'manager'),
  addPerformanceRating
);

module.exports = router;
