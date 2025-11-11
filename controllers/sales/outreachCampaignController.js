const asyncHandler = require('express-async-handler');
const OutreachCampaign = require('../../models/sales/outreachCampaignModel');
const Lead = require('../../models/sales/leadModel');

// @desc    Get all campaigns
// @route   GET /api/sales/campaigns
// @access  Private
exports.getCampaigns = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    goal,
    owner,
    search,
    sortBy = '-createdAt'
  } = req.query;

  const query = { isDeleted: false };

  // Filters
  if (status) query.status = status;
  if (type) query.type = type;
  if (goal) query.goal = goal;
  if (owner) query.owner = owner;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const campaigns = await OutreachCampaign.find(query)
    .populate('owner', 'firstName lastName email avatar')
    .populate('team', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await OutreachCampaign.countDocuments(query);

  res.status(200).json({
    success: true,
    count: campaigns.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: campaigns
  });
});

// @desc    Get single campaign
// @route   GET /api/sales/campaigns/:id
// @access  Private
exports.getCampaign = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('team', 'firstName lastName email avatar')
    .populate('recipients.lead', 'firstName lastName email company')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Create campaign
// @route   POST /api/sales/campaigns
// @access  Private
exports.createCampaign = asyncHandler(async (req, res) => {
  const campaignData = {
    ...req.body,
    createdBy: req.user._id,
    owner: req.body.owner || req.user._id
  };

  const campaign = await OutreachCampaign.create(campaignData);

  res.status(201).json({
    success: true,
    data: campaign
  });
});

// @desc    Update campaign
// @route   PUT /api/sales/campaigns/:id
// @access  Private
exports.updateCampaign = asyncHandler(async (req, res) => {
  let campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Check permission
  if (!campaign.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this campaign');
  }

  // Prevent updating active campaigns (except for status)
  if (campaign.status === 'active' && !req.body.status) {
    res.status(400);
    throw new Error('Cannot update active campaign. Pause it first.');
  }

  const updateData = { ...req.body, updatedBy: req.user._id };
  campaign = await OutreachCampaign.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Delete campaign (soft delete)
// @route   DELETE /api/sales/campaigns/:id
// @access  Private
exports.deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Check permission
  if (!campaign.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to delete this campaign');
  }

  campaign.isDeleted = true;
  campaign.updatedBy = req.user._id;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add recipients to campaign
// @route   POST /api/sales/campaigns/:id/recipients
// @access  Private
exports.addRecipients = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const { leadIds } = req.body;

  if (!leadIds || !Array.isArray(leadIds)) {
    res.status(400);
    throw new Error('Please provide an array of lead IDs');
  }

  // Fetch leads
  const leads = await Lead.find({
    _id: { $in: leadIds },
    isDeleted: false,
    'compliance.unsubscribed': false
  });

  // Add recipients
  for (const lead of leads) {
    await campaign.addRecipient(lead._id, {
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company.name
    });
  }

  res.status(200).json({
    success: true,
    data: campaign,
    added: leads.length
  });
});

// @desc    Remove recipient from campaign
// @route   DELETE /api/sales/campaigns/:id/recipients/:leadId
// @access  Private
exports.removeRecipient = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  await campaign.removeRecipient(req.params.leadId);

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Update campaign status
// @route   PUT /api/sales/campaigns/:id/status
// @access  Private
exports.updateCampaignStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Validate status transition
  if (status === 'active' && campaign.recipients.length === 0) {
    res.status(400);
    throw new Error('Cannot activate campaign without recipients');
  }

  if (status === 'active' && campaign.sequence.length === 0) {
    res.status(400);
    throw new Error('Cannot activate campaign without sequence steps');
  }

  campaign.status = status;
  campaign.updatedBy = req.user._id;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Update recipient status (for tracking)
