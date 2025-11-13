const TechnicalDebt = require('../../models/software/technicalDebtModel');
const AIService = require('../../services/aiService');

// @desc    Get all technical debts
// @route   GET /api/v1/software/technical-debts
// @access  Private
exports.getAllTechnicalDebts = async (req, res) => {
  try {
    const { status, type, severity, project, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (project) query.project = project;

    const debts = await TechnicalDebt.find(query)
      .populate('project', 'name')
      .populate('identifiedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, severity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await TechnicalDebt.countDocuments(query);

    res.status(200).json({
      success: true,
      data: debts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching technical debts',
      error: error.message
    });
  }
};

// @desc    Get single technical debt
// @route   GET /api/v1/software/technical-debts/:id
// @access  Private
exports.getTechnicalDebt = async (req, res) => {
  try {
    const debt = await TechnicalDebt.findById(req.params.id)
      .populate('project', 'name')
      .populate('identifiedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    if (!debt || debt.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Technical debt not found'
      });
    }

    res.status(200).json({
      success: true,
      data: debt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching technical debt',
      error: error.message
    });
  }
};

// @desc    Create technical debt
// @route   POST /api/v1/software/technical-debts
// @access  Private
exports.createTechnicalDebt = async (req, res) => {
  try {
    const debtData = {
      ...req.body,
      identifiedBy: req.user._id
    };

    const debt = await TechnicalDebt.create(debtData);

    // Use AI to analyze and provide recommendations
    if (debt.description) {
      const aiService = new AIService();
      // Note: This would need a specific AI method for technical debt analysis
      // For now, using a generic analysis approach
      const aiRecommendation = {
        refactoringPlan: `Suggested refactoring approach for ${debt.type} issue`,
        estimatedBenefit: 'Improved code maintainability and reduced complexity',
        riskIfIgnored: 'Potential for increased technical debt and maintenance costs',
        suggestedTimeline: `${debt.estimatedEffort} hours within next sprint`
      };

      debt.aiRecommendation = aiRecommendation;
      await debt.save();
    }

    res.status(201).json({
      success: true,
      data: debt,
      message: 'Technical debt created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating technical debt',
      error: error.message
    });
  }
};

// @desc    Update technical debt
// @route   PUT /api/v1/software/technical-debts/:id
// @access  Private
exports.updateTechnicalDebt = async (req, res) => {
  try {
    const debt = await TechnicalDebt.findById(req.params.id);

    if (!debt || debt.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Technical debt not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        debt[key] = req.body[key];
      }
    });

    await debt.save();

    res.status(200).json({
      success: true,
      data: debt,
      message: 'Technical debt updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating technical debt',
      error: error.message
    });
  }
};

// @desc    Resolve technical debt
// @route   PUT /api/v1/software/technical-debts/:id/resolve
// @access  Private
exports.resolveTechnicalDebt = async (req, res) => {
  try {
    const debt = await TechnicalDebt.findById(req.params.id);

    if (!debt || debt.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Technical debt not found'
      });
    }

    debt.status = 'resolved';
    debt.resolvedAt = new Date();
    debt.resolvedBy = req.user._id;
    debt.actualEffort = req.body.actualEffort || debt.estimatedEffort;

    await debt.save();

    res.status(200).json({
      success: true,
      data: debt,
      message: 'Technical debt resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving technical debt',
      error: error.message
    });
  }
};

// @desc    Get technical debt statistics
// @route   GET /api/v1/software/technical-debts/stats
// @access  Private
exports.getTechnicalDebtStats = async (req, res) => {
  try {
    const { project } = req.query;
    const query = { isDeleted: false };
    if (project) query.project = project;

    const stats = await TechnicalDebt.aggregate([
      { $match: query },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 }, totalEffort: { $sum: '$estimatedEffort' } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totalEffort: [
            { $group: { _id: null, estimated: { $sum: '$estimatedEffort' }, actual: { $sum: '$actualEffort' } } }
          ],
          urgencyScore: [
            { $group: { _id: null, avgUrgency: { $avg: '$urgencyScore' }, maxUrgency: { $max: '$urgencyScore' } } }
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
      message: 'Error fetching technical debt statistics',
      error: error.message
    });
  }
};

// @desc    Delete technical debt (soft delete)
// @route   DELETE /api/v1/software/technical-debts/:id
// @access  Private
exports.deleteTechnicalDebt = async (req, res) => {
  try {
    const debt = await TechnicalDebt.findById(req.params.id);

    if (!debt || debt.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Technical debt not found'
      });
    }

    debt.isDeleted = true;
    debt.deletedAt = new Date();
    debt.deletedBy = req.user._id;

    await debt.save();

    res.status(200).json({
      success: true,
      message: 'Technical debt deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting technical debt',
      error: error.message
    });
  }
};
