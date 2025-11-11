const asyncHandler = require('express-async-handler');
const Sprint = require('../../models/agile/sprintModel');
const UserStory = require('../../models/agile/userStoryModel');

// @desc    Get all sprints
// @route   GET /api/agile/sprints
// @access  Private
exports.getSprints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    project,
    status,
    sortBy = '-startDate'
  } = req.query;

  const query = { isDeleted: false };

  if (project) query.project = project;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const sprints = await Sprint.find(query)
    .populate('project', 'name code')
    .populate('team.user', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Sprint.countDocuments(query);

  res.status(200).json({
    success: true,
    count: sprints.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: sprints
  });
});

// @desc    Get single sprint
// @route   GET /api/agile/sprints/:id
// @access  Private
exports.getSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id)
    .populate('project', 'name code')
    .populate('team.user', 'firstName lastName email avatar role')
    .populate('createdBy', 'firstName lastName email')
    .populate({
      path: 'userStories',
      populate: {
        path: 'assignedTo',
        select: 'firstName lastName email avatar'
      }
    });

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Create sprint
// @route   POST /api/agile/sprints
// @access  Private
exports.createSprint = asyncHandler(async (req, res) => {
  const sprintData = {
    ...req.body,
    createdBy: req.user._id
  };

  // Auto-generate sprint number
  const lastSprint = await Sprint.findOne({ project: req.body.project })
    .sort({ sprintNumber: -1 });

  sprintData.sprintNumber = lastSprint ? lastSprint.sprintNumber + 1 : 1;

  const sprint = await Sprint.create(sprintData);

  res.status(201).json({
    success: true,
    data: sprint
  });
});

// @desc    Update sprint
// @route   PUT /api/agile/sprints/:id
// @access  Private
exports.updateSprint = asyncHandler(async (req, res) => {
  let sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  const updateData = { ...req.body, updatedBy: req.user._id };
  sprint = await Sprint.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Delete sprint
// @route   DELETE /api/agile/sprints/:id
// @access  Private
exports.deleteSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  sprint.isDeleted = true;
  sprint.updatedBy = req.user._id;
  await sprint.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Start sprint
// @route   PUT /api/agile/sprints/:id/start
// @access  Private
exports.startSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  if (sprint.status !== 'planning') {
    res.status(400);
    throw new Error('Sprint must be in planning status to start');
  }

  await sprint.startSprint();

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Complete sprint
// @route   PUT /api/agile/sprints/:id/complete
// @access  Private
exports.completeSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  if (sprint.status !== 'active') {
    res.status(400);
    throw new Error('Only active sprints can be completed');
  }

  await sprint.completeSprint();

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Add burndown entry
// @route   POST /api/agile/sprints/:id/burndown
// @access  Private
exports.addBurndownEntry = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  const { remainingPoints, completedPoints } = req.body;
  await sprint.addBurndownEntry(remainingPoints, completedPoints);

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Add daily standup
// @route   POST /api/agile/sprints/:id/standups
// @access  Private
exports.addStandup = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  sprint.standups.push({
    date: req.body.date || new Date(),
    attendees: req.body.attendees,
    notes: req.body.notes,
    blockers: req.body.blockers,
    achievements: req.body.achievements
  });

  await sprint.save();

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Add sprint review
// @route   POST /api/agile/sprints/:id/review
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  sprint.review = {
    date: req.body.date || new Date(),
    attendees: req.body.attendees,
    demoCompleted: req.body.demoCompleted,
    stakeholderFeedback: req.body.stakeholderFeedback,
    successMetrics: req.body.successMetrics
  };

  await sprint.save();

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Add retrospective
// @route   POST /api/agile/sprints/:id/retrospective
// @access  Private
exports.addRetrospective = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  sprint.retrospective = {
    date: req.body.date || new Date(),
    attendees: req.body.attendees,
    whatWentWell: req.body.whatWentWell,
    whatDidntGoWell: req.body.whatDidntGoWell,
    actionItems: req.body.actionItems
  };

  await sprint.save();

  res.status(200).json({
    success: true,
    data: sprint
  });
});

// @desc    Get active sprints for project
// @route   GET /api/agile/sprints/project/:projectId/active
// @access  Private
exports.getActiveSprints = asyncHandler(async (req, res) => {
  const sprints = await Sprint.getActiveSprints(req.params.projectId);

  res.status(200).json({
    success: true,
    count: sprints.length,
    data: sprints
  });
});

// @desc    Get sprint statistics
// @route   GET /api/agile/sprints/:id/stats
// @access  Private
exports.getSprintStats = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint || sprint.isDeleted) {
    res.status(404);
    throw new Error('Sprint not found');
  }

  const stories = await UserStory.find({
    sprint: sprint._id,
    isDeleted: false
  });

  const stats = {
    totalStories: stories.length,
    completedStories: stories.filter(s => s.status === 'done').length,
    inProgressStories: stories.filter(s => s.status === 'in_progress').length,
    blockedStories: stories.filter(s => s.status === 'blocked').length,
    totalPoints: stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0),
    completedPoints: stories
      .filter(s => s.status === 'done')
      .reduce((sum, s) => sum + (s.storyPoints || 0), 0),
    progress: sprint.progress,
    velocity: sprint.velocity,
    capacity: sprint.capacity,
    daysElapsed: sprint.daysElapsed,
    daysRemaining: sprint.daysRemaining,
    burndown: sprint.burndown
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get team velocity
// @route   GET /api/agile/sprints/project/:projectId/velocity
// @access  Private
exports.getTeamVelocity = asyncHandler(async (req, res) => {
  const { numberOfSprints = 5 } = req.query;

  const velocity = await Sprint.getTeamVelocity(
    req.params.projectId,
    parseInt(numberOfSprints)
  );

  res.status(200).json({
    success: true,
    data: {
      averageVelocity: velocity,
      numberOfSprints: parseInt(numberOfSprints)
    }
  });
});

module.exports = exports;
