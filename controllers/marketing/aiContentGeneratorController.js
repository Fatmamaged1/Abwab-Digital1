const AIContentGenerator = require('../../models/marketing/aiContentGeneratorModel');
const AIService = require('../../services/aiService');

// @desc    Get all AI content generation requests
// @route   GET /api/v1/marketing/ai-content
// @access  Private
exports.getAllRequests = async (req, res) => {
  try {
    const { type, language, approved, usedByUser, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (language) query.language = language;
    if (approved !== undefined) query.approved = approved === 'true';
    if (usedByUser) query.usedByUser = usedByUser;

    const requests = await AIContentGenerator.find(query)
      .populate('usedByUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AIContentGenerator.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching AI content requests',
      error: error.message
    });
  }
};

// @desc    Get single AI content request
// @route   GET /api/v1/marketing/ai-content/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id)
      .populate('usedByUser', 'name email avatar');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching AI content request',
      error: error.message
    });
  }
};

// @desc    Generate content with AI
// @route   POST /api/v1/marketing/ai-content/generate
// @access  Private
exports.generateContent = async (req, res) => {
  try {
    const {
      type,
      language,
      tone,
      topic,
      keywords,
      targetAudience,
      platform,
      maxLength
    } = req.body;

    // Generate unique request ID
    const requestId = `AICONTENT${Date.now()}`;

    // Use AI service to generate content
    const aiService = new AIService();
    const generatedContent = await aiService.generatePostCaption({
      language,
      tone,
      topic,
      keywords,
      targetAudience,
      platform,
      maxLength
    });

    if (!generatedContent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate content'
      });
    }

    // Create content generation record
    const contentRequest = await AIContentGenerator.create({
      requestId,
      type,
      language,
      tone,
      topic,
      keywords: keywords || [],
      targetAudience,
      platform,
      maxLength,
      generatedContent: {
        ar: generatedContent.ar || '',
        en: generatedContent.en || '',
        variations: generatedContent.variations || []
      },
      usedByUser: req.user._id
    });

    res.status(201).json({
      success: true,
      data: contentRequest,
      message: 'Content generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating content',
      error: error.message
    });
  }
};

// @desc    Regenerate content with new parameters
// @route   POST /api/v1/marketing/ai-content/:id/regenerate
// @access  Private
exports.regenerateContent = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    // Update parameters if provided
    if (req.body.tone) request.tone = req.body.tone;
    if (req.body.keywords) request.keywords = req.body.keywords;
    if (req.body.targetAudience) request.targetAudience = req.body.targetAudience;
    if (req.body.maxLength) request.maxLength = req.body.maxLength;

    // Regenerate content
    const aiService = new AIService();
    const generatedContent = await aiService.generatePostCaption({
      language: request.language,
      tone: request.tone,
      topic: request.topic,
      keywords: request.keywords,
      targetAudience: request.targetAudience,
      platform: request.platform,
      maxLength: request.maxLength
    });

    if (!generatedContent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate content'
      });
    }

    request.generatedContent = {
      ar: generatedContent.ar || request.generatedContent.ar,
      en: generatedContent.en || request.generatedContent.en,
      variations: generatedContent.variations || []
    };

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
      message: 'Content regenerated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating content',
      error: error.message
    });
  }
};

// @desc    Approve generated content
// @route   PUT /api/v1/marketing/ai-content/:id/approve
// @access  Private
exports.approveContent = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    request.approved = true;
    request.rating = req.body.rating || null;
    request.feedback = req.body.feedback || '';

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
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

// @desc    Rate generated content
// @route   PUT /api/v1/marketing/ai-content/:id/rate
// @access  Private
exports.rateContent = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    const { rating, feedback } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    request.rating = rating;
    request.feedback = feedback || request.feedback;

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
      message: 'Content rated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rating content',
      error: error.message
    });
  }
};

// @desc    Get content variations
// @route   GET /api/v1/marketing/ai-content/:id/variations
// @access  Private
exports.getVariations = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        variations: request.generatedContent.variations,
        count: request.generatedContent.variations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching variations',
      error: error.message
    });
  }
};

// @desc    Generate additional variations
// @route   POST /api/v1/marketing/ai-content/:id/variations
// @access  Private
exports.generateVariations = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    const aiService = new AIService();
    const newContent = await aiService.generatePostCaption({
      language: request.language,
      tone: request.tone,
      topic: request.topic,
      keywords: request.keywords,
      targetAudience: request.targetAudience,
      platform: request.platform,
      maxLength: request.maxLength
    });

    if (newContent && newContent.variations) {
      request.generatedContent.variations.push(...newContent.variations);
      await request.save();
    }

    res.status(200).json({
      success: true,
      data: request,
      message: 'Additional variations generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating variations',
      error: error.message
    });
  }
};

// @desc    Get content generation statistics
// @route   GET /api/v1/marketing/ai-content/stats
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, usedByUser } = req.query;
    const query = {};

    if (usedByUser) query.usedByUser = usedByUser;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await AIContentGenerator.aggregate([
      { $match: query },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byLanguage: [
            { $group: { _id: '$language', count: { $sum: 1 } } }
          ],
          byTone: [
            { $group: { _id: '$tone', count: { $sum: 1 } } }
          ],
          byPlatform: [
            { $group: { _id: '$platform', count: { $sum: 1 } } }
          ],
          approvalRate: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                approved: { $sum: { $cond: ['$approved', 1, 0] } },
                avgRating: { $avg: '$rating' }
              }
            }
          ],
          topUsers: [
            {
              $group: {
                _id: '$usedByUser',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
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
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// @desc    Export content
// @route   GET /api/v1/marketing/ai-content/:id/export
// @access  Private
exports.exportContent = async (req, res) => {
  try {
    const request = await AIContentGenerator.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    const exportData = {
      requestId: request.requestId,
      type: request.type,
      topic: request.topic,
      generatedAt: request.createdAt,
      content: {
        arabic: request.generatedContent.ar,
        english: request.generatedContent.en,
        variations: request.generatedContent.variations
      },
      metadata: {
        tone: request.tone,
        platform: request.platform,
        keywords: request.keywords,
        targetAudience: request.targetAudience
      }
    };

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting content',
      error: error.message
    });
  }
};

// @desc    Delete AI content request
// @route   DELETE /api/v1/marketing/ai-content/:id
// @access  Private
exports.deleteRequest = async (req, res) => {
  try {
    const request = await AIContentGenerator.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'AI content request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'AI content request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting AI content request',
      error: error.message
    });
  }
};
