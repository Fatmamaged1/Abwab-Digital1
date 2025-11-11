const asyncHandler = require('express-async-handler');
const Opportunity = require('../../models/sales/opportunityModel');
const Lead = require('../../models/sales/leadModel');
const Activity = require('../../models/sales/activityModel');

// @desc    Get all opportunities
// @route   GET /api/sales/opportunities
// @access  Private
exports.getOpportunities = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    stage,
    owner,
    isClosed,
    isWon,
    minAmount,
    maxAmount,
    search,
    sortBy = '-createdAt'
  } = req.query;

  const query = { isDeleted: false };

  // Filters
  if (stage) query.stage = stage;
  if (owner) query.owner = owner;
  if (isClosed !== undefined) query.isClosed = isClosed === 'true';
  if (isWon !== undefined) query.isWon = isWon === 'true';
  if (minAmount || maxAmount) {
    query['amount.value'] = {};
    if (minAmount) query['amount.value'].$gte = parseFloat(minAmount);
    if (maxAmount) query['amount.value'].$lte = parseFloat(maxAmount);
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'account.name': { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const opportunities = await Opportunity.find(query)
    .populate('owner', 'firstName lastName email')
    .populate('lead', 'firstName lastName email company')
    .populate('team.user', 'firstName lastName email')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Opportunity.countDocuments(query);

  res.status(200).json({
    success: true,
    count: opportunities.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: opportunities
  });
});

// @desc    Get single opportunity
// @route   GET /api/sales/opportunities/:id
// @access  Private
exports.getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('lead', 'firstName lastName email phone company')
    .populate('team.user', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Create opportunity
// @route   POST /api/sales/opportunities
// @access  Private
exports.createOpportunity = asyncHandler(async (req, res) => {
  const opportunityData = {
    ...req.body,
    createdBy: req.user._id,
    owner: req.body.owner || req.user._id
  };

  const opportunity = await Opportunity.create(opportunityData);

  // Update lead if provided
  if (req.body.lead) {
    await Lead.findByIdAndUpdate(req.body.lead, {
      'conversion.convertedToOpportunity': true,
      'conversion.conversionDate': new Date(),
      'conversion.conversionOwner': req.user._id,
      status: 'converted'
    });
  }

  // Create activity
  await Activity.create({
    type: 'opportunity_created',
    opportunity: opportunity._id,
    lead: req.body.lead,
    performedBy: req.user._id,
    details: `Opportunity "${opportunity.name}" created`,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: opportunity
  });
});

// @desc    Update opportunity
// @route   PUT /api/sales/opportunities/:id
// @access  Private
exports.updateOpportunity = asyncHandler(async (req, res) => {
  let opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  const oldStage = opportunity.stage;
  const updateData = { ...req.body, updatedBy: req.user._id };

  opportunity = await Opportunity.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  // Create activity if stage changed
  if (oldStage !== opportunity.stage) {
    await Activity.create({
      type: 'stage_changed',
      opportunity: opportunity._id,
      lead: opportunity.lead,
      performedBy: req.user._id,
      details: `Stage changed from ${oldStage} to ${opportunity.stage}`,
      metadata: {
        oldValue: oldStage,
        newValue: opportunity.stage
      },
      createdBy: req.user._id
    });
  }

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Delete opportunity (soft delete)
// @route   DELETE /api/sales/opportunities/:id
// @access  Private
exports.deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  opportunity.isDeleted = true;
  opportunity.updatedBy = req.user._id;
  await opportunity.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Move opportunity to stage
// @route   PUT /api/sales/opportunities/:id/stage
// @access  Private
exports.moveToStage = asyncHandler(async (req, res) => {
  const { stage, notes } = req.body;

  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  const oldStage = opportunity.stage;
  opportunity.stage = stage;
  opportunity.updatedBy = req.user._id;

  await opportunity.save();

  // Create activity
  await Activity.create({
    type: 'stage_changed',
    opportunity: opportunity._id,
    lead: opportunity.lead,
    performedBy: req.user._id,
    details: `Moved from ${oldStage} to ${stage}`,
    notes,
    metadata: {
      oldValue: oldStage,
      newValue: stage
    },
    createdBy: req.user._id
  });

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Add line item to opportunity
// @route   POST /api/sales/opportunities/:id/line-items
// @access  Private
exports.addLineItem = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  opportunity.lineItems.push(req.body);
  opportunity.updatedBy = req.user._id;
  await opportunity.save();

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Update line item
// @route   PUT /api/sales/opportunities/:id/line-items/:itemId
// @access  Private
exports.updateLineItem = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  const item = opportunity.lineItems.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Line item not found');
  }

  Object.assign(item, req.body);
  opportunity.updatedBy = req.user._id;
  await opportunity.save();

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Remove line item
// @route   DELETE /api/sales/opportunities/:id/line-items/:itemId
// @access  Private
exports.removeLineItem = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || opportunity.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  opportunity.lineItems.pull(req.params.itemId);
  opportunity.updatedBy = req.user._id;
  await opportunity.save();

  res.status(200).json({
    success: true,
    data: opportunity
  });
});

// @desc    Get pipeline metrics
// @route   GET /api/sales/opportunities/metrics/pipeline
// @access  Private
exports.getPipelineMetrics = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;

  const metrics = await Opportunity.getPipelineMetrics(userId);

  // Calculate total pipeline value
  const totalValue = metrics.reduce((sum, stage) => sum + stage.totalValue, 0);

  res.status(200).json({
    success: true,
    data: {
      stages: metrics,
      totalValue,
      totalOpportunities: metrics.reduce((sum, stage) => sum + stage.count, 0)
    }
  });
});

