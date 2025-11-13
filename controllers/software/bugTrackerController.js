const BugTracker = require('../../models/software/bugTrackerModel');
const AIService = require('../../services/aiService');

// @desc    Get all bugs
// @route   GET /api/v1/software/bugs
// @access  Private
exports.getAllBugs = async (req, res) => {
  try {
    const {
      status,
      severity,
      priority,
      project,
      assignedTo,
      category,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isDeleted: false };

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;
    if (category) query.category = category;

    const bugs = await BugTracker.find(query)
      .populate('project', 'name')
      .populate('sprint', 'name')
      .populate('assignedTo', 'name email')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await BugTracker.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bugs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bugs',
      error: error.message
    });
  }
};

// @desc    Get single bug
// @route   GET /api/v1/software/bugs/:id
// @access  Private
exports.getBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id)
      .populate('project', 'name')
      .populate('sprint', 'name startDate endDate')
      .populate('assignedTo', 'name email avatar')
      .populate('reportedBy', 'name email avatar')
      .populate('resolution.resolvedBy', 'name email');

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bug
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bug',
      error: error.message
    });
  }
};

// @desc    Create new bug
// @route   POST /api/v1/software/bugs
// @access  Private
exports.createBug = async (req, res) => {
  try {
    const bugData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const bug = await BugTracker.create(bugData);

    // Use AI to categorize and provide insights
    if (bug.description && bug.description.en) {
      const aiService = new AIService();
      const aiAnalysis = await aiService.categorizeBug({
        title: bug.title.en,
        description: bug.description.en,
        stepsToReproduce: bug.stepsToReproduce,
        environment: bug.environment
      });

      if (aiAnalysis) {
        bug.aiCategorization = {
          predictedSeverity: aiAnalysis.predictedSeverity || bug.severity,
          predictedPriority: aiAnalysis.predictedPriority || bug.priority,
          affectedModules: aiAnalysis.affectedModules || [],
          rootCauseAnalysis: aiAnalysis.rootCauseAnalysis || '',
          estimatedFixTime: aiAnalysis.estimatedFixTime || 0
        };

        // Find similar bugs
        const similarBugs = await BugTracker.find({
          $or: [
            { 'title.en': { $regex: bug.title.en.split(' ').slice(0, 3).join('|'), $options: 'i' } },
            { category: bug.category }
          ],
          _id: { $ne: bug._id },
          isDeleted: false
        }).limit(5);

        bug.aiCategorization.similarBugs = similarBugs.map(b => b._id);

        await bug.save();
      }
    }

    res.status(201).json({
      success: true,
      data: bug,
      message: 'Bug created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bug',
      error: error.message
    });
  }
};

// @desc    Update bug
// @route   PUT /api/v1/software/bugs/:id
// @access  Private
exports.updateBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id);

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        bug[key] = req.body[key];
      }
    });

    await bug.save();

    res.status(200).json({
      success: true,
      data: bug,
      message: 'Bug updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bug',
      error: error.message
    });
  }
};

// @desc    Assign bug
// @route   PUT /api/v1/software/bugs/:id/assign
// @access  Private
exports.assignBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id);

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    bug.assignedTo = req.body.assignedTo;
    bug.status = 'assigned';

    await bug.save();

    res.status(200).json({
      success: true,
      data: bug,
      message: 'Bug assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning bug',
      error: error.message
    });
  }
};

// @desc    Resolve bug
// @route   PUT /api/v1/software/bugs/:id/resolve
// @access  Private
exports.resolveBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id);

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    bug.status = 'resolved';
    bug.resolution = {
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      solution: req.body.solution,
      preventiveMeasures: req.body.preventiveMeasures
    };

    await bug.save();

    res.status(200).json({
      success: true,
      data: bug,
      message: 'Bug resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving bug',
      error: error.message
    });
  }
};

// @desc    Close/verify bug
// @route   PUT /api/v1/software/bugs/:id/close
// @access  Private
exports.closeBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id);

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    if (bug.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Bug must be resolved before closing'
      });
    }

    bug.status = req.body.verified ? 'closed' : 'reopened';

    await bug.save();

    res.status(200).json({
      success: true,
      data: bug,
      message: bug.status === 'closed' ? 'Bug closed successfully' : 'Bug reopened'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing bug',
      error: error.message
    });
  }
};

// @desc    Get bug statistics
// @route   GET /api/v1/software/bugs/stats
// @access  Private
exports.getBugStatistics = async (req, res) => {
  try {
    const { project, sprint, startDate, endDate } = req.query;

    const query = { isDeleted: false };
    if (project) query.project = project;
    if (sprint) query.sprint = sprint;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await BugTracker.aggregate([
      { $match: query },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          slaCompliance: [
            {
              $project: {
                slaCompliant: {
                  $cond: [
                    { $lte: ['$sla.actualResolutionTime', '$sla.expectedResolutionTime'] },
                    1,
                    0
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                compliant: { $sum: '$slaCompliant' },
                total: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bug statistics',
      error: error.message
    });
  }
};

// @desc    Delete bug (soft delete)
// @route   DELETE /api/v1/software/bugs/:id
// @access  Private
exports.deleteBug = async (req, res) => {
  try {
    const bug = await BugTracker.findById(req.params.id);

    if (!bug || bug.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    bug.isDeleted = true;
    bug.deletedAt = new Date();
    bug.deletedBy = req.user._id;

    await bug.save();

    res.status(200).json({
      success: true,
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bug',
      error: error.message
    });
  }
};
