const asyncHandler = require('express-async-handler');
const UserStory = require('../../models/agile/userStoryModel');
const Sprint = require('../../models/agile/sprintModel');

// @desc    Get all user stories
// @route   GET /api/agile/stories
// @access  Private
exports.getUserStories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    project,
    sprint,
    epic,
    status,
    priority,
    assignedTo,
    type,
    search,
    sortBy = '-createdAt'
  } = req.query;

  const query = { isDeleted: false };

  if (project) query.project = project;
  if (sprint) query.sprint = sprint === 'null' ? null : sprint;
  if (epic) query.epic = epic;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (type) query.type = type;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const stories = await UserStory.find(query)
    .populate('project', 'name code')
    .populate('sprint', 'name sprintNumber')
    .populate('epic', 'name')
    .populate('assignedTo', 'firstName lastName email avatar')
    .populate('reporter', 'firstName lastName email avatar')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await UserStory.countDocuments(query);

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: stories
  });
});

// @desc    Get single user story
// @route   GET /api/agile/stories/:id
// @access  Private
exports.getUserStory = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id)
    .populate('project', 'name code')
    .populate('sprint', 'name sprintNumber status')
    .populate('epic', 'name status')
    .populate('assignedTo', 'firstName lastName email avatar')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email')
    .populate('dependencies.story', 'storyNumber title status')
    .populate('blockers.raisedBy', 'firstName lastName')
    .populate('blockers.resolvedBy', 'firstName lastName')
    .populate('comments.user', 'firstName lastName email avatar')
    .populate('timeTracking.user', 'firstName lastName')
    .populate({
      path: 'tasks',
      populate: {
        path: 'assignedTo',
        select: 'firstName lastName email avatar'
      }
    });

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Create user story
// @route   POST /api/agile/stories
// @access  Private
exports.createUserStory = asyncHandler(async (req, res) => {
  // Generate story number
  const storyNumber = await UserStory.generateStoryNumber(req.body.project);

  const storyData = {
    ...req.body,
    storyNumber,
    reporter: req.body.reporter || req.user._id,
    createdBy: req.user._id
  };

  const story = await UserStory.create(storyData);

  // Update sprint metrics if assigned to sprint
  if (story.sprint) {
    const sprint = await Sprint.findById(story.sprint);
    if (sprint) {
      sprint.storyPoints.committed += story.storyPoints || 0;
      sprint.metrics.totalStories += 1;
      await sprint.save();
    }
  }

  res.status(201).json({
    success: true,
    data: story
  });
});