// @desc    Get win rate
// @route   GET /api/sales/opportunities/metrics/win-rate
// @access  Private
exports.getWinRate = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3));
  const end = endDate ? new Date(endDate) : new Date();

  const winRate = await Opportunity.getWinRate(userId, start, end);

  res.status(200).json({
    success: true,
    data: winRate
  });
});

// @desc    Get opportunity forecast
// @route   GET /api/sales/opportunities/metrics/forecast
// @access  Private
exports.getForecast = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;

  const opportunities = await Opportunity.find({
    owner: userId,
    isClosed: false,
    isDeleted: false
  });

  const forecast = {
    bestCase: 0,
    mostLikely: 0,
    worstCase: 0,
    committed: 0,
    count: opportunities.length
  };

  opportunities.forEach(opp => {
    forecast.bestCase += opp.amount.value;
    forecast.mostLikely += opp.expectedRevenue || 0;

    if (opp.probability >= 70) {
      forecast.committed += opp.amount.value;
    }

    if (opp.probability >= 30) {
      forecast.worstCase += opp.amount.value * 0.3;
    }
  });

  res.status(200).json({
    success: true,
    data: forecast
  });
});

// @desc    Clone opportunity
// @route   POST /api/sales/opportunities/:id/clone
// @access  Private
exports.cloneOpportunity = asyncHandler(async (req, res) => {
  const originalOpp = await Opportunity.findById(req.params.id);

  if (!originalOpp || originalOpp.isDeleted) {
    res.status(404);
    throw new Error('Opportunity not found');
  }

  const clonedData = originalOpp.toObject();
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  delete clonedData.__v;
  delete clonedData.stageHistory;
  delete clonedData.actualCloseDate;

  clonedData.name = `${clonedData.name} (Copy)`;
  clonedData.stage = 'qualification';
  clonedData.isClosed = false;
  clonedData.isWon = false;
  clonedData.createdBy = req.user._id;
  clonedData.owner = req.user._id;

  const clonedOpp = await Opportunity.create(clonedData);

  res.status(201).json({
    success: true,
    data: clonedOpp
  });
});

module.exports = exports;
