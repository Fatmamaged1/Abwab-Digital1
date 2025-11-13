const mongoose = require('mongoose');

const technicalDebtSchema = new mongoose.Schema({
  debtNumber: {
    type: String,
    unique: true,
    // Auto-generated: TD2025000001
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    index: true,
  },
  module: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['code', 'architecture', 'test', 'documentation', 'security', 'performance', 'dependency'],
    required: [true, 'Debt type is required'],
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required'],
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
  impact: {
    development: {
      type: String,
      description: 'Impact on development speed and quality',
    },
    maintenance: {
      type: String,
      description: 'Impact on maintenance difficulty',
    },
    performance: {
      type: String,
      description: 'Impact on system performance',
    },
    security: {
      type: String,
      description: 'Security implications',
    },
    scalability: {
      type: String,
      description: 'Impact on scalability',
    },
  },
  location: {
    repository: String,
    branch: String,
    files: [
      {
        path: String,
        startLine: Number,
        endLine: Number,
      },
    ],
    modules: [String],
  },
  estimatedEffort: {
    type: Number, // in hours
    min: 0,
    description: 'Estimated hours to resolve',
  },
  actualEffort: {
    type: Number, // in hours
    min: 0,
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
    description: 'Priority score (1=low, 10=critical)',
  },
  status: {
    type: String,
    enum: ['identified', 'planned', 'in-progress', 'resolved', 'accepted', 'wont-fix'],
    default: 'identified',
    index: true,
  },
  // AI Recommendations
  aiRecommendation: {
    refactoringPlan: {
      steps: [String],
      approach: String,
    },
    estimatedBenefit: {
      developmentSpeed: String,
      codeQuality: String,
      maintainability: String,
      performance: String,
    },
    riskIfIgnored: {
      shortTerm: String,
      longTerm: String,
      probability: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
    },
    suggestedTimeline: {
      immediate: Boolean,
      nextSprint: Boolean,
      nextQuarter: Boolean,
      description: String,
    },
    codeExamples: [
      {
        before: String,
        after: String,
        explanation: String,
      },
    ],
    dependencies: [String],
    testingStrategy: String,
    analyzedAt: Date,
  },
  // Resolution Planning
  resolution: {
    plannedFor: {
      sprint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint',
      },
      quarter: String,
      date: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approach: {
      ar: String,
      en: String,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    pullRequests: [String],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    outcome: {
      ar: String,
      en: String,
    },
    lessonsLearned: {
      ar: String,
      en: String,
    },
  },
  // Cost Analysis
  cost: {
    currentMonthlyCost: {
      type: Number,
      description: 'Estimated monthly cost of keeping this debt (in developer hours)',
    },
    resolutionCost: {
      type: Number,
      description: 'One-time cost to resolve (in developer hours)',
    },
    breakEvenPoint: {
      type: Number,
      description: 'Months until resolution pays off',
    },
    roi: {
      type: Number,
      description: 'Return on investment percentage',
    },
  },
  // Tracking
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  identifiedAt: {
    type: Date,
    default: Date.now,
  },
  lastReviewedAt: Date,
  lastReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Related Items
  relatedDebts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TechnicalDebt',
    },
  ],
  relatedBugs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BugTracker',
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
    },
  ],
  // Attachments
  attachments: [
    {
      filename: String,
      path: String,
      type: {
        type: String,
        enum: ['diagram', 'screenshot', 'document', 'code', 'other'],
      },
      uploadedAt: Date,
    },
  ],
  // Tags for categorization
  tags: [String],
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

