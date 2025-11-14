const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../../controllers/agile/taskController');

const { protect } = require('../../middleware/auth');
const {
  createTaskValidator,
  updateTaskValidator,
  idValidator,
} = require('../../validators/agileValidator');

const router = express.Router();

// Protect all routes
router.use(protect);

// Main CRUD routes
router.route('/')
  .get(getTasks)
  .post(createTaskValidator, createTask);

router.route('/:id')
  .put(updateTaskValidator, updateTask)
  .delete(idValidator, deleteTask);

module.exports = router;
