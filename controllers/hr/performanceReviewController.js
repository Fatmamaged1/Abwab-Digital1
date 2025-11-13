const PerformanceReview = require('../../models/hr/performanceReviewModel');
const AIService = require('../../services/aiService');

// @desc    Get all performance reviews
// @route   GET /api/v1/hr/performance-reviews
// @access  Private
exports.getAllReviews = async (req, res) => {
  try {
    const { employee, reviewer, status, reviewType, cycle, page = 1, limit = 20 } = req.query;
    const query = {};

    if (employee) query.employee = employee;
    if (reviewer) query.reviewer = reviewer;
    if (status) query.status = status;
    if (reviewType) query.reviewType = reviewType;
    if (cycle) query.reviewCycle = cycle;

    const reviews = await PerformanceReview.find(query)
      .populate('employee', 'name email department position')
      .populate('reviewer', 'name email')
      .populate('peers', 'name email')
      .sort({ reviewDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PerformanceReview.countDocuments(query);

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
      message: 'Error fetching performance reviews',
      error: error.message
    });
  }
};

// @desc    Get single performance review
// @route   GET /api/v1/hr/performance-reviews/:id
// @access  Private
exports.getReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id)
      .populate('employee', 'name email department position avatar')
      .populate('reviewer', 'name email avatar')
      .populate('peers', 'name email avatar')
      .populate('improvementPlan.assignedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching performance review',
      error: error.message
    });
  }
};

// @desc    Get reviews by employee
// @route   GET /api/v1/hr/performance-reviews/employee/:employeeId
// @access  Private
exports.getReviewsByEmployee = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await PerformanceReview.find({ employee: req.params.employeeId })
      .populate('reviewer', 'name email')
      .sort({ reviewDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PerformanceReview.countDocuments({ employee: req.params.employeeId });

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
      message: 'Error fetching employee reviews',
      error: error.message
    });
  }
};

// @desc    Create performance review
// @route   POST /api/v1/hr/performance-reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      reviewer: req.user._id
    };

    const review = await PerformanceReview.create(reviewData);

    res.status(201).json({
      success: true,
      data: review,
      message: 'Performance review created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating performance review',
      error: error.message
    });
  }
};

// @desc    Generate review with AI insights
// @route   POST /api/v1/hr/performance-reviews/generate
// @access  Private
exports.generateReviewWithAI = async (req, res) => {
  try {
    const { employeeId, reviewCycle, reviewType = 'annual' } = req.body;

    if (!employeeId || !reviewCycle) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and review cycle are required'
      });
    }

    // Get employee data
    const Employee = require('../../models/hr/employeeModel');
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get previous reviews for AI analysis
    const previousReviews = await PerformanceReview.find({ employee: employeeId })
      .sort({ reviewDate: -1 })
      .limit(3);

    // Prepare data for AI analysis
    const performanceData = {
      employeeName: employee.name,
      position: employee.position,
      department: employee.department,
      previousReviews: previousReviews.map(review => ({
        date: review.reviewDate,
        overallScore: review.overallScore,
        ratings: review.ratings,
        strengths: review.strengths,
        weaknesses: review.weaknesses
      })),
      tenure: employee.hireDate
    };

    // Use AI to generate insights
    const aiService = new AIService();
    const aiInsights = await aiService.analyzePerformance(performanceData);

    if (!aiInsights) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate AI insights'
      });
    }

    // Create review with AI insights
    const review = await PerformanceReview.create({
      employee: employeeId,
      reviewer: req.user._id,
      reviewCycle,
      reviewType,
      reviewDate: new Date(),
      status: 'draft',
      aiInsights: {
        performanceTrend: aiInsights.trend || 'stable',
        predictedScore: aiInsights.predictedScore || 0,
        keyStrengths: aiInsights.strengths || [],
        improvementAreas: aiInsights.improvementAreas || [],
        careerRecommendations: aiInsights.careerRecommendations || [],
        riskOfAttrition: aiInsights.attritionRisk || 'low'
      },
      strengths: aiInsights.strengths || [],
      weaknesses: aiInsights.improvementAreas || []
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Performance review generated with AI successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating review with AI',
      error: error.message
    });
  }
};

// @desc    Update performance review
// @route   PUT /api/v1/hr/performance-reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        review[key] = req.body[key];
      }
    });

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Performance review updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating performance review',
      error: error.message
    });
  }
};

// @desc    Update review ratings
// @route   PUT /api/v1/hr/performance-reviews/:id/ratings
// @access  Private
exports.updateRatings = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    const { ratings } = req.body;

    if (ratings) {
      review.ratings = { ...review.ratings, ...ratings };
      // Overall score will be recalculated by pre-save hook
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Review ratings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ratings',
      error: error.message
    });
  }
};

// @desc    Add peer feedback
// @route   POST /api/v1/hr/performance-reviews/:id/peer-feedback
// @access  Private
exports.addPeerFeedback = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    const { peerId, feedback } = req.body;

    if (!review.peers.includes(peerId)) {
      review.peers.push(peerId);
    }

    if (!review.peerFeedback) {
      review.peerFeedback = [];
    }

    review.peerFeedback.push({
      peer: peerId,
      feedback,
      submittedAt: new Date()
    });

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Peer feedback added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding peer feedback',
      error: error.message
    });
  }
};

