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

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/my/projects', getMyProjects);

// Main CRUD routes
router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager', 'product_owner'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin', 'manager', 'product_owner'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

// Team management
router.post('/:id/team', authorize('admin', 'manager', 'product_owner'), addTeamMember);
router.delete('/:id/team/:userId', authorize('admin', 'manager', 'product_owner'), removeTeamMember);

// Metrics & stats
router.put('/:id/metrics', updateMetrics);
router.get('/:id/stats', getProjectStats);

// Archive
router.put('/:id/archive', authorize('admin', 'manager', 'product_owner'), archiveProject);

module.exports = router;
