const express = require('express');
const {
  getUserStories,
  getUserStory,
  createUserStory,
  updateUserStory,
  deleteUserStory,
  addComment,
  logTime,
  addBlocker,
  resolveBlocker,
  updateAcceptanceCriteria,
  getBacklog,
  getSprintStories,
  moveToSprint
} = require('../../controllers/agile/userStoryController');

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (before /:id)
router.get('/project/:projectId/backlog', getBacklog);
router.get('/sprint/:sprintId/stories', getSprintStories);

// Main CRUD routes
router.route('/')
  .get(getUserStories)
  .post(createUserStory);

router.route('/:id')
  .get(getUserStory)
  .put(updateUserStory)
  .delete(authorize('admin', 'manager', 'product_owner'), deleteUserStory);

// Comments
router.post('/:id/comments', addComment);

// Time tracking
router.post('/:id/time', logTime);

// Blockers
router.post('/:id/blockers', addBlocker);
router.put('/:id/blockers/:blockerId/resolve', resolveBlocker);

// Acceptance criteria
router.put('/:id/acceptance-criteria/:criteriaId', updateAcceptanceCriteria);

// Sprint management
router.put('/:id/move-to-sprint', moveToSprint);

module.exports = router;
