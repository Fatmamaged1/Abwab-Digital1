const Campaign = require('../../models/marketing/campaignModel');
const AIService = require('../../services/aiService');

// @desc    Get all campaigns
// @route   GET /api/v1/marketing/campaigns
// @access  Private
exports.getAllCampaigns = async (req, res) => {
  try {
    const {
      status,
      type,
      client,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isDeleted: false };

    if (status) query.status = status;
    if (type) query.type = type;
    if (client) query.client = client;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const campaigns = await Campaign.find(query)
      .populate('client', 'name')
      .populate('createdBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Campaign.countDocuments(query);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/v1/marketing/campaigns/:id
// @access  Private
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email avatar')
      .populate('content.approvedBy', 'name email');

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign',
      error: error.message
    });
  }
};

// @desc    Create new campaign
// @route   POST /api/v1/marketing/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      createdBy: req.user._id
    };

    const campaign = await Campaign.create(campaignData);

    // Use AI to get campaign optimization insights
    if (campaign.objectives && campaign.targetAudience) {
      const aiService = new AIService();
      const aiInsights = await aiService.optimizeCampaign({
        type: campaign.type,
        objectives: campaign.objectives,
        targetAudience: campaign.targetAudience,
        budget: campaign.budget,
        channels: campaign.channels
      });

      if (aiInsights) {
        campaign.aiInsights = {
          performancePrediction: aiInsights.performancePrediction || '',
          optimizationSuggestions: aiInsights.optimizationSuggestions || [],
          audienceInsights: aiInsights.audienceInsights || '',
          competitorAnalysis: aiInsights.competitorAnalysis || '',
          trendingTopics: aiInsights.trendingTopics || [],
          recommendedContent: aiInsights.recommendedContent || []
        };

        await campaign.save();
      }
    }

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating campaign',
      error: error.message
    });
  }
};

// @desc    Update campaign
// @route   PUT /api/v1/marketing/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        campaign[key] = req.body[key];
      }
    });

    campaign.updatedBy = req.user._id;
    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating campaign',
      error: error.message
    });
  }
};

// @desc    Add content to campaign
// @route   POST /api/v1/marketing/campaigns/:id/content
// @access  Private
exports.addContent = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const content = {
      type: req.body.type,
      title: req.body.title,
      body: req.body.body,
      media: req.body.media || [],
      status: req.body.status || 'draft',
      scheduledFor: req.body.scheduledFor,
      aiGenerated: req.body.aiGenerated || false,
      performance: {}
    };

    campaign.content.push(content);
    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign,
      message: 'Content added to campaign successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding content',
      error: error.message
    });
  }
};

// @desc    Approve content
// @route   PUT /api/v1/marketing/campaigns/:id/content/:contentId/approve
// @access  Private
exports.approveContent = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const content = campaign.content.id(req.params.contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    content.status = 'approved';
    content.approvedBy = req.user._id;

    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign,
      message: 'Content approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving content',
      error: error.message
    });
  }
};

// @desc    Update campaign performance metrics
// @route   PUT /api/v1/marketing/campaigns/:id/performance
// @access  Private
exports.updatePerformance = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    campaign.performance = {
      ...campaign.performance,
      ...req.body
    };

    // Calculate ROI
    if (campaign.performance.revenue && campaign.budget.spent) {
      campaign.performance.roi =
        ((campaign.performance.revenue - campaign.budget.spent) / campaign.budget.spent) * 100;
    }

    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign,
      message: 'Performance metrics updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating performance',
      error: error.message
    });
  }
};

// @desc    Get AI optimization suggestions
// @route   GET /api/v1/marketing/campaigns/:id/optimize
// @access  Private
exports.getOptimizationSuggestions = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const aiService = new AIService();
    const suggestions = await aiService.optimizeCampaign({
      type: campaign.type,
      performance: campaign.performance,
      budget: campaign.budget,
      channels: campaign.channels,
      targetAudience: campaign.targetAudience,
      objectives: campaign.objectives
    });

    campaign.aiInsights = {
      ...campaign.aiInsights,
      optimizationSuggestions: suggestions.optimizationSuggestions || [],
      performancePrediction: suggestions.performancePrediction || ''
    };

    await campaign.save();

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting optimization suggestions',
      error: error.message
    });
  }
};

// @desc    Get campaign statistics
// @route   GET /api/v1/marketing/campaigns/stats
// @access  Private
exports.getCampaignStatistics = async (req, res) => {
  try {
    const { startDate, endDate, client } = req.query;
    const query = { isDeleted: false };

    if (client) query.client = client;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const stats = await Campaign.aggregate([
      { $match: query },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          totalBudget: [
            {
              $group: {
                _id: null,
                total: { $sum: '$budget.total' },
                spent: { $sum: '$budget.spent' },
                remaining: { $sum: '$budget.remaining' }
              }
            }
          ],
          performance: [
            {
              $group: {
                _id: null,
                totalImpressions: { $sum: '$performance.impressions' },
                totalClicks: { $sum: '$performance.clicks' },
                totalConversions: { $sum: '$performance.conversions' },
                totalRevenue: { $sum: '$performance.revenue' },
                avgROI: { $avg: '$performance.roi' }
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
      message: 'Error fetching campaign statistics',
      error: error.message
    });
  }
};

// @desc    Delete campaign (soft delete)
// @route   DELETE /api/v1/marketing/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    campaign.isDeleted = true;
    campaign.deletedAt = new Date();
    campaign.deletedBy = req.user._id;

    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting campaign',
      error: error.message
    });
  }
};
