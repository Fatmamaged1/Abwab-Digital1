const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema({
  reviewNumber: {
    type: String,
    unique: true,
    // Auto-generated: REV2025000001
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeModel',
    required: [true, 'Employee reference is required'],
    index: true,
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  reviewType: {
    type: String,
    enum: ['quarterly', 'semi-annual', 'annual', 'probation', 'promotion', 'project-based'],
    required: [true, 'Review type is required'],
  },
  status: {
    type: String,
    enum: ['draft', 'self-assessment', 'manager-review', 'hr-review', 'completed', 'acknowledged'],
    default: 'draft',
    index: true,
  },
  // Self-Assessment
  selfAssessment: {
    completedAt: Date,
    metrics: [
      {
        category: {
          type: String,
          enum: ['technical-skills', 'soft-skills', 'leadership', 'communication', 'teamwork', 'productivity', 'innovation'],
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        comments: String,
      },
    ],
    achievements: [
      {
        description: {
          type: String,
          required: true,
        },
        impact: String,
        date: Date,
      },
    ],
    challenges: [
      {
        description: String,
        impact: String,
        resolution: String,
      },
    ],
    goals: [
      {
        description: String,
        status: {
          type: String,
          enum: ['not-started', 'in-progress', 'completed', 'partially-completed', 'not-achieved'],
        },
        completionRate: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    developmentNeeds: [String],
    overallComments: String,
  },
  // Manager Assessment
  managerAssessment: {
    completedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metrics: [
      {
        category: {
          type: String,
          enum: ['technical-skills', 'soft-skills', 'leadership', 'communication', 'teamwork', 'productivity', 'innovation'],
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        comments: String,
        examples: [String],
      },
    ],
    strengths: [
      {
        area: String,
        description: String,
        examples: [String],
      },
    ],
    areasForImprovement: [
      {
        area: String,
        description: String,
        suggestions: [String],
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
    ],
    overallPerformance: {
      type: String,
      enum: ['exceeds-expectations', 'meets-expectations', 'needs-improvement', 'unsatisfactory'],
    },
    comments: String,
    promotionRecommendation: {
      recommended: {
        type: Boolean,
        default: false,
      },
      proposedRole: String,
      reasoning: String,
    },
    salaryRecommendation: {
      recommended: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['increment', 'bonus', 'both'],
      },
      incrementPercentage: Number,
      bonusAmount: Number,
      reasoning: String,
    },
  },
  // HR Assessment
  hrAssessment: {
    completedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    careerDevelopment: {
      currentLevel: String,
      suggestedPath: String,
      trainingRecommendations: [
        {
          course: String,
          provider: String,
          priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
          estimatedCost: Number,
          timeline: String,
        },
      ],
      mentorshipNeeds: {
        required: Boolean,
        areas: [String],
        suggestedMentor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EmployeeModel',
        },
      },
    },
    compensationReview: {
      currentSalary: Number,
      marketComparison: {
        type: String,
        enum: ['below-market', 'at-market', 'above-market'],
      },
      recommendation: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    retentionRisk: {
      level: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      factors: [String],
      mitigationPlan: String,
    },
    comments: String,
  },
  // Goals for Next Period
  nextPeriodGoals: [
    {
      goal: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        enum: ['technical', 'soft-skills', 'leadership', 'project', 'personal-development'],
      },
      targetDate: Date,
      metrics: String,
      priority: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  ],
  // AI Analysis
  aiAnalysis: {
    sentimentScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Overall sentiment from all comments',
    },
    keyThemes: [
      {
        theme: String,
        frequency: Number,
        sentiment: {
          type: String,
          enum: ['positive', 'neutral', 'negative'],
        },
      },
    ],
    careerPathSuggestions: [
      {
        path: String,
        reasoning: String,
        skills: [String],
        timeline: String,
        probability: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    performanceTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    recommendations: [String],
    attritionRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      factors: [String],
      recommendations: [String],
    },
  },
  // Ratings Summary
  ratings: {
    selfAverage: {
      type: Number,
      min: 0,
      max: 5,
    },
    managerAverage: {
      type: Number,
      min: 0,
      max: 5,
    },
    finalAverage: {
      type: Number,
      min: 0,
      max: 5,
    },
    variance: {
      type: Number,
      description: 'Difference between self and manager ratings',
    },
  },
  // Acknowledgment
  acknowledgment: {
    acknowledgedAt: Date,
    employeeComments: String,
    employeeSignature: {
      type: Boolean,
      default: false,
    },
  },
  // Metadata
  scheduledDate: Date,
  completedDate: Date,
  dueDate: Date,
  isOverdue: {
    type: Boolean,
    default: false,
  },
  attachments: [
    {
      filename: String,
      path: String,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-generate review number
performanceReviewSchema.pre('save', async function (next) {
  if (!this.reviewNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      reviewNumber: new RegExp(`^REV${year}`),
    });
    this.reviewNumber = `REV${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate self-assessment average
  if (this.selfAssessment?.metrics?.length > 0) {
    const totalRating = this.selfAssessment.metrics.reduce((sum, m) => sum + m.rating, 0);
    this.ratings.selfAverage = Math.round((totalRating / this.selfAssessment.metrics.length) * 10) / 10;
  }

  // Calculate manager assessment average
  if (this.managerAssessment?.metrics?.length > 0) {
    const totalRating = this.managerAssessment.metrics.reduce((sum, m) => sum + m.rating, 0);
    this.ratings.managerAverage = Math.round((totalRating / this.managerAssessment.metrics.length) * 10) / 10;
  }

  // Calculate final average and variance
  if (this.ratings.selfAverage && this.ratings.managerAverage) {
    this.ratings.finalAverage = Math.round(((this.ratings.selfAverage + this.ratings.managerAverage) / 2) * 10) / 10;
    this.ratings.variance = Math.round((this.ratings.selfAverage - this.ratings.managerAverage) * 10) / 10;
  }

  // Check if overdue
  if (this.dueDate && this.status !== 'completed' && this.status !== 'acknowledged') {
    this.isOverdue = new Date() > this.dueDate;
  }

  next();
});

// Indexes
performanceReviewSchema.index({ reviewNumber: 1 });
performanceReviewSchema.index({ employee: 1, 'reviewPeriod.startDate': -1 });
performanceReviewSchema.index({ status: 1 });
performanceReviewSchema.index({ dueDate: 1 });

// Virtual for completion percentage
performanceReviewSchema.virtual('completionPercentage').get(function () {
  let completed = 0;
  const total = 4; // self, manager, hr, acknowledgment

  if (this.selfAssessment?.completedAt) completed++;
  if (this.managerAssessment?.completedAt) completed++;
  if (this.hrAssessment?.completedAt) completed++;
  if (this.acknowledgment?.acknowledgedAt) completed++;

  return Math.round((completed / total) * 100);
});

// Virtual for performance level
performanceReviewSchema.virtual('performanceLevel').get(function () {
  if (!this.ratings.finalAverage) return 'not-rated';
  if (this.ratings.finalAverage >= 4.5) return 'exceptional';
  if (this.ratings.finalAverage >= 3.5) return 'exceeds-expectations';
  if (this.ratings.finalAverage >= 2.5) return 'meets-expectations';
  if (this.ratings.finalAverage >= 1.5) return 'needs-improvement';
  return 'unsatisfactory';
});

// Method to complete self-assessment
performanceReviewSchema.methods.completeSelfAssessment = function (assessmentData) {
  this.selfAssessment = {
    ...assessmentData,
    completedAt: new Date(),
  };
  this.status = 'manager-review';
};

// Method to complete manager assessment
performanceReviewSchema.methods.completeManagerAssessment = function (assessmentData, managerId) {
  this.managerAssessment = {
    ...assessmentData,
    completedAt: new Date(),
    reviewedBy: managerId,
  };
  this.status = 'hr-review';
};

// Method to complete HR assessment
performanceReviewSchema.methods.completeHRAssessment = function (assessmentData, hrId) {
  this.hrAssessment = {
    ...assessmentData,
    completedAt: new Date(),
    reviewedBy: hrId,
  };
  this.status = 'completed';
  this.completedDate = new Date();
};

// Method to acknowledge review
performanceReviewSchema.methods.acknowledge = function (comments) {
  this.acknowledgment = {
    acknowledgedAt: new Date(),
    employeeComments: comments,
    employeeSignature: true,
  };
  this.status = 'acknowledged';
};

// Static method to get review statistics
performanceReviewSchema.statics.getReviewStatistics = async function (filters = {}) {
  const reviews = await this.find(filters);

  return {
    total: reviews.length,
    byStatus: {
      draft: reviews.filter((r) => r.status === 'draft').length,
      inProgress: reviews.filter((r) => ['self-assessment', 'manager-review', 'hr-review'].includes(r.status)).length,
      completed: reviews.filter((r) => r.status === 'completed').length,
      acknowledged: reviews.filter((r) => r.status === 'acknowledged').length,
    },
    averageRating: reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + (r.ratings.finalAverage || 0), 0) / reviews.length) * 10
        ) / 10
      : 0,
    performanceDistribution: {
      exceptional: reviews.filter((r) => r.performanceLevel === 'exceptional').length,
      exceedsExpectations: reviews.filter((r) => r.performanceLevel === 'exceeds-expectations').length,
      meetsExpectations: reviews.filter((r) => r.performanceLevel === 'meets-expectations').length,
      needsImprovement: reviews.filter((r) => r.performanceLevel === 'needs-improvement').length,
      unsatisfactory: reviews.filter((r) => r.performanceLevel === 'unsatisfactory').length,
    },
    overdue: reviews.filter((r) => r.isOverdue).length,
  };
};

// Static method to get employee review history
performanceReviewSchema.statics.getEmployeeHistory = async function (employeeId, limit = 5) {
  return this.find({ employee: employeeId })
    .sort({ 'reviewPeriod.startDate': -1 })
    .limit(limit)
    .populate('managerAssessment.reviewedBy', 'name email')
    .populate('hrAssessment.reviewedBy', 'name email');
};

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
