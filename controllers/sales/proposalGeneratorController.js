const ProposalGenerator = require('../../models/sales/proposalGeneratorModel');
const AIService = require('../../services/aiService');

// @desc    Get all proposals
// @route   GET /api/v1/sales/proposals
// @access  Private
exports.getAllProposals = async (req, res) => {
  try {
    const { status, type, opportunity, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (type) query.type = type;
    if (opportunity) query.opportunity = opportunity;

    const proposals = await ProposalGenerator.find(query)
      .populate('opportunity', 'name value status')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ProposalGenerator.countDocuments(query);

    res.status(200).json({
      success: true,
      data: proposals,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposals',
      error: error.message
    });
  }
};

// @desc    Get single proposal
// @route   GET /api/v1/sales/proposals/:id
// @access  Private
exports.getProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id)
      .populate('opportunity', 'name value client status')
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email avatar')
      .populate('template', 'name');

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposal',
      error: error.message
    });
  }
};

// @desc    Create proposal
// @route   POST /api/v1/sales/proposals
// @access  Private
exports.createProposal = async (req, res) => {
  try {
    const proposalData = {
      ...req.body,
      createdBy: req.user._id
    };

    const proposal = await ProposalGenerator.create(proposalData);

    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating proposal',
      error: error.message
    });
  }
};

// @desc    Generate proposal with AI
// @route   POST /api/v1/sales/proposals/generate
// @access  Private
exports.generateProposalWithAI = async (req, res) => {
  try {
    const { opportunityId, type, includeFinancial, includeTechnical } = req.body;

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity ID is required'
      });
    }

    // Fetch opportunity data
    const Opportunity = require('../../models/sales/opportunityModel');
    const opportunity = await Opportunity.findById(opportunityId)
      .populate('client')
      .populate('lead');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Use AI to generate proposal content
    const aiService = new AIService();
    const aiContent = await aiService.generateProposal({
      opportunityName: opportunity.name,
      clientName: opportunity.client?.name || opportunity.lead?.company,
      industry: opportunity.client?.industry || opportunity.lead?.industry,
      value: opportunity.value,
      description: opportunity.description,
      requirements: opportunity.requirements || []
    });

    // Create proposal with AI-generated content
    const proposal = await ProposalGenerator.create({
      opportunity: opportunityId,
      type: type || 'combined',
      status: 'draft',
      client: {
        name: {
          ar: opportunity.client?.name?.ar || '',
          en: opportunity.client?.name?.en || opportunity.lead?.company || ''
        },
        industry: opportunity.client?.industry || opportunity.lead?.industry,
        contact: {
          name: opportunity.lead?.contactName || '',
          email: opportunity.lead?.email || '',
          phone: opportunity.lead?.phone || ''
        }
      },
      project: {
        title: {
          ar: aiContent.projectTitle?.ar || '',
          en: aiContent.projectTitle?.en || opportunity.name
        },
        description: {
          ar: aiContent.description?.ar || '',
          en: aiContent.description?.en || opportunity.description
        },
        scope: aiContent.scope || [],
        deliverables: aiContent.deliverables || [],
        timeline: aiContent.timeline || {}
      },
      technical: includeTechnical ? {
        technologies: aiContent.technologies || [],
        architecture: aiContent.architecture || '',
        team: aiContent.team || [],
        methodology: aiContent.methodology || 'Agile',
        qualityAssurance: aiContent.qualityAssurance || ''
      } : {},
      financial: includeFinancial ? {
        items: aiContent.financialItems || [],
        subtotal: aiContent.subtotal || 0,
        vat: aiContent.vat || 0,
        discount: aiContent.discount || 0,
        total: aiContent.total || 0,
        paymentTerms: aiContent.paymentTerms || { ar: '', en: '' },
        currency: 'SAR'
      } : {},
      aiGenerated: true,
      generatedContent: {
        executiveSummary: aiContent.executiveSummary || '',
        valueProposition: aiContent.valueProposition || '',
        whyUs: aiContent.whyUs || '',
        riskMitigation: aiContent.riskMitigation || ''
      },
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal generated with AI successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating proposal with AI',
      error: error.message
    });
  }
};

// @desc    Update proposal
// @route   PUT /api/v1/sales/proposals/:id
// @access  Private
exports.updateProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        proposal[key] = req.body[key];
      }
    });

    await proposal.save();

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating proposal',
      error: error.message
    });
  }
};

// @desc    Approve proposal
// @route   PUT /api/v1/sales/proposals/:id/approve
// @access  Private
exports.approveProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = 'approved';
    proposal.approvedBy = req.user._id;

    await proposal.save();

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving proposal',
      error: error.message
    });
  }
};

// @desc    Send proposal to client
// @route   PUT /api/v1/sales/proposals/:id/send
// @access  Private
exports.sendProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    if (proposal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Proposal must be approved before sending'
      });
    }

    proposal.status = 'sent';
    proposal.sentAt = new Date();

    await proposal.save();

    // TODO: Implement email sending logic here

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal sent to client successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending proposal',
      error: error.message
    });
  }
};

// @desc    Mark proposal as accepted
// @route   PUT /api/v1/sales/proposals/:id/accept
// @access  Private
exports.acceptProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = 'accepted';

    await proposal.save();

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal marked as accepted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting proposal',
      error: error.message
    });
  }
};

// @desc    Mark proposal as rejected
// @route   PUT /api/v1/sales/proposals/:id/reject
// @access  Private
exports.rejectProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = 'rejected';

    await proposal.save();

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal marked as rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting proposal',
      error: error.message
    });
  }
};

// @desc    Get proposal statistics
// @route   GET /api/v1/sales/proposals/stats
// @access  Private
exports.getProposalStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { isDeleted: false };

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await ProposalGenerator.aggregate([
      { $match: query },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          aiGenerated: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } }
              }
            }
          ],
          totalValue: [
            {
              $group: {
                _id: null,
                total: { $sum: '$financial.total' },
                average: { $avg: '$financial.total' }
              }
            }
          ],
          acceptanceRate: [
            {
              $group: {
                _id: null,
                sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'accepted', 'rejected']] }, 1, 0] } },
                accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
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
      message: 'Error fetching proposal statistics',
      error: error.message
    });
  }
};

// @desc    Export proposal as PDF
// @route   GET /api/v1/sales/proposals/:id/export
// @access  Private
exports.exportProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id)
      .populate('opportunity')
      .populate('createdBy', 'name email');

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // TODO: Implement PDF generation logic
    // For now, return proposal data for export

    res.status(200).json({
      success: true,
      data: {
        proposalNumber: proposal.proposalNumber,
        client: proposal.client,
        project: proposal.project,
        technical: proposal.technical,
        financial: proposal.financial,
        generatedContent: proposal.generatedContent,
        createdAt: proposal.createdAt
      },
      message: 'Proposal data ready for export'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting proposal',
      error: error.message
    });
  }
};

// @desc    Delete proposal (soft delete)
// @route   DELETE /api/v1/sales/proposals/:id
// @access  Private
exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await ProposalGenerator.findById(req.params.id);

    if (!proposal || proposal.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.isDeleted = true;
    proposal.deletedAt = new Date();
    proposal.deletedBy = req.user._id;

    await proposal.save();

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting proposal',
      error: error.message
    });
  }
};
