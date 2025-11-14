const express = require('express');
const {
  getSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  addBurndownEntry,
  addStandup,
  addReview,
  addRetrospective,
  getActiveSprints,
  getSprintStats,
  getTeamVelocity
} = require('../../controllers/agile/sprintController');

const { protect, authorize } = require('../../middleware/auth');
const {
  createSprintValidator,
  updateSprintValidator,
  idValidator,
} = require('../../validators/agileValidator');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/project/:projectId/active', getActiveSprints);
router.get('/project/:projectId/velocity', getTeamVelocity);

// Main CRUD routes
router.route('/')
  .get(getSprints)
  .post(authorize('admin', 'manager', 'scrum_master', 'product_owner'), createSprintValidator, createSprint);

router.route('/:id')
  .get(idValidator, getSprint)
  .put(authorize('admin', 'manager', 'scrum_master'), updateSprintValidator, updateSprint)
  .delete(authorize('admin', 'manager'), idValidator, deleteSprint);

// Sprint lifecycle
router.put('/:id/start', authorize('admin', 'manager', 'scrum_master'), startSprint);
router.put('/:id/complete', authorize('admin', 'manager', 'scrum_master'), completeSprint);

// Sprint activities
router.post('/:id/burndown', addBurndownEntry);
router.post('/:id/standups', addStandup);
router.post('/:id/review', addReview);
router.post('/:id/retrospective', addRetrospective);

// Stats
router.get('/:id/stats', getSprintStats);

module.exports = router;
