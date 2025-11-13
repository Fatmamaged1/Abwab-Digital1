const mongoose = require('mongoose');

const codeReviewSchema = new mongoose.Schema({
  reviewNumber: {
    type: String,
    unique: true,
    // Auto-generated: CR2025000001
  },
  pullRequest: {
    prNumber: {
      type: String,
      required: true,
    },
    url: String,
    title: String,
  },
  repository: {
    type: String,
    required: [true, 'Repository name is required'],
  },
  branch: {
    source: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
      default: 'main',
    },
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true,
  },
  reviewers: [
    {
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'changes-requested', 'commented'],
        default: 'pending',
      },
      reviewedAt: Date,
    },
  ],
  files: [
    {
      path: {
        type: String,
        required: true,
      },
      additions: {
        type: Number,
        min: 0,
        default: 0,
      },
      deletions: {
        type: Number,
        min: 0,
        default: 0,
      },
      changes: {
        type: Number,
        min: 0,
        default: 0,
      },
      status: {
        type: String,
        enum: ['added', 'modified', 'deleted', 'renamed'],
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'changes-requested', 'rejected', 'merged', 'closed'],
    default: 'pending',
    index: true,
  },
  // AI Code Analysis
  aiAnalysis: {
    codeQualityScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Overall code quality score',
    },
    securityIssues: [
      {
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          required: true,
        },
        type: {
          type: String,
          enum: ['sql-injection', 'xss', 'auth', 'encryption', 'cors', 'dependency', 'other'],
        },
        file: String,
        line: Number,
        description: String,
        suggestion: String,
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    performanceIssues: [
      {
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        file: String,
        line: Number,
        description: String,
        suggestion: String,
        impact: String,
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    bestPracticeViolations: [
      {
        rule: String,
        file: String,
        line: Number,
        description: String,
        suggestion: String,
        category: {
          type: String,
          enum: ['naming', 'structure', 'documentation', 'testing', 'error-handling', 'other'],
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    complexity: {
      type: Number,
      min: 1,
      max: 10,
      description: 'Code complexity score (1=simple, 10=very complex)',
    },
    maintainability: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
    },
    testCoverage: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Estimated test coverage percentage',
    },
    overallRecommendations: [String],
    analyzedAt: Date,
  },
  // Manual Comments
  comments: [
    {
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      file: String,
      line: Number,
      comment: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['suggestion', 'question', 'issue', 'praise'],
        default: 'suggestion',
      },
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Metrics
  metrics: {
    totalLinesChanged: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAdditions: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalDeletions: {
      type: Number,
      min: 0,
      default: 0,
    },
    filesChanged: {
      type: Number,
      min: 0,
      default: 0,
    },
    reviewTime: {
      type: Number, // in minutes
      min: 0,
    },
    timeToMerge: {
      type: Number, // in hours
      min: 0,
    },
  },
  // Related Items
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  linkedIssues: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
    },
  ],
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  firstReviewAt: Date,
  approvedAt: Date,
  mergedAt: Date,
  closedAt: Date,
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-generate review number
codeReviewSchema.pre('save', async function (next) {
  if (!this.reviewNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      reviewNumber: new RegExp(`^CR${year}`),
    });
    this.reviewNumber = `CR${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate metrics
  if (this.files && this.files.length > 0) {
    this.metrics.filesChanged = this.files.length;
    this.metrics.totalAdditions = this.files.reduce((sum, file) => sum + file.additions, 0);
    this.metrics.totalDeletions = this.files.reduce((sum, file) => sum + file.deletions, 0);
    this.metrics.totalLinesChanged = this.metrics.totalAdditions + this.metrics.totalDeletions;
  }

  next();
});

// Indexes
codeReviewSchema.index({ repository: 1, status: 1 });
codeReviewSchema.index({ author: 1, createdAt: -1 });
codeReviewSchema.index({ 'reviewers.reviewer': 1, 'reviewers.status': 1 });
codeReviewSchema.index({ project: 1 });
codeReviewSchema.index({ sprint: 1 });

// Virtual for approval status
codeReviewSchema.virtual('isApproved').get(function () {
  if (!this.reviewers || this.reviewers.length === 0) return false;
  return this.reviewers.every((r) => r.status === 'approved');
});

// Virtual for changes requested
codeReviewSchema.virtual('hasChangesRequested').get(function () {
  if (!this.reviewers || this.reviewers.length === 0) return false;
  return this.reviewers.some((r) => r.status === 'changes-requested');
});

// Virtual for unresolved comments count
codeReviewSchema.virtual('unresolvedCommentsCount').get(function () {
  if (!this.comments || this.comments.length === 0) return 0;
  return this.comments.filter((c) => !c.resolved).length;
});

// Virtual for critical security issues count
codeReviewSchema.virtual('criticalIssuesCount').get(function () {
  if (!this.aiAnalysis || !this.aiAnalysis.securityIssues) return 0;
  return this.aiAnalysis.securityIssues.filter((issue) => issue.severity === 'critical' && !issue.resolved).length;
});

// Virtual for review duration
codeReviewSchema.virtual('reviewDuration').get(function () {
  if (!this.submittedAt || !this.approvedAt) return null;
  const diff = this.approvedAt - this.submittedAt;
  return Math.round(diff / (1000 * 60)); // in minutes
});

// Method to approve review
codeReviewSchema.methods.approveByReviewer = function (reviewerId) {
  const reviewer = this.reviewers.find((r) => r.reviewer.toString() === reviewerId.toString());
  if (reviewer) {
    reviewer.status = 'approved';
    reviewer.reviewedAt = new Date();

    if (!this.firstReviewAt) {
      this.firstReviewAt = new Date();
    }

    // Check if all reviewers approved
    if (this.isApproved) {
      this.status = 'approved';
      this.approvedAt = new Date();
    }
  }
};

// Method to request changes
codeReviewSchema.methods.requestChangesByReviewer = function (reviewerId) {
  const reviewer = this.reviewers.find((r) => r.reviewer.toString() === reviewerId.toString());
  if (reviewer) {
    reviewer.status = 'changes-requested';
    reviewer.reviewedAt = new Date();

    if (!this.firstReviewAt) {
      this.firstReviewAt = new Date();
    }

    this.status = 'changes-requested';
  }
};

// Static method to get average review time
codeReviewSchema.statics.getAverageReviewTime = async function (filters = {}) {
  const reviews = await this.find({
    ...filters,
    status: 'approved',
    approvedAt: { $exists: true },
  }).select('submittedAt approvedAt');

  if (reviews.length === 0) return 0;

  const totalTime = reviews.reduce((sum, review) => {
    const duration = review.approvedAt - review.submittedAt;
    return sum + duration;
  }, 0);

  return Math.round(totalTime / reviews.length / (1000 * 60)); // in minutes
};

module.exports = mongoose.model('CodeReview', codeReviewSchema);
