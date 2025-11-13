const EarlyWarning = require('../../models/ceo/earlyWarningModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all active warnings
 * @route   GET /api/ceo/early-warning/active
 * @access  Private (CEO, Managers)
 */
exports.getActiveWarnings = async (req, res) => {
  try {
    const { severity, type, assignedTo } = req.query;

    const filters = {};
    if (severity) filters.severity = severity;
    if (type) filters.type = type;
    if (assignedTo) filters.assignedTo = assignedTo;

    const warnings = await EarlyWarning.getActiveWarnings(filters);

    // Sort by urgency score
    const sortedWarnings = warnings.sort((a, b) => b.urgencyScore - a.urgencyScore);

    res.status(200).json({
      success: true,
      data: sortedWarnings,
      summary: {
        total: warnings.length,
        critical: warnings.filter((w) => w.severity === 'critical').length,
        emergency: warnings.filter((w) => w.severity === 'emergency').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active warnings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all warnings with pagination
 * @route   GET /api/ceo/early-warning
 * @access  Private
 */
exports.getAllWarnings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      type,
      search,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { warningNumber: { $regex: search, $options: 'i' } },
        { 'warning.title.en': { $regex: search, $options: 'i' } },
        { 'warning.title.ar': { $regex: search, $options: 'i' } },
      ];
    }

    const warnings = await EarlyWarning.find(query)
      .populate('assignedTo', 'name email')
      .populate('actions.takenBy', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await EarlyWarning.countDocuments(query);

    res.status(200).json({
      success: true,
      data: warnings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warnings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get warning by ID
 * @route   GET /api/ceo/early-warning/:id
 * @access  Private
 */
exports.getWarningById = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('actions.takenBy', 'name email')
      .populate('escalation.escalatedTo', 'name email role')
      .populate('resolution.resolvedBy', 'name email')
      .populate('aiAnalysis.similarIncidents.incidentId');

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warning,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new warning
 * @route   POST /api/ceo/early-warning
 * @access  Private (System/Managers)
 */
exports.createWarning = async (req, res) => {
  try {
    const warningData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const warning = await EarlyWarning.create(warningData);

    // Send notifications to relevant stakeholders
    await sendWarningNotifications(warning);

    res.status(201).json({
      success: true,
      message: 'Warning created successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Update warning
 * @route   PUT /api/ceo/early-warning/:id
 * @access  Private
 */
exports.updateWarning = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    Object.keys(req.body).forEach((key) => {
      warning[key] = req.body[key];
    });

    warning.lastUpdatedBy = req.user._id;
    await warning.save();

    res.status(200).json({
      success: true,
      message: 'Warning updated successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign warning to user
 * @route   POST /api/ceo/early-warning/:id/assign
 * @access  Private (Managers)
 */
exports.assignWarning = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    const { userId, dueDate } = req.body;
    warning.assignTo(userId, dueDate);
    await warning.save();

    // Notify assigned user
    warning.sendNotification(userId, 'email');
    await warning.save();

    res.status(200).json({
      success: true,
      message: 'Warning assigned successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error assigning warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Add action to warning
 * @route   POST /api/ceo/early-warning/:id/actions
 * @access  Private
 */
exports.addAction = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    const { action, result, effectiveness } = req.body;
    warning.addAction(req.user._id, action, result, effectiveness);
    await warning.save();

    res.status(200).json({
      success: true,
      message: 'Action added successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding action',
      error: error.message,
    });
  }
};

/**
 * @desc    Escalate warning
 * @route   POST /api/ceo/early-warning/:id/escalate
 * @access  Private
 */
exports.escalateWarning = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    const { toUserId, level, reason } = req.body;
    warning.escalate(toUserId, level, reason);
    await warning.save();

    // Notify escalation recipient
    warning.sendNotification(toUserId, 'email');
    await warning.save();

    res.status(200).json({
      success: true,
      message: 'Warning escalated successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error escalating warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Resolve warning
 * @route   POST /api/ceo/early-warning/:id/resolve
 * @access  Private
 */
exports.resolveWarning = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    const { summary, lessonLearned, preventiveMeasures } = req.body;
    warning.resolve(req.user._id, summary, lessonLearned, preventiveMeasures);
    await warning.save();

    res.status(200).json({
      success: true,
      message: 'Warning resolved successfully',
      data: warning,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error resolving warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Get warning statistics
 * @route   GET /api/ceo/early-warning/stats
 * @access  Private
 */
exports.getWarningStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await EarlyWarning.getWarningStatistics(parseInt(days));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Analyze warning with AI
 * @route   POST /api/ceo/early-warning/:id/analyze
 * @access  Private
 */
exports.analyzeWarning = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    // Get similar past incidents
    const similarWarnings = await EarlyWarning.find({
      type: warning.type,
      'resolution.resolved': true,
    })
      .limit(5)
      .select('resolution aiAnalysis');

    // AI analysis
    const aiAnalysis = await aiService.analyzeWarning({
      warning,
      similarIncidents: similarWarnings,
    });

    if (aiAnalysis) {
      warning.aiAnalysis = {
        riskScore: aiAnalysis.riskScore,
        escalationProbability: aiAnalysis.escalationProbability,
        timeToEscalation: aiAnalysis.timeToEscalation,
        similarIncidents: aiAnalysis.similarIncidents,
        predictedOutcome: aiAnalysis.predictedOutcome,
      };
      await warning.save();
    }

    res.status(200).json({
      success: true,
      message: 'Warning analyzed successfully',
      data: warning.aiAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing warning',
      error: error.message,
    });
  }
};

/**
 * @desc    Get warnings by module
 * @route   GET /api/ceo/early-warning/by-module/:module
 * @access  Private
 */
exports.getWarningsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const { status = 'active' } = req.query;

    let statusQuery = {};
    if (status === 'active') {
      statusQuery = {
        status: { $in: ['active', 'investigating', 'action-taken'] },
        'resolution.resolved': { $ne: true },
      };
    }

    const warnings = await EarlyWarning.find({
      'source.module': module,
      ...statusQuery,
    })
      .populate('assignedTo', 'name email')
      .sort({ severity: -1, date: -1 });

    res.status(200).json({
      success: true,
      data: warnings,
      summary: {
        total: warnings.length,
        critical: warnings.filter((w) => w.severity === 'critical').length,
        warning: warnings.filter((w) => w.severity === 'warning').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warnings by module',
      error: error.message,
    });
  }
};

/**
 * @desc    Acknowledge notification
 * @route   POST /api/ceo/early-warning/:id/acknowledge
 * @access  Private
 */
exports.acknowledgeNotification = async (req, res) => {
  try {
    const warning = await EarlyWarning.findById(req.params.id);

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: 'Warning not found',
      });
    }

    const notification = warning.notifications.find(
      (n) => n.sentTo.toString() === req.user._id.toString() && !n.acknowledged
    );

    if (notification) {
      notification.acknowledged = true;
      notification.acknowledgedAt = new Date();
      await warning.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification acknowledged',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error acknowledging notification',
      error: error.message,
    });
  }
};

// Helper function to send notifications
async function sendWarningNotifications(warning) {
  // TODO: Implement actual notification logic (email, SMS, in-app)
  // For now, just log
  console.log(`Warning ${warning.warningNumber} created:`, warning.warning.title.en);
}

module.exports = exports;
