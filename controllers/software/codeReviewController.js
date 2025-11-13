const CodeReview = require('../../models/software/codeReviewModel');
const AIService = require('../../services/aiService');

// @desc    Get all code reviews
// @route   GET /api/v1/software/code-reviews
// @access  Private
exports.getAllCodeReviews = async (req, res) => {
  try {
    const { status, author, repository, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (author) query.author = author;
    if (repository) query.repository = repository;

    const reviews = await CodeReview.find(query)
      .populate('author', 'name email avatar')
      .populate('reviewers', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await CodeReview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching code reviews',
      error: error.message
    });
  }
};

// @desc    Get single code review
// @route   GET /api/v1/software/code-reviews/:id
// @access  Private
exports.getCodeReview = async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('reviewers', 'name email avatar')
      .populate('comments.reviewer', 'name email avatar');

    if (!review || review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Code review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching code review',
      error: error.message
    });
  }
};

// @desc    Create code review
// @route   POST /api/v1/software/code-reviews
// @access  Private
exports.createCodeReview = async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      author: req.user._id
    };

    const review = await CodeReview.create(reviewData);

    // Use AI to analyze code (if code content provided)
    if (req.body.codeContent) {
      const aiService = new AIService();
      const aiAnalysis = await aiService.analyzeCodeQuality(req.body.codeContent);

      if (aiAnalysis) {
        review.aiAnalysis = {
          codeQualityScore: aiAnalysis.qualityScore || 0,
          securityIssues: aiAnalysis.securityIssues || [],
          performanceIssues: aiAnalysis.performanceIssues || [],
          bestPracticeViolations: aiAnalysis.bestPracticeViolations || [],
          complexity: aiAnalysis.complexity || 0,
          maintainability: aiAnalysis.maintainability || 'medium',
          testCoverage: aiAnalysis.testCoverage || 0,
          suggestions: aiAnalysis.suggestions || []
        };

        await review.save();
      }
    }

    res.status(201).json({
      success: true,
      data: review,
      message: 'Code review created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating code review',
      error: error.message
    });
  }
};

// @desc    Update code review status
// @route   PUT /api/v1/software/code-reviews/:id/status
// @access  Private
exports.updateReviewStatus = async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);

    if (!review || review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Code review not found'
      });
    }

    review.status = req.body.status;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Review status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review status',
      error: error.message
    });
  }
};

// @desc    Add comment to code review
// @route   POST /api/v1/software/code-reviews/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);

    if (!review || review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Code review not found'
      });
    }

    const comment = {
      reviewer: req.user._id,
      line: req.body.line,
      file: req.body.file,
      comment: req.body.comment,
      resolved: false,
      timestamp: new Date()
    };

    review.comments.push(comment);
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Comment added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Resolve comment
// @route   PUT /api/v1/software/code-reviews/:id/comments/:commentId/resolve
// @access  Private
exports.resolveComment = async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);

    if (!review || review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Code review not found'
      });
    }

    const comment = review.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.resolved = true;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Comment resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving comment',
      error: error.message
    });
  }
};

// @desc    Delete code review (soft delete)
// @route   DELETE /api/v1/software/code-reviews/:id
// @access  Private
exports.deleteCodeReview = async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);

    if (!review || review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Code review not found'
      });
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    review.deletedBy = req.user._id;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Code review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting code review',
      error: error.message
    });
  }
};