// Auto-generate debt number
technicalDebtSchema.pre('save', async function (next) {
  if (!this.debtNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      debtNumber: new RegExp(`^TD${year}`),
    });
    this.debtNumber = `TD${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate break-even point and ROI
  if (this.cost && this.cost.currentMonthlyCost && this.cost.resolutionCost) {
    if (this.cost.currentMonthlyCost > 0) {
      this.cost.breakEvenPoint = Math.ceil(this.cost.resolutionCost / this.cost.currentMonthlyCost);

      // ROI calculation: (Benefit - Cost) / Cost * 100
      // Benefit over 1 year: currentMonthlyCost * 12
      const yearlyBenefit = this.cost.currentMonthlyCost * 12;
      this.cost.roi = Math.round(((yearlyBenefit - this.cost.resolutionCost) / this.cost.resolutionCost) * 100);
    }
  }

  next();
});

// Indexes
technicalDebtSchema.index({ project: 1, status: 1, severity: 1 });
technicalDebtSchema.index({ type: 1, severity: 1 });
technicalDebtSchema.index({ 'resolution.plannedFor.sprint': 1 });
technicalDebtSchema.index({ identifiedBy: 1, createdAt: -1 });
technicalDebtSchema.index({ tags: 1 });

// Virtual for age in days
technicalDebtSchema.virtual('ageInDays').get(function () {
  const end = this.resolution.resolvedAt || new Date();
  const diff = end - this.identifiedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for urgency score
technicalDebtSchema.virtual('urgencyScore').get(function () {
  let score = 0;

  // Severity weight (0-40 points)
  const severityScores = { low: 10, medium: 20, high: 30, critical: 40 };
  score += severityScores[this.severity] || 0;

  // Age weight (0-30 points)
  const ageInMonths = this.ageInDays / 30;
  score += Math.min(ageInMonths * 5, 30);

  // ROI weight (0-30 points)
  if (this.cost && this.cost.roi) {
    score += Math.min((this.cost.roi / 10), 30);
  }

  return Math.round(score);
});

// Virtual for recommended action
technicalDebtSchema.virtual('recommendedAction').get(function () {
  const urgency = this.urgencyScore;

  if (urgency >= 80) return 'address-immediately';
  if (urgency >= 60) return 'plan-next-sprint';
  if (urgency >= 40) return 'plan-next-quarter';
  return 'monitor';
});

// Method to calculate priority dynamically
technicalDebtSchema.methods.calculatePriority = function () {
  let priority = 5; // default

  // Severity impact
  const severityImpact = { low: 1, medium: 3, high: 5, critical: 8 };
  priority += severityImpact[this.severity] || 0;

  // ROI impact (higher ROI = higher priority)
  if (this.cost && this.cost.roi) {
    if (this.cost.roi > 200) priority += 3;
    else if (this.cost.roi > 100) priority += 2;
    else if (this.cost.roi > 50) priority += 1;
  }

  // Age impact (older = lower priority if not urgent)
  const ageInMonths = this.ageInDays / 30;
  if (this.severity !== 'critical' && ageInMonths > 12) {
    priority -= 2; // If it's been there for over a year and not critical, maybe it's not that important
  }

  // Cap between 1 and 10
  this.priority = Math.max(1, Math.min(10, Math.round(priority)));
};

// Static method to get debt statistics
technicalDebtSchema.statics.getDebtStatistics = async function (projectId) {
  const debts = await this.find({
    project: projectId,
    isDeleted: false,
  });

  const activeDebts = debts.filter((d) => d.status !== 'resolved' && d.status !== 'wont-fix');

  return {
    total: debts.length,
    active: activeDebts.length,
    resolved: debts.filter((d) => d.status === 'resolved').length,
    byType: {
      code: debts.filter((d) => d.type === 'code').length,
      architecture: debts.filter((d) => d.type === 'architecture').length,
      test: debts.filter((d) => d.type === 'test').length,
      documentation: debts.filter((d) => d.type === 'documentation').length,
      security: debts.filter((d) => d.type === 'security').length,
      performance: debts.filter((d) => d.type === 'performance').length,
      dependency: debts.filter((d) => d.type === 'dependency').length,
    },
    bySeverity: {
      critical: activeDebts.filter((d) => d.severity === 'critical').length,
      high: activeDebts.filter((d) => d.severity === 'high').length,
      medium: activeDebts.filter((d) => d.severity === 'medium').length,
      low: activeDebts.filter((d) => d.severity === 'low').length,
    },
    totalEstimatedEffort: activeDebts.reduce((sum, d) => sum + (d.estimatedEffort || 0), 0),
    totalMonthlyCost: activeDebts.reduce((sum, d) => sum + (d.cost?.currentMonthlyCost || 0), 0),
    averageAge: activeDebts.length > 0
      ? Math.round(activeDebts.reduce((sum, d) => sum + d.ageInDays, 0) / activeDebts.length)
      : 0,
  };
};

// Static method to get top priority debts
technicalDebtSchema.statics.getTopPriorityDebts = async function (projectId, limit = 10) {
  const debts = await this.find({
    project: projectId,
    status: { $in: ['identified', 'planned'] },
    isDeleted: false,
  })
    .populate('identifiedBy', 'name email')
    .sort({ priority: -1, severity: -1 })
    .limit(limit);

  return debts;
};

module.exports = mongoose.model('TechnicalDebt', technicalDebtSchema);