// @route   PUT /api/sales/campaigns/:id/recipients/:leadId/status
// @access  Private
exports.updateRecipientStatus = asyncHandler(async (req, res) => {
  const { status, timestamp } = req.body;

  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  await campaign.updateRecipientStatus(
    req.params.leadId,
    status,
    timestamp ? new Date(timestamp) : new Date()
  );

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Mark lead as converted
// @route   PUT /api/sales/campaigns/:id/recipients/:leadId/convert
// @access  Private
exports.markConverted = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  await campaign.markConverted(req.params.leadId);

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Get campaign metrics
// @route   GET /api/sales/campaigns/:id/metrics
// @access  Private
exports.getCampaignMetrics = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const metrics = {
    basic: campaign.metrics,
    performanceScore: campaign.performanceScore,
    recipientBreakdown: {
      total: campaign.recipients.length,
      pending: campaign.recipients.filter(r => r.status === 'pending').length,
      sent: campaign.recipients.filter(r => r.status === 'sent').length,
      opened: campaign.recipients.filter(r => r.status === 'opened').length,
      clicked: campaign.recipients.filter(r => r.status === 'clicked').length,
      replied: campaign.recipients.filter(r => r.status === 'replied').length,
      bounced: campaign.recipients.filter(r => r.status === 'bounced').length,
      unsubscribed: campaign.recipients.filter(r => r.status === 'unsubscribed').length
    }
  };

  res.status(200).json({
    success: true,
    data: metrics
  });
});

// @desc    Get active campaigns
// @route   GET /api/sales/campaigns/active
// @access  Private
exports.getActiveCampaigns = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;

  const campaigns = await OutreachCampaign.getActiveCampaigns(userId);

  res.status(200).json({
    success: true,
    count: campaigns.length,
    data: campaigns
  });
});

// @desc    Get campaign statistics
// @route   GET /api/sales/campaigns/stats
// @access  Private
exports.getCampaignStats = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3));
  const end = endDate ? new Date(endDate) : new Date();

  const stats = await OutreachCampaign.getCampaignStats(userId, start, end);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Clone campaign
// @route   POST /api/sales/campaigns/:id/clone
// @access  Private
exports.cloneCampaign = asyncHandler(async (req, res) => {
  const originalCampaign = await OutreachCampaign.findById(req.params.id);

  if (!originalCampaign || originalCampaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const clonedData = originalCampaign.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  delete clonedData.__v;
  delete clonedData.recipients;
  delete clonedData.metrics;

  clonedData.name = `${clonedData.name} (Copy)`;
  clonedData.status = 'draft';
  clonedData.createdBy = req.user._id;
  clonedData.owner = req.user._id;
  clonedData.recipients = [];
  clonedData.metrics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    bounced: 0,
    unsubscribed: 0,
    converted: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    conversionRate: 0
  };

  const clonedCampaign = await OutreachCampaign.create(clonedData);

  res.status(201).json({
    success: true,
    data: clonedCampaign
  });
});

// @desc    Add sequence step
// @route   POST /api/sales/campaigns/:id/sequence
// @access  Private
exports.addSequenceStep = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'active') {
    res.status(400);
    throw new Error('Cannot modify sequence of active campaign');
  }

  campaign.sequence.push(req.body);
  campaign.updatedBy = req.user._id;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Update sequence step
// @route   PUT /api/sales/campaigns/:id/sequence/:stepId
// @access  Private
exports.updateSequenceStep = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'active') {
    res.status(400);
    throw new Error('Cannot modify sequence of active campaign');
  }

  const step = campaign.sequence.id(req.params.stepId);
  if (!step) {
    res.status(404);
    throw new Error('Sequence step not found');
  }

  Object.assign(step, req.body);
  campaign.updatedBy = req.user._id;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Delete sequence step
// @route   DELETE /api/sales/campaigns/:id/sequence/:stepId
// @access  Private
exports.deleteSequenceStep = asyncHandler(async (req, res) => {
  const campaign = await OutreachCampaign.findById(req.params.id);

  if (!campaign || campaign.isDeleted) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'active') {
    res.status(400);
    throw new Error('Cannot modify sequence of active campaign');
  }

  campaign.sequence.pull(req.params.stepId);
  campaign.updatedBy = req.user._id;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: campaign
  });
});

module.exports = exports;
