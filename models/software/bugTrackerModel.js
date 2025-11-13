const mongoose = require('mongoose');

const bugTrackerSchema = new mongoose.Schema({
  bugNumber: {
    type: String,
    unique: true,
    // Auto-generated: BUG2025000001
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    index: true,
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    index: true,
  },
  title: {
    ar: {
      type: String,
      required: [true, 'Arabic title is required'],
      trim: true,
    },
    en: {
      type: String,
      required: [true, 'English title is required'],
      trim: true,
    },
  },
  description: {
    ar: {
      type: String,
      required: [true, 'Arabic description is required'],
    },
    en: {
      type: String,
      required: [true, 'English description is required'],
    },
  },
  stepsToReproduce: [
    {
      stepNumber: Number,
      description: String,
    },
  ],
  expectedBehavior: {
    ar: String,
    en: String,
  },
  actualBehavior: {
    ar: String,
    en: String,
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: [true, 'Severity is required'],
    index: true,
  },
  priority: {
    type: String,
    enum: ['p0', 'p1', 'p2', 'p3', 'p4'],
    required: [true, 'Priority is required'],
    default: 'p3',
    index: true,
  },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'resolved', 'verified', 'closed', 'reopened', 'wont-fix', 'duplicate'],
    default: 'new',
    index: true,
  },
  category: {
    type: String,
    enum: ['functionality', 'performance', 'security', 'ui', 'ux', 'data', 'api', 'integration', 'compatibility', 'other'],
    required: [true, 'Category is required'],
  },
  environment: {
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: String,
    screenResolution: String,
    appVersion: String,
    other: mongoose.Schema.Types.Mixed,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required'],
    index: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  screenshots: [
    {
      filename: String,
      path: String,
      uploadedAt: Date,
      description: String,
    },
  ],
  logs: [
    {
      filename: String,
      path: String,
      uploadedAt: Date,
      type: {
        type: String,
        enum: ['error', 'console', 'network', 'server', 'other'],
      },
    },
  ],
  // AI Categorization
  aiCategorization: {
    predictedSeverity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
    },
    predictedPriority: {
      type: String,
      enum: ['p0', 'p1', 'p2', 'p3', 'p4'],
    },
    predictedCategory: String,
    similarBugs: [
      {
        bugId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BugTracker',
        },
        similarity: Number, // 0-100
      },
    ],
    suggestedAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    estimatedFixTime: {
      type: Number, // in hours
      min: 0,
    },
    affectedModules: [String],
    rootCauseAnalysis: String,
    investigationSteps: [String],
    suggestedFix: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    analyzedAt: Date,
  },
  // Resolution
  resolution: {
    status: {
      type: String,
      enum: ['fixed', 'wont-fix', 'duplicate', 'cannot-reproduce', 'works-as-designed', 'other'],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    solution: {
      ar: String,
      en: String,
    },
    codeChanges: {
      pullRequest: String,
      commits: [String],
      filesChanged: [String],
    },
    preventiveMeasures: {
      ar: String,
      en: String,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
    },
  },
  // Testing
  testing: {
    testCase: String,
    testResult: {
      type: String,
      enum: ['passed', 'failed', 'pending'],
    },
    testedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    testedAt: Date,
    testNotes: String,
  },
  // Related Items
  relatedBugs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
    },
  ],
  blockedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
    },
  ],
  blocks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
    },
  ],
  linkedTasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],
  // Comments
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      attachments: [String],
    },
  ],
  // Activity Log
  activityLog: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      action: {
        type: String,
        enum: ['created', 'updated', 'assigned', 'commented', 'resolved', 'verified', 'reopened', 'closed'],
      },
      changes: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // SLA Tracking
  sla: {
    responseTime: {
      expected: Number, // in hours
      actual: Number,
      met: Boolean,
    },
    resolutionTime: {
      expected: Number, // in hours
      actual: Number,
      met: Boolean,
    },
  },
  // Dates
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  assignedAt: Date,
  resolvedAt: Date,
  verifiedAt: Date,
  closedAt: Date,
  // Metadata
  tags: [String],
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