// @desc    Update user story
// @route   PUT /api/agile/stories/:id
// @access  Private
exports.updateUserStory = asyncHandler(async (req, res) => {
  let story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  // Track changes for activity log
  const changes = [];
  Object.keys(req.body).forEach(key => {
    if (story[key] !== req.body[key]) {
      changes.push({
        field: key,
        oldValue: story[key]?.toString(),
        newValue: req.body[key]?.toString()
      });
    }
  });

  const oldSprint = story.sprint;
  const oldStatus = story.status;
  const oldPoints = story.storyPoints;

  const updateData = { ...req.body, updatedBy: req.user._id };
  story = await UserStory.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  // Log activity
  if (changes.length > 0) {
    for (const change of changes) {
      await story.logActivity(
        req.user._id,
        `updated ${change.field}`,
        change.field,
        change.oldValue,
        change.newValue
      );
    }
  }

  // Update sprint metrics
  if (oldSprint && !story.sprint?.equals(oldSprint)) {
    // Removed from sprint
    const sprint = await Sprint.findById(oldSprint);
    if (sprint) {
      sprint.storyPoints.committed -= oldPoints || 0;
      sprint.metrics.totalStories -= 1;
      if (oldStatus === 'done') {
        sprint.storyPoints.completed -= oldPoints || 0;
        sprint.metrics.completedStories -= 1;
      }
      await sprint.save();
    }
  }

  if (story.sprint && !story.sprint.equals(oldSprint)) {
    // Added to sprint
    const sprint = await Sprint.findById(story.sprint);
    if (sprint) {
      sprint.storyPoints.committed += story.storyPoints || 0;
      sprint.metrics.totalStories += 1;
      if (story.status === 'done') {
        sprint.storyPoints.completed += story.storyPoints || 0;
        sprint.metrics.completedStories += 1;
      }
      await sprint.save();
    }
  }

  // Update sprint completion metrics
  if (story.sprint && oldStatus !== story.status) {
    const sprint = await Sprint.findById(story.sprint);
    if (sprint) {
      if (story.status === 'done' && oldStatus !== 'done') {
        sprint.storyPoints.completed += story.storyPoints || 0;
        sprint.metrics.completedStories += 1;
      } else if (oldStatus === 'done' && story.status !== 'done') {
        sprint.storyPoints.completed -= story.storyPoints || 0;
        sprint.metrics.completedStories -= 1;
      }
      await sprint.save();
    }
  }

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Delete user story
// @route   DELETE /api/agile/stories/:id
// @access  Private
exports.deleteUserStory = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  story.isDeleted = true;
  story.updatedBy = req.user._id;
  await story.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add comment
// @route   POST /api/agile/stories/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  await story.addComment(req.user._id, req.body.text);

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Log time
// @route   POST /api/agile/stories/:id/time
// @access  Private
exports.logTime = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  story.timeTracking.push({
    user: req.user._id,
    hours: req.body.hours,
    date: req.body.date || new Date(),
    description: req.body.description
  });

  await story.save();

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Add blocker
// @route   POST /api/agile/stories/:id/blockers
// @access  Private
exports.addBlocker = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  await story.addBlocker(req.user._id, req.body.description);

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Resolve blocker
// @route   PUT /api/agile/stories/:id/blockers/:blockerId/resolve
// @access  Private
exports.resolveBlocker = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  await story.resolveBlocker(req.params.blockerId, req.user._id, req.body.resolution);

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Update acceptance criteria
// @route   PUT /api/agile/stories/:id/acceptance-criteria/:criteriaId
// @access  Private
exports.updateAcceptanceCriteria = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  const criteria = story.acceptanceCriteria.id(req.params.criteriaId);
  if (!criteria) {
    res.status(404);
    throw new Error('Acceptance criteria not found');
  }

  criteria.completed = req.body.completed;
  if (req.body.completed) {
    criteria.completedBy = req.user._id;
    criteria.completedAt = new Date();
  }

  await story.save();

  res.status(200).json({
    success: true,
    data: story
  });
});

// @desc    Get backlog
// @route   GET /api/agile/stories/project/:projectId/backlog
// @access  Private
exports.getBacklog = asyncHandler(async (req, res) => {
  const stories = await UserStory.getBacklog(req.params.projectId);

  res.status(200).json({
    success: true,
    count: stories.length,
    data: stories
  });
});

// @desc    Get sprint stories
// @route   GET /api/agile/stories/sprint/:sprintId/stories
// @access  Private
exports.getSprintStories = asyncHandler(async (req, res) => {
  const stories = await UserStory.getSprintStories(req.params.sprintId);

  res.status(200).json({
    success: true,
    count: stories.length,
    data: stories
  });
});

// @desc    Move to sprint
// @route   PUT /api/agile/stories/:id/move-to-sprint
// @access  Private
exports.moveToSprint = asyncHandler(async (req, res) => {
  const story = await UserStory.findById(req.params.id);

  if (!story || story.isDeleted) {
    res.status(404);
    throw new Error('User story not found');
  }

  const oldSprint = story.sprint;
  story.sprint = req.body.sprintId || null;
  story.updatedBy = req.user._id;
  await story.save();

  // Update sprint metrics
  if (oldSprint) {
    const sprint = await Sprint.findById(oldSprint);
    if (sprint) {
      sprint.storyPoints.committed -= story.storyPoints || 0;
      sprint.metrics.totalStories -= 1;
      if (story.status === 'done') {
        sprint.storyPoints.completed -= story.storyPoints || 0;
        sprint.metrics.completedStories -= 1;
      }
      await sprint.save();
    }
  }

  if (story.sprint) {
    const sprint = await Sprint.findById(story.sprint);
    if (sprint) {
      sprint.storyPoints.committed += story.storyPoints || 0;
      sprint.metrics.totalStories += 1;
      if (story.status === 'done') {
        sprint.storyPoints.completed += story.storyPoints || 0;
        sprint.metrics.completedStories += 1;
      }
      await sprint.save();
    }
  }

  res.status(200).json({
    success: true,
    data: story
  });
});

module.exports = exports;
