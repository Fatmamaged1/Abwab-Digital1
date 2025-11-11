const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
} = require('../../controllers/hr/departmentController');

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/stats', getDepartmentStats);

// Main CRUD routes
router
  .route('/')
  .get(getDepartments)
  .post(authorize('admin', 'hr'), createDepartment);

router
  .route('/:id')
  .get(getDepartment)
  .put(authorize('admin', 'hr'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

module.exports = router;
