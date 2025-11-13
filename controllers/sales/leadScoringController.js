const LeadScoring = require('../../models/sales/leadScoringModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all lead scores
 * @route   GET /api/sales/lead-scoring
 * @access  Private
 */
exports.getAllLeadScores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      grade,
      minScore,
      maxScore,
      search,
    } = req.query;

    const query = {};
    if (grade) query.grade = grade;
    if (minScore || maxScore) {
      query['scores.total'] = {};
      if (minScore) query['scores.total'].$gte = parseInt(minScore);
      if (maxScore) query['scores.total'].$lte = parseInt(maxScore);
    }
    if (search) {
      query.$or = [
        { 'lead.companyName': { $regex: search, $options: 'i' } },
        { 'lead.contactName': { $regex: search, $options: 'i' } },
        { 'lead.email': { $regex: search, $options: 'i' } },
      ];
    }

    const leadScores = await LeadScoring.find(query)
      .populate('lead', 'companyName contactName email phone')
      .populate('assignedTo', 'name email')
      .sort({ 'scores.total': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await LeadScoring.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leadScores,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lead scores',
      error: error.message,
    });
  }
};

/**
 * @desc    Get lead score by ID
 * @route   GET /api/sales/lead-scoring/:id
 * @access  Private
 */
exports.getLeadScoreById = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id)
      .populate('lead', 'companyName contactName email phone industry')
      .populate('assignedTo', 'name email role')
      .populate('interactions.user', 'name email');

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    res.status(200).json({
      success: true,
      data: leadScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lead score',
      error: error.message,
    });
  }
};

/**
 * @desc    Create/Calculate lead score
 * @route   POST /api/sales/lead-scoring
 * @access  Private
 */
exports.createLeadScore = async (req, res) => {
  try {
    const leadScore = await LeadScoring.create({
      ...req.body,
      scoredBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Lead scored successfully',
      data: leadScore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating lead score',
      error: error.message,
    });
  }
};

/**
 * @desc    Update lead score
 * @route   PUT /api/sales/lead-scoring/:id
 * @access  Private
 */
exports.updateLeadScore = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id);

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    // Store previous score in history
    leadScore.addScoreHistory(leadScore.scores.total, req.user._id);

    // Update fields
    Object.keys(req.body).forEach((key) => {
      leadScore[key] = req.body[key];
    });

    await leadScore.save();

    res.status(200).json({
      success: true,
      message: 'Lead score updated successfully',
      data: leadScore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating lead score',
      error: error.message,
    });
  }
};

/**
 * @desc    Score lead with AI
 * @route   POST /api/sales/lead-scoring/:id/ai-score
 * @access  Private
 */
exports.scoreLeadWithAI = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id).populate('lead');

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    // Prepare lead data for AI scoring
    const leadData = {
      companyName: leadScore.lead.companyName,
      industry: leadScore.lead.industry,
      companySize: leadScore.demographic.companySize,
      budget: leadScore.demographic.budget,
      timeline: leadScore.demographic.timeline,
      interactions: leadScore.interactions,
      engagement: leadScore.engagement,
    };

    const aiScore = await aiService.scoreLead(leadData);

    if (aiScore) {
      leadScore.aiPrediction = {
        conversionProbability: aiScore.conversionProbability,
        recommendedActions: aiScore.recommendedActions,
        bestTimeToContact: aiScore.bestTimeToContact,
        estimatedDealValue: aiScore.estimatedDealValue,
        closingTimeframe: aiScore.closingTimeframe,
      };
      await leadScore.save();
    }

    res.status(200).json({
      success: true,
      message: 'Lead scored with AI successfully',
      data: leadScore.aiPrediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scoring lead with AI',
      error: error.message,
    });
  }
};

/**
 * @desc    Add interaction to lead
 * @route   POST /api/sales/lead-scoring/:id/interactions
 * @access  Private
 */
