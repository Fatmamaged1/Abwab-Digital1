const asyncHandler = require('express-async-handler');
const Task = require('../../models/agile/taskModel');

// @desc    Get all tasks
// @route   GET /api/agile/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res) => {
  const { userStory, project, assignedTo, status } = req.query;
  const query = { isDeleted: false };

  if (userStory) query.userStory = userStory;
  if (project) query.project = project;
  if (assignedTo) query.assignedTo = assignedTo;
  if (status) query.status = status;

  const tasks = await Task.find(query)
    .populate('userStory', 'title storyNumber')
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Create task
// @route   POST /api/agile/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res) => {
  const UserStory = require('../../models/agile/userStoryModel');
  const story = await UserStory.findById(req.body.userStory);

  const lastTask = await Task.findOne({ userStory: req.body.userStory }).sort({ createdAt: -1 });
  let number = 1;
  if (lastTask && lastTask.taskNumber) {
    const match = lastTask.taskNumber.match(/\d+$/);
    if (match) number = parseInt(match[0]) + 1;
  }

  const taskData = {
    ...req.body,
    taskNumber: `${story.storyNumber}-T${number}`,
    createdBy: req.user._id
  };

  const task = await Task.create(taskData);

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/agile/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task || task.isDeleted) {
    res.status(404);
    throw new Error('Task not found');
  }

  task = await Task.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/agile/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task || task.isDeleted) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.isDeleted = true;
  await task.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = exports;
