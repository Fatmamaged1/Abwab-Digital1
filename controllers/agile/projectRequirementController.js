const ProjectRequirement = require('../../models/agile/projectRequirementModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all project requirements
 * @route   GET /api/agile/requirements
 * @access  Private
 */
exports.getAllRequirements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      project,
      type,
      priority,
      status,
      search,
    } = req.query;

    // Build query
    const query = {};
    if (project) query.project = project;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ar': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.ar': { $regex: search, $options: 'i' } },
        { requirementNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const requirements = await ProjectRequirement.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('dependencies', 'requirementNumber title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await ProjectRequirement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requirements,
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
      message: 'Error fetching requirements',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single requirement by ID
 * @route   GET /api/agile/requirements/:id
 * @access  Private
 */
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id)
      .populate('project', 'name description')
      .populate('assignedTo', 'name email role')
      .populate('dependencies', 'requirementNumber title status')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new requirement
 * @route   POST /api/agile/requirements
 * @access  Private
 */
exports.createRequirement = async (req, res) => {
  try {
    const requirementData = {
      ...req.body,
      createdBy: req.user._id, // Assuming req.user is set by auth middleware
    };

    const requirement = await ProjectRequirement.create(requirementData);

    // AI Analysis for complexity and risks
    if (requirement.description?.en) {
      const aiAnalysis = await aiService.analyzeRequirement({
        title: requirement.title.en,
        description: requirement.description.en,
        type: requirement.type,
      });

      if (aiAnalysis) {
        requirement.aiAnalysis = {
          complexity: aiAnalysis.complexity,
          estimatedEffort: aiAnalysis.estimatedEffort,
          risks: aiAnalysis.risks,
          suggestedTechnologies: aiAnalysis.suggestedTechnologies,
        };
        await requirement.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Requirement created successfully',
      data: requirement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Update requirement
 * @route   PUT /api/agile/requirements/:id
 * @access  Private
 */
exports.updateRequirement = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      requirement[key] = req.body[key];
    });

    requirement.lastUpdatedBy = req.user._id;
    await requirement.save();

    res.status(200).json({
      success: true,
      message: 'Requirement updated successfully',
      data: requirement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete requirement (soft delete)
 * @route   DELETE /api/agile/requirements/:id
 * @access  Private
 */
exports.deleteRequirement = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    requirement.isDeleted = true;
    requirement.deletedAt = new Date();
    requirement.deletedBy = req.user._id;
    await requirement.save();

    res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve requirement
 * @route   POST /api/agile/requirements/:id/approve
 * @access  Private (Manager/Admin)
 */
exports.approveRequirement = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    requirement.status = 'approved';
    requirement.approvedBy = req.user._id;
    requirement.approvedAt = new Date();
    await requirement.save();

    res.status(200).json({
      success: true,
      message: 'Requirement approved successfully',
      data: requirement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error approving requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Add test case to requirement
 * @route   POST /api/agile/requirements/:id/test-cases
 * @access  Private
 */
exports.addTestCase = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    requirement.testCases.push(req.body);
    await requirement.save();

    res.status(200).json({
      success: true,
      message: 'Test case added successfully',
      data: requirement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding test case',
      error: error.message,
    });
  }
};

/**
 * @desc    Get requirements statistics
 * @route   GET /api/agile/requirements/stats
 * @access  Private
 */
exports.getRequirementsStats = async (req, res) => {
  try {
    const { project } = req.query;
    const query = project ? { project } : {};

    const stats = await ProjectRequirement.getRequirementStats(query);

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
 * @desc    Analyze requirement with AI
 * @route   POST /api/agile/requirements/:id/analyze
 * @access  Private
 */
exports.analyzeRequirement = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    const aiAnalysis = await aiService.analyzeRequirement({
      title: requirement.title.en,
      description: requirement.description.en,
      type: requirement.type,
      acceptanceCriteria: requirement.acceptanceCriteria,
    });

    requirement.aiAnalysis = {
      complexity: aiAnalysis.complexity,
      estimatedEffort: aiAnalysis.estimatedEffort,
      risks: aiAnalysis.risks,
      suggestedTechnologies: aiAnalysis.suggestedTechnologies,
      recommendations: aiAnalysis.recommendations,
    };
    await requirement.save();

    res.status(200).json({
      success: true,
      message: 'Requirement analyzed successfully',
      data: requirement.aiAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing requirement',
      error: error.message,
    });
  }
};

/**
 * @desc    Get requirement dependencies
 * @route   GET /api/agile/requirements/:id/dependencies
 * @access  Private
 */
exports.getRequirementDependencies = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id)
      .populate('dependencies', 'requirementNumber title status priority');

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: requirement.dependencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dependencies',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk import requirements
 * @route   POST /api/agile/requirements/bulk-import
 * @access  Private
 */
exports.bulkImportRequirements = async (req, res) => {
  try {
    const { requirements } = req.body;

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirements array',
      });
    }

    // Add createdBy to all requirements
    const requirementsWithUser = requirements.map((req) => ({
      ...req,
      createdBy: req.user._id,
    }));

    const createdRequirements = await ProjectRequirement.insertMany(requirementsWithUser);

    res.status(201).json({
      success: true,
      message: `${createdRequirements.length} requirements imported successfully`,
      data: createdRequirements,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error importing requirements',
      error: error.message,
    });
  }
};
