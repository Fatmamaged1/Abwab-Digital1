const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../../controllers/agile/taskController');

const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Main CRUD routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
