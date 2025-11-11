const asyncHandler = require('express-async-handler');
const Epic = require('../../models/agile/epicModel');
const UserStory = require('../../models/agile/userStoryModel');

// @desc    Get all epics
// @route   GET /api/agile/epics
// @access  Private
exports.getEpics = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, project, status } = req.query;
  const query = { isDeleted: false };

  if (project) query.project = project;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const epics = await Epic.find(query)
    .populate('project', 'name code')
    .populate('owner', 'firstName lastName email')
    .populate('userStories')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Epic.countDocuments(query);

  res.status(200).json({
    success: true,
    count: epics.length,
    total,
    data: epics
  });
});

// @desc    Get single epic
// @route   GET /api/agile/epics/:id
// @access  Private
exports.getEpic = asyncHandler(async (req, res) => {
  const epic = await Epic.findById(req.params.id)
    .populate('project', 'name code')
    .populate('owner', 'firstName lastName email avatar')
    .populate('stakeholders.user', 'firstName lastName email')
    .populate({
      path: 'userStories',
      populate: { path: 'assignedTo', select: 'firstName lastName' }
    });

  if (!epic || epic.isDeleted) {
    res.status(404);
    throw new Error('Epic not found');
  }

  res.status(200).json({
    success: true,
    data: epic
  });
});

// @desc    Create epic
// @route   POST /api/agile/epics
// @access  Private
exports.createEpic = asyncHandler(async (req, res) => {
  const Project = require('../../models/agile/projectModel');
  const project = await Project.findById(req.body.project);
  const prefix = project?.code || 'EPIC';

  const lastEpic = await Epic.findOne({ project: req.body.project }).sort({ createdAt: -1 });
  let number = 1;
  if (lastEpic && lastEpic.epicNumber) {
    const match = lastEpic.epicNumber.match(/\d+$/);
    if (match) number = parseInt(match[0]) + 1;
  }

  const epicData = {
    ...req.body,
    epicNumber: `${prefix}-EPIC-${number}`,
    owner: req.body.owner || req.user._id,
    createdBy: req.user._id
  };

  const epic = await Epic.create(epicData);

  res.status(201).json({
    success: true,
    data: epic
  });
});

// @desc    Update epic
// @route   PUT /api/agile/epics/:id
// @access  Private
exports.updateEpic = asyncHandler(async (req, res) => {
  let epic = await Epic.findById(req.params.id);

  if (!epic || epic.isDeleted) {
    res.status(404);
    throw new Error('Epic not found');
  }

  epic = await Epic.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: epic
  });
});

// @desc    Delete epic
// @route   DELETE /api/agile/epics/:id
// @access  Private
exports.deleteEpic = asyncHandler(async (req, res) => {
  const epic = await Epic.findById(req.params.id);

  if (!epic || epic.isDeleted) {
    res.status(404);
    throw new Error('Epic not found');
  }

  epic.isDeleted = true;
  await epic.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update epic progress
// @route   PUT /api/agile/epics/:id/progress
// @access  Private
exports.updateProgress = asyncHandler(async (req, res) => {
  const epic = await Epic.findById(req.params.id);

  if (!epic || epic.isDeleted) {
    res.status(404);
    throw new Error('Epic not found');
  }

  const stories = await UserStory.find({ epic: epic._id, isDeleted: false });

  epic.progress.totalStories = stories.length;
  epic.progress.completedStories = stories.filter(s => s.status === 'done').length;
  epic.progress.totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
  epic.progress.completedPoints = stories
    .filter(s => s.status === 'done')
    .reduce((sum, s) => sum + (s.storyPoints || 0), 0);

  await epic.save();

  res.status(200).json({
    success: true,
    data: epic
  });
});

module.exports = exports;