// Auto-generate bug number
bugTrackerSchema.pre('save', async function (next) {
  if (!this.bugNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      bugNumber: new RegExp(`^BUG${year}`),
    });
    this.bugNumber = `BUG${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate SLA
  if (this.reportedAt) {
    // Response time (time to assign)
    if (this.assignedAt && !this.sla.responseTime.actual) {
      const responseHours = (this.assignedAt - this.reportedAt) / (1000 * 60 * 60);
      this.sla.responseTime.actual = Math.round(responseHours * 10) / 10;

      // SLA expectations based on severity
      const slaExpectations = {
        critical: 1, // 1 hour
        high: 4, // 4 hours
        medium: 8, // 8 hours
        low: 24, // 24 hours
      };
      this.sla.responseTime.expected = slaExpectations[this.severity];
      this.sla.responseTime.met = this.sla.responseTime.actual <= this.sla.responseTime.expected;
    }

    // Resolution time
    if (this.resolvedAt && !this.sla.resolutionTime.actual) {
      const resolutionHours = (this.resolvedAt - this.reportedAt) / (1000 * 60 * 60);
      this.sla.resolutionTime.actual = Math.round(resolutionHours * 10) / 10;

      // SLA expectations based on severity
      const slaExpectations = {
        critical: 8, // 8 hours
        high: 24, // 1 day
        medium: 72, // 3 days
        low: 168, // 7 days
      };
      this.sla.resolutionTime.expected = slaExpectations[this.severity];
      this.sla.resolutionTime.met = this.sla.resolutionTime.actual <= this.sla.resolutionTime.expected;
    }
  }

  next();
});

// Indexes
bugTrackerSchema.index({ project: 1, status: 1, severity: 1 });
bugTrackerSchema.index({ assignedTo: 1, status: 1 });
bugTrackerSchema.index({ reportedBy: 1, createdAt: -1 });
bugTrackerSchema.index({ 'title.en': 'text', 'title.ar': 'text', 'description.en': 'text', 'description.ar': 'text' });
bugTrackerSchema.index({ tags: 1 });

// Virtual for age in days
bugTrackerSchema.virtual('ageInDays').get(function () {
  const end = this.closedAt || new Date();
  const diff = end - this.reportedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
bugTrackerSchema.virtual('isOverdue').get(function () {
  if (this.status === 'closed' || this.status === 'resolved') return false;

  const slaExpectations = {
    critical: 8,
    high: 24,
    medium: 72,
    low: 168,
  };

  const expectedHours = slaExpectations[this.severity];
  const currentHours = (new Date() - this.reportedAt) / (1000 * 60 * 60);

  return currentHours > expectedHours;
});

// Method to assign bug
bugTrackerSchema.methods.assignTo = function (userId, assignedBy) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  this.status = 'assigned';

  this.activityLog.push({
    user: assignedBy,
    action: 'assigned',
    changes: { assignedTo: userId },
    timestamp: new Date(),
  });
};

// Method to resolve bug
bugTrackerSchema.methods.resolve = function (userId, resolutionData) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolution = {
    ...resolutionData,
    resolvedBy: userId,
    resolvedAt: new Date(),
  };

  this.activityLog.push({
    user: userId,
    action: 'resolved',
    changes: { status: 'resolved' },
    timestamp: new Date(),
  });
};

// Static method to get bug statistics
bugTrackerSchema.statics.getBugStatistics = async function (projectId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const bugs = await this.find({
    project: projectId,
    reportedAt: { $gte: startDate },
  });

  return {
    total: bugs.length,
    bySeverity: {
      critical: bugs.filter((b) => b.severity === 'critical').length,
      high: bugs.filter((b) => b.severity === 'high').length,
      medium: bugs.filter((b) => b.severity === 'medium').length,
      low: bugs.filter((b) => b.severity === 'low').length,
    },
    byStatus: {
      new: bugs.filter((b) => b.status === 'new').length,
      assigned: bugs.filter((b) => b.status === 'assigned').length,
      inProgress: bugs.filter((b) => b.status === 'in-progress').length,
      resolved: bugs.filter((b) => b.status === 'resolved').length,
      closed: bugs.filter((b) => b.status === 'closed').length,
    },
    averageResolutionTime: this.calculateAverageResolutionTime(bugs),
    slaCompliance: this.calculateSLACompliance(bugs),
  };
};

// Helper method for average resolution time
bugTrackerSchema.statics.calculateAverageResolutionTime = function (bugs) {
  const resolvedBugs = bugs.filter((b) => b.resolvedAt);
  if (resolvedBugs.length === 0) return 0;

  const totalTime = resolvedBugs.reduce((sum, bug) => {
    return sum + (bug.resolvedAt - bug.reportedAt);
  }, 0);

  return Math.round(totalTime / resolvedBugs.length / (1000 * 60 * 60)); // in hours
};

// Helper method for SLA compliance
bugTrackerSchema.statics.calculateSLACompliance = function (bugs) {
  const bugsWithSLA = bugs.filter((b) => b.sla && b.sla.resolutionTime && b.sla.resolutionTime.met !== undefined);
  if (bugsWithSLA.length === 0) return 100;

  const metSLA = bugsWithSLA.filter((b) => b.sla.resolutionTime.met).length;
  return Math.round((metSLA / bugsWithSLA.length) * 100);
};

module.exports = mongoose.model('BugTracker', bugTrackerSchema);
