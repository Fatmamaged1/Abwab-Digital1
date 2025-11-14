const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
  updateMetrics,
  getMyProjects,
  archiveProject,
  getProjectStats
} = require('../../controllers/agile/projectController');

const { protect, authorize } = require('../../middleware/auth');
const {
  createProjectValidator,
  updateProjectValidator,
  getProjectValidator,
  deleteProjectValidator,
} = require('../../validators/agileValidator');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/my/projects', getMyProjects);

// Main CRUD routes
router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager', 'product_owner'), createProjectValidator, createProject);

router.route('/:id')
  .get(getProjectValidator, getProject)
  .put(authorize('admin', 'manager', 'product_owner'), updateProjectValidator, updateProject)
  .delete(authorize('admin', 'manager'), deleteProjectValidator, deleteProject);

// Team management
router.post('/:id/team', authorize('admin', 'manager', 'product_owner'), addTeamMember);
router.delete('/:id/team/:userId', authorize('admin', 'manager', 'product_owner'), removeTeamMember);

// Metrics & stats
router.put('/:id/metrics', updateMetrics);
router.get('/:id/stats', getProjectStats);

// Archive
router.put('/:id/archive', authorize('admin', 'manager', 'product_owner'), archiveProject);

module.exports = router;
