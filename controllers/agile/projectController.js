const asyncHandler = require('express-async-handler');
const Project = require('../../models/agile/projectModel');

// @desc    Get all projects
// @route   GET /api/agile/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    search,
    sortBy = '-updatedAt'
  } = req.query;

  const query = { isDeleted: false };

  // User can only see projects they're part of (unless admin)
  if (req.user.role !== 'admin') {
    query.$or = [
      { lead: req.user._id },
      { 'team.user': req.user._id },
      { createdBy: req.user._id }
    ];
  }

  // Filters
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('lead', 'firstName lastName email avatar')
    .populate('team.user', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Project.countDocuments(query);

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: projects
  });
});

// @desc    Get single project
// @route   GET /api/agile/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('lead', 'firstName lastName email avatar')
    .populate('team.user', 'firstName lastName email avatar role')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Create project
// @route   POST /api/agile/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res) => {
  const projectData = {
    ...req.body,
    createdBy: req.user._id,
    lead: req.body.lead || req.user._id
  };

  // Add creator to team if not already
  if (!projectData.team) {
    projectData.team = [];
  }

  const creatorInTeam = projectData.team.some(
    member => member.user.toString() === req.user._id.toString()
  );

  if (!creatorInTeam) {
    projectData.team.push({
      user: req.user._id,
      role: 'product_owner',
      permissions: {
        canCreateStories: true,
        canEditStories: true,
        canDeleteStories: true,
        canManageSprints: true,
        canManageTeam: true,
        isAdmin: true
      }
    });
  }

  const project = await Project.create(projectData);

  res.status(201).json({
    success: true,
    data: project
  });
});

// @desc    Update project
// @route   PUT /api/agile/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  const isMember = project.team.some(member => member.user.equals(req.user._id));
  const isLead = project.lead.equals(req.user._id);

  if (!isMember && !isLead && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  const updateData = { ...req.body, updatedBy: req.user._id };
  project = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Delete project (soft delete)
// @route   DELETE /api/agile/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only lead or admin can delete
  if (!project.lead.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  project.isDeleted = true;
  project.updatedBy = req.user._id;
  await project.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add team member
// @route   POST /api/agile/projects/:id/team
// @access  Private
exports.addTeamMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  const member = project.team.find(m => m.user.equals(req.user._id));
  if (!member?.permissions.canManageTeam && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to manage team');
  }

  await project.addTeamMember(req.body.userId, req.body.role, req.body.permissions);

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Remove team member
// @route   DELETE /api/agile/projects/:id/team/:userId
// @access  Private
exports.removeTeamMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  const member = project.team.find(m => m.user.equals(req.user._id));
  if (!member?.permissions.canManageTeam && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to manage team');
  }

  await project.removeTeamMember(req.params.userId);

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Update project metrics
// @route   PUT /api/agile/projects/:id/metrics
// @access  Private
exports.updateMetrics = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  await project.updateMetrics();

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Get user projects
// @route   GET /api/agile/projects/my/projects
// @access  Private
exports.getMyProjects = asyncHandler(async (req, res) => {
  const projects = await Project.getUserProjects(req.user._id);

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Archive project
// @route   PUT /api/agile/projects/:id/archive
// @access  Private
exports.archiveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only lead or admin can archive
  if (!project.lead.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to archive this project');
  }

  project.status = 'archived';
  project.archivedAt = new Date();
  project.archivedBy = req.user._id;
  project.updatedBy = req.user._id;
  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Get project statistics
// @route   GET /api/agile/projects/:id/stats
// @access  Private
exports.getProjectStats = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || project.isDeleted) {
    res.status(404);
    throw new Error('Project not found');
  }

  const Sprint = require('../../models/agile/sprintModel');
  const UserStory = require('../../models/agile/userStoryModel');
  const Epic = require('../../models/agile/epicModel');

  const [
    totalSprints,
    activeSprints,
    completedSprints,
    totalStories,
    storiesByStatus,
    totalEpics,
    velocity
  ] = await Promise.all([
    Sprint.countDocuments({ project: project._id, isDeleted: false }),
    Sprint.countDocuments({ project: project._id, status: 'active', isDeleted: false }),
    Sprint.countDocuments({ project: project._id, status: 'completed', isDeleted: false }),
    UserStory.countDocuments({ project: project._id, isDeleted: false }),
    UserStory.aggregate([
      { $match: { project: project._id, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Epic.countDocuments({ project: project._id, isDeleted: false }),
    Sprint.getTeamVelocity(project._id, 5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      sprints: {
        total: totalSprints,
        active: activeSprints,
        completed: completedSprints
      },
      stories: {
        total: totalStories,
        byStatus: storiesByStatus
      },
      epics: {
        total: totalEpics
      },
      velocity: {
        average: velocity
      },
      team: {
        size: project.team.length
      },
      metrics: project.metrics
    }
  });
});

module.exports = exports;