// @desc    Add comment to review
// @route   POST /api/v1/hr/performance-reviews/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    const comment = {
      author: req.user._id,
      text: req.body.text,
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

// @desc    Submit review for approval
// @route   PUT /api/v1/hr/performance-reviews/:id/submit
// @access  Private
exports.submitReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    if (review.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft reviews can be submitted'
      });
    }

    review.status = 'pending';
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Review submitted for approval successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// @desc    Approve review
// @route   PUT /api/v1/hr/performance-reviews/:id/approve
// @access  Private
exports.approveReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending reviews can be approved'
      });
    }

    review.status = 'approved';
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Review approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving review',
      error: error.message
    });
  }
};

// @desc    Complete review
// @route   PUT /api/v1/hr/performance-reviews/:id/complete
// @access  Private
exports.completeReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    if (review.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved reviews can be completed'
      });
    }

    review.status = 'completed';
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Review completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing review',
      error: error.message
    });
  }
};

// @desc    Create improvement plan
// @route   POST /api/v1/hr/performance-reviews/:id/improvement-plan
// @access  Private
exports.createImprovementPlan = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    const { goals, timeline, resources, checkInFrequency } = req.body;

    review.improvementPlan = {
      goals: goals || [],
      timeline,
      resources: resources || [],
      checkInFrequency,
      assignedBy: req.user._id,
      createdAt: new Date()
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Improvement plan created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating improvement plan',
      error: error.message
    });
  }
};

// @desc    Update improvement plan progress
// @route   PUT /api/v1/hr/performance-reviews/:id/improvement-plan/progress
// @access  Private
exports.updateImprovementProgress = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    if (!review.improvementPlan) {
      return res.status(400).json({
        success: false,
        message: 'No improvement plan exists for this review'
      });
    }

    const { progress, notes } = req.body;

    if (progress !== undefined) {
      review.improvementPlan.progress = progress;
    }

    if (notes) {
      review.improvementPlan.notes = notes;
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Improvement plan progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating improvement plan progress',
      error: error.message
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/v1/hr/performance-reviews/stats
// @access  Private
exports.getReviewStatistics = async (req, res) => {
  try {
    const { department, reviewCycle, startDate, endDate } = req.query;
    const query = {};

    if (department) query['employee.department'] = department;
    if (reviewCycle) query.reviewCycle = reviewCycle;
    if (startDate && endDate) {
      query.reviewDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await PerformanceReview.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgScore: { $avg: '$overallScore' },
                highPerformers: {
                  $sum: { $cond: [{ $gte: ['$overallScore', 4] }, 1, 0] }
                },
                lowPerformers: {
                  $sum: { $cond: [{ $lte: ['$overallScore', 2] }, 1, 0] }
                }
              }
            }
          ],
          byDepartment: [
            {
              $group: {
                _id: '$employeeData.department',
                count: { $sum: 1 },
                avgScore: { $avg: '$overallScore' }
              }
            },
            { $sort: { avgScore: -1 } }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byReviewType: [
            {
              $group: {
                _id: '$reviewType',
                count: { $sum: 1 },
                avgScore: { $avg: '$overallScore' }
              }
            }
          ],
          scoreDistribution: [
            {
              $bucket: {
                groupBy: '$overallScore',
                boundaries: [0, 1, 2, 3, 4, 5],
                default: 'other',
                output: {
                  count: { $sum: 1 }
                }
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
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

// @desc    Get employee performance trends
// @route   GET /api/v1/hr/performance-reviews/employee/:employeeId/trends
// @access  Private
exports.getEmployeePerformanceTrends = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({ employee: req.params.employeeId })
      .select('reviewDate overallScore ratings reviewCycle')
      .sort({ reviewDate: 1 });

    const trends = reviews.map(review => ({
      date: review.reviewDate,
      cycle: review.reviewCycle,
      overallScore: review.overallScore,
      ratings: review.ratings
    }));

    // Calculate trend direction
    const scores = reviews.map(r => r.overallScore);
    const avgChange =
      scores.length > 1
        ? scores.reduce((sum, score, i) => {
            if (i === 0) return 0;
            return sum + (score - scores[i - 1]);
          }, 0) /
          (scores.length - 1)
        : 0;

    const trendDirection =
      avgChange > 0.2 ? 'improving' : avgChange < -0.2 ? 'declining' : 'stable';

    res.status(200).json({
      success: true,
      data: {
        trends,
        summary: {
          totalReviews: reviews.length,
          currentScore: scores[scores.length - 1] || null,
          avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length || 0,
          trendDirection,
          avgChange: avgChange.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee performance trends',
      error: error.message
    });
  }
};

// @desc    Delete performance review
// @route   DELETE /api/v1/hr/performance-reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Performance review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting performance review',
      error: error.message
    });
  }
};
