const SprintVelocity = require('../../models/software/sprintVelocityModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all sprint velocities
 * @route   GET /api/software/sprint-velocity
 * @access  Private
 */
exports.getAllSprintVelocities = async (req, res) => {
  try {
    const { page = 1, limit = 20, team, sprint, project } = req.query;

    const query = {};
    if (team) query.team = team;
    if (sprint) query.sprint = sprint;
    if (project) query.project = project;

    const velocities = await SprintVelocity.find(query)
      .populate('team', 'name')
      .populate('sprint', 'name startDate endDate')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await SprintVelocity.countDocuments(query);

    res.status(200).json({
      success: true,
      data: velocities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sprint velocities',
      error: error.message,
    });
  }
};

/**
 * @desc    Get sprint velocity by ID
 * @route   GET /api/software/sprint-velocity/:id
 * @access  Private
 */
exports.getSprintVelocityById = async (req, res) => {
  try {
    const velocity = await SprintVelocity.findById(req.params.id)
      .populate('team', 'name members')
      .populate('sprint', 'name startDate endDate goal')
      .populate('project', 'name description');

    if (!velocity) {
      return res.status(404).json({
        success: false,
        message: 'Sprint velocity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: velocity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sprint velocity',
      error: error.message,
    });
  }
};

/**
 * @desc    Create sprint velocity record
 * @route   POST /api/software/sprint-velocity
 * @access  Private
 */
exports.createSprintVelocity = async (req, res) => {
  try {
    const velocity = await SprintVelocity.create({
      ...req.body,
      recordedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Sprint velocity recorded successfully',
      data: velocity,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating sprint velocity',
      error: error.message,
    });
  }
};

/**
 * @desc    Update sprint velocity
 * @route   PUT /api/software/sprint-velocity/:id
 * @access  Private
 */
exports.updateSprintVelocity = async (req, res) => {
  try {
    const velocity = await SprintVelocity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!velocity) {
      return res.status(404).json({
        success: false,
        message: 'Sprint velocity not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sprint velocity updated successfully',
      data: velocity,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating sprint velocity',
      error: error.message,
    });
  }
};

/**
 * @desc    Predict next sprint velocity with AI
 * @route   POST /api/software/sprint-velocity/:id/predict
 * @access  Private
 */
exports.predictNextSprintVelocity = async (req, res) => {
  try {
    const currentVelocity = await SprintVelocity.findById(req.params.id)
      .populate('team')
      .populate('sprint');

    if (!currentVelocity) {
      return res.status(404).json({
        success: false,
        message: 'Sprint velocity not found',
      });
    }

    // Get historical velocities
    const historicalVelocities = await SprintVelocity.find({
      team: currentVelocity.team._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('velocity.completed');

    const avgVelocity =
      historicalVelocities.reduce((sum, v) => sum + v.velocity.completed, 0) /
      historicalVelocities.length;

    // AI prediction
    const prediction = await aiService.predictSprintVelocity(
      currentVelocity.team,
      currentVelocity.sprint,
      avgVelocity
    );

    res.status(200).json({
      success: true,
      data: {
        historicalAverage: Math.round(avgVelocity),
        aiPrediction: prediction,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error predicting sprint velocity',
      error: error.message,
    });
  }
};

/**
 * @desc    Get team average velocity
 * @route   GET /api/software/sprint-velocity/team/:teamId/average
 * @access  Private
 */
exports.getTeamAverageVelocity = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { lastNSprints = 5 } = req.query;

    const avgVelocity = await SprintVelocity.getTeamAverageVelocity(
      teamId,
      parseInt(lastNSprints)
    );

    res.status(200).json({
      success: true,
      data: {
        teamId,
        averageVelocity: avgVelocity,
        sprintsAnalyzed: lastNSprints,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating team average velocity',
      error: error.message,
    });
  }
};

/**
 * @desc    Get velocity trends
 * @route   GET /api/software/sprint-velocity/team/:teamId/trends
 * @access  Private
 */
exports.getVelocityTrends = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { sprints = 10 } = req.query;

    const velocities = await SprintVelocity.find({ team: teamId })
      .sort({ createdAt: -1 })
      .limit(parseInt(sprints))
      .select('sprint velocity createdAt')
      .populate('sprint', 'name startDate');

    const trend = {
      sprints: velocities.map((v) => ({
        sprint: v.sprint?.name || 'N/A',
        date: v.createdAt,
        planned: v.velocity.planned,
        completed: v.velocity.completed,
        efficiency: v.velocity.efficiency,
      })),
      averageEfficiency:
        velocities.reduce((sum, v) => sum + (v.velocity.efficiency || 0), 0) /
        velocities.length,
    };

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching velocity trends',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete sprint velocity
 * @route   DELETE /api/software/sprint-velocity/:id
 * @access  Private
 */
exports.deleteSprintVelocity = async (req, res) => {
  try {
    const velocity = await SprintVelocity.findByIdAndDelete(req.params.id);

    if (!velocity) {
      return res.status(404).json({
        success: false,
        message: 'Sprint velocity not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sprint velocity deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sprint velocity',
      error: error.message,
    });
  }
};
