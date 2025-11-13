const BRD = require('../../models/agile/brdModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all BRDs
 * @route   GET /api/agile/brds
 * @access  Private
 */
exports.getAllBRDs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      project,
      status,
      search,
    } = req.query;

    const query = { isDeleted: false };
    if (project) query.project = project;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'projectName.en': { $regex: search, $options: 'i' } },
        { 'projectName.ar': { $regex: search, $options: 'i' } },
        { brdNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const brds = await BRD.find(query)
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.approvedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await BRD.countDocuments(query);

    res.status(200).json({
      success: true,
      data: brds,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching BRDs',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single BRD by ID
 * @route   GET /api/agile/brds/:id
 * @access  Private
 */
exports.getBRDById = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id)
      .populate('project', 'name description budget timeline')
      .populate('createdBy', 'name email role')
      .populate('approvals.approvedBy', 'name email role')
      .populate('versionHistory.updatedBy', 'name email');

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    res.status(200).json({
      success: true,
      data: brd,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new BRD
 * @route   POST /api/agile/brds
 * @access  Private
 */
exports.createBRD = async (req, res) => {
  try {
    const brdData = {
      ...req.body,
      createdBy: req.user._id,
      version: 1.0,
    };

    const brd = await BRD.create(brdData);

    res.status(201).json({
      success: true,
      message: 'BRD created successfully',
      data: brd,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Update BRD
 * @route   PUT /api/agile/brds/:id
 * @access  Private
 */
exports.updateBRD = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id);

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    // Save current version to history before updating
    brd.versionHistory.push({
      version: brd.version,
      updatedBy: req.user._id,
      changes: req.body.changes || 'Updated',
      snapshot: brd.toObject(),
    });

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== 'version' && key !== 'versionHistory') {
        brd[key] = req.body[key];
      }
    });

    // Increment version
    brd.version = parseFloat((brd.version + 0.1).toFixed(1));
    await brd.save();

    res.status(200).json({
      success: true,
      message: 'BRD updated successfully',
      data: brd,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete BRD (soft delete)
 * @route   DELETE /api/agile/brds/:id
 * @access  Private
 */
exports.deleteBRD = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id);

    if (!brd) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    brd.isDeleted = true;
    brd.deletedAt = new Date();
    brd.deletedBy = req.user._id;
    await brd.save();

    res.status(200).json({
      success: true,
      message: 'BRD deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate BRD analysis with AI
 * @route   POST /api/agile/brds/:id/analyze
 * @access  Private
 */
exports.analyzeBRD = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id);

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    // Prepare BRD content for AI analysis
    const brdContent = {
      projectName: brd.projectName.en,
      objectives: brd.objectives.businessObjectives.map((o) => o.en).join('\n'),
      scope: brd.scope.inScope.map((s) => s.en).join('\n'),
      functionalRequirements: brd.functionalRequirements.map((r) => r.en).join('\n'),
    };

    const aiAnalysis = await aiService.analyzeBRD(brdContent);

    if (aiAnalysis) {
      brd.aiAnalysis = {
        feasibilityScore: aiAnalysis.feasibilityScore,
        estimatedComplexity: aiAnalysis.estimatedComplexity,
        riskAssessment: aiAnalysis.riskAssessment,
        recommendations: aiAnalysis.recommendations,
        missingRequirements: aiAnalysis.missingRequirements,
      };
      await brd.save();
    }

    res.status(200).json({
      success: true,
      message: 'BRD analyzed successfully',
      data: brd.aiAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate epics from BRD
 * @route   POST /api/agile/brds/:id/generate-epics
 * @access  Private
 */
exports.generateEpics = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id);

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    const generatedEpics = await aiService.generateEpicsFromBRD(brd);

    if (generatedEpics && generatedEpics.epics) {
      brd.generatedEpics = generatedEpics.epics;
      await brd.save();
    }

    res.status(200).json({
      success: true,
      message: 'Epics generated successfully',
      data: generatedEpics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating epics',
      error: error.message,
    });
  }
};

/**
 * @desc    Add approval to BRD
 * @route   POST /api/agile/brds/:id/approve
 * @access  Private
 */
exports.approveBRD = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id);

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    const { role, comments } = req.body;

    brd.approvals.push({
      approvedBy: req.user._id,
      role,
      comments,
      approvedAt: new Date(),
    });

    // Check if all required approvals are received
    const requiredRoles = ['project-manager', 'technical-lead', 'business-analyst'];
    const approvedRoles = brd.approvals.map((a) => a.role);
    const allApproved = requiredRoles.every((role) => approvedRoles.includes(role));

    if (allApproved && brd.status === 'pending-approval') {
      brd.status = 'approved';
    }

    await brd.save();

    res.status(200).json({
      success: true,
      message: 'BRD approved successfully',
      data: brd,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error approving BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Get BRD version history
 * @route   GET /api/agile/brds/:id/history
 * @access  Private
 */
exports.getBRDHistory = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id)
      .select('versionHistory')
      .populate('versionHistory.updatedBy', 'name email');

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    res.status(200).json({
      success: true,
      data: brd.versionHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching BRD history',
      error: error.message,
    });
  }
};

/**
 * @desc    Export BRD to PDF (placeholder - requires PDF library)
 * @route   GET /api/agile/brds/:id/export
 * @access  Private
 */
exports.exportBRD = async (req, res) => {
  try {
    const brd = await BRD.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name email');

    if (!brd || brd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    // TODO: Implement PDF generation using a library like puppeteer or pdfkit
    // For now, returning JSON
    res.status(200).json({
      success: true,
      message: 'BRD export (PDF generation to be implemented)',
      data: brd,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting BRD',
      error: error.message,
    });
  }
};

/**
 * @desc    Clone BRD
 * @route   POST /api/agile/brds/:id/clone
 * @access  Private
 */
exports.cloneBRD = async (req, res) => {
  try {
    const originalBrd = await BRD.findById(req.params.id);

    if (!originalBrd || originalBrd.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'BRD not found',
      });
    }

    const clonedBrdData = originalBrd.toObject();
    delete clonedBrdData._id;
    delete clonedBrdData.brdNumber;
    delete clonedBrdData.createdAt;
    delete clonedBrdData.updatedAt;
    delete clonedBrdData.approvals;
    delete clonedBrdData.versionHistory;

    clonedBrdData.version = 1.0;
    clonedBrdData.status = 'draft';
    clonedBrdData.createdBy = req.user._id;
    clonedBrdData.projectName.en = `${clonedBrdData.projectName.en} (Copy)`;
    clonedBrdData.projectName.ar = `${clonedBrdData.projectName.ar} (نسخة)`;

    const clonedBrd = await BRD.create(clonedBrdData);

    res.status(201).json({
      success: true,
      message: 'BRD cloned successfully',
      data: clonedBrd,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error cloning BRD',
      error: error.message,
    });
  }
};
