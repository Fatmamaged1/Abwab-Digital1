const ProjectGantt = require('../../models/agile/projectGanttModel');
const AIService = require('../../services/aiService');

// @desc    Get Gantt chart for a project
// @route   GET /api/v1/agile/projects/:projectId/gantt
// @access  Private
exports.getProjectGantt = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId })
      .populate('project', 'name')
      .populate('tasks.taskId', 'title status priority')
      .populate('tasks.assignees', 'name email');

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found for this project'
      });
    }

    res.status(200).json({
      success: true,
      data: gantt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Gantt chart',
      error: error.message
    });
  }
};

// @desc    Create or update Gantt chart
// @route   POST /api/v1/agile/projects/:projectId/gantt
// @access  Private
exports.createOrUpdateGantt = async (req, res) => {
  try {
    const { tasks, milestones, baseline, workingDays } = req.body;

    let gantt = await ProjectGantt.findOne({ project: req.params.projectId });

    if (gantt) {
      // Update existing
      gantt.tasks = tasks || gantt.tasks;
      gantt.milestones = milestones || gantt.milestones;
      gantt.baseline = baseline || gantt.baseline;
      gantt.workingDays = workingDays || gantt.workingDays;
      gantt.lastUpdated = Date.now();

      await gantt.save();
    } else {
      // Create new
      gantt = await ProjectGantt.create({
        project: req.params.projectId,
        tasks: tasks || [],
        milestones: milestones || [],
        baseline,
        workingDays
      });
    }

    // Calculate critical path
    await gantt.calculateCriticalPath();

    res.status(200).json({
      success: true,
      data: gantt,
      message: gantt.isNew ? 'Gantt chart created successfully' : 'Gantt chart updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating/updating Gantt chart',
      error: error.message
    });
  }
};

// @desc    Add task to Gantt chart
// @route   POST /api/v1/agile/projects/:projectId/gantt/tasks
// @access  Private
exports.addTaskToGantt = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId });

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    const newTask = {
      taskId: req.body.taskId,
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      duration: req.body.duration,
      progress: req.body.progress || 0,
      dependencies: req.body.dependencies || [],
      assignees: req.body.assignees || [],
      status: req.body.status || 'pending'
    };

    gantt.tasks.push(newTask);
    gantt.lastUpdated = Date.now();

    await gantt.save();
    await gantt.calculateCriticalPath();

    res.status(200).json({
      success: true,
      data: gantt,
      message: 'Task added to Gantt chart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding task to Gantt chart',
      error: error.message
    });
  }
};

// @desc    Update task in Gantt chart
// @route   PUT /api/v1/agile/projects/:projectId/gantt/tasks/:taskId
// @access  Private
exports.updateGanttTask = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId });

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    const taskIndex = gantt.tasks.findIndex(
      t => t.taskId.toString() === req.params.taskId
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in Gantt chart'
      });
    }

    // Update task fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        gantt.tasks[taskIndex][key] = req.body[key];
      }
    });

    gantt.lastUpdated = Date.now();
    await gantt.save();
    await gantt.calculateCriticalPath();

    res.status(200).json({
      success: true,
      data: gantt,
      message: 'Gantt task updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating Gantt task',
      error: error.message
    });
  }
};

// @desc    Get critical path
// @route   GET /api/v1/agile/projects/:projectId/gantt/critical-path
// @access  Private
exports.getCriticalPath = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId })
      .populate('tasks.taskId', 'title status priority');

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    await gantt.calculateCriticalPath();

    const criticalTasks = gantt.tasks.filter(task => task.criticalPath);

    res.status(200).json({
      success: true,
      data: {
        criticalTasks,
        totalCriticalDuration: criticalTasks.reduce((sum, task) => sum + task.duration, 0),
        criticalTaskCount: criticalTasks.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating critical path',
      error: error.message
    });
  }
};

// @desc    Get AI bottleneck predictions
// @route   GET /api/v1/agile/projects/:projectId/gantt/predictions
// @access  Private
exports.getBottleneckPredictions = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId })
      .populate('project')
      .populate('tasks.taskId')
      .populate('tasks.assignees');

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    // Use AI service to predict bottlenecks
    const aiService = new AIService();
    const predictions = await aiService.predictProjectRisks({
      tasks: gantt.tasks,
      milestones: gantt.milestones,
      criticalPath: gantt.tasks.filter(t => t.criticalPath)
    });

    // Update AI predictions
    gantt.aiPredictions = {
      bottlenecks: predictions.bottlenecks || [],
      riskScore: predictions.riskScore || 0,
      completionProbability: predictions.completionProbability || 50,
      suggestedActions: predictions.suggestedActions || []
    };

    await gantt.save();

    res.status(200).json({
      success: true,
      data: gantt.aiPredictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting AI predictions',
      error: error.message
    });
  }
};

// @desc    Add milestone
// @route   POST /api/v1/agile/projects/:projectId/gantt/milestones
// @access   Private
exports.addMilestone = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOne({ project: req.params.projectId });

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    const milestone = {
      name: req.body.name,
      date: req.body.date,
      status: req.body.status || 'upcoming'
    };

    gantt.milestones.push(milestone);
    gantt.lastUpdated = Date.now();

    await gantt.save();

    res.status(200).json({
      success: true,
      data: gantt,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding milestone',
      error: error.message
    });
  }
};

// @desc    Delete Gantt chart
// @route   DELETE /api/v1/agile/projects/:projectId/gantt
// @access  Private
exports.deleteGantt = async (req, res) => {
  try {
    const gantt = await ProjectGantt.findOneAndDelete({ project: req.params.projectId });

    if (!gantt) {
      return res.status(404).json({
        success: false,
        message: 'Gantt chart not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gantt chart deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting Gantt chart',
      error: error.message
    });
  }
};