exports.addInteraction = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id);

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    const { type, channel, outcome, notes } = req.body;
    leadScore.addInteraction(type, channel, outcome, notes, req.user._id);
    await leadScore.save();

    res.status(200).json({
      success: true,
      message: 'Interaction added successfully',
      data: leadScore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding interaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Get high priority leads
 * @route   GET /api/sales/lead-scoring/high-priority
 * @access  Private
 */
exports.getHighPriorityLeads = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const highPriorityLeads = await LeadScoring.find({
      grade: { $in: ['A+', 'A', 'A-'] },
      'scores.total': { $gte: 80 },
    })
      .populate('lead', 'companyName contactName email phone')
      .populate('assignedTo', 'name email')
      .sort({ 'scores.total': -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: highPriorityLeads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching high priority leads',
      error: error.message,
    });
  }
};

/**
 * @desc    Get lead scoring statistics
 * @route   GET /api/sales/lead-scoring/stats
 * @access  Private
 */
exports.getLeadScoringStats = async (req, res) => {
  try {
    const stats = await LeadScoring.getLeadScoringStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lead scoring statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get score distribution
 * @route   GET /api/sales/lead-scoring/distribution
 * @access  Private
 */
exports.getScoreDistribution = async (req, res) => {
  try {
    const leadScores = await LeadScoring.find().select('grade scores.total');

    const distribution = {
      byGrade: leadScores.reduce((acc, ls) => {
        acc[ls.grade] = (acc[ls.grade] || 0) + 1;
        return acc;
      }, {}),
      byScoreRange: {
        '0-20': leadScores.filter((ls) => ls.scores.total < 20).length,
        '20-40': leadScores.filter((ls) => ls.scores.total >= 20 && ls.scores.total < 40).length,
        '40-60': leadScores.filter((ls) => ls.scores.total >= 40 && ls.scores.total < 60).length,
        '60-80': leadScores.filter((ls) => ls.scores.total >= 60 && ls.scores.total < 80).length,
        '80-100': leadScores.filter((ls) => ls.scores.total >= 80).length,
      },
      total: leadScores.length,
    };

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching score distribution',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign lead to sales rep
 * @route   POST /api/sales/lead-scoring/:id/assign
 * @access  Private
 */
exports.assignLead = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id);

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    const { userId } = req.body;
    leadScore.assignedTo = userId;
    leadScore.assignedAt = new Date();
    await leadScore.save();

    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: leadScore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error assigning lead',
      error: error.message,
    });
  }
};

/**
 * @desc    Get score history
 * @route   GET /api/sales/lead-scoring/:id/history
 * @access  Private
 */
exports.getScoreHistory = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findById(req.params.id)
      .select('scoreHistory')
      .populate('scoreHistory.updatedBy', 'name email');

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    res.status(200).json({
      success: true,
      data: leadScore.scoreHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching score history',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk score leads
 * @route   POST /api/sales/lead-scoring/bulk-score
 * @access  Private
 */
exports.bulkScoreLeads = async (req, res) => {
  try {
    const { leadIds } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leadIds array',
      });
    }

    const results = [];
    for (const leadId of leadIds) {
      try {
        const leadScore = await LeadScoring.findOne({ lead: leadId });
        if (leadScore) {
          // Recalculate score (will happen in pre-save hook)
          await leadScore.save();
          results.push({ leadId, success: true, score: leadScore.scores.total });
        } else {
          results.push({ leadId, success: false, error: 'Lead score not found' });
        }
      } catch (error) {
        results.push({ leadId, success: false, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk scoring completed',
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk scoring leads',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete lead score
 * @route   DELETE /api/sales/lead-scoring/:id
 * @access  Private
 */
exports.deleteLeadScore = async (req, res) => {
  try {
    const leadScore = await LeadScoring.findByIdAndDelete(req.params.id);

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead score deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lead score',
      error: error.message,
    });
  }
};

module.exports = exports;
