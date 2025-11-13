const mongoose = require('mongoose');

const earlyWarningSchema = new mongoose.Schema({
  warningNumber: {
    type: String,
    unique: true,
    // Auto-generated: WARN2025000001
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  type: {
    type: String,
    enum: ['budget-overrun', 'project-delay', 'quality-issue', 'client-risk', 'team-issue', 'financial-risk'],
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'emergency'],
    required: true,
    default: 'warning',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'action-taken', 'resolved', 'dismissed', 'escalated'],
    default: 'active',
    index: true,
  },
  // Source Information
  source: {
    module: {
      type: String,
      enum: ['projects', 'software', 'marketing', 'sales', 'accounting', 'hr', 'ceo-dashboard'],
      required: true,
    },
    entity: {
      type: String,
      description: 'Entity type (e.g., Project, Employee, Campaign)',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      description: 'Reference to the specific entity',
    },
    metric: {
      type: String,
      description: 'The metric that triggered the warning',
    },
  },
  // Warning Details
  warning: {
    title: {
      ar: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },
    description: {
      ar: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },
    threshold: {
      type: Number,
      description: 'The threshold value that was exceeded',
    },
    actualValue: {
      type: Number,
      description: 'The actual value that triggered the warning',
    },
    deviation: {
      type: Number,
      description: 'Percentage deviation from threshold',
    },
  },
  // Impact Assessment
  impact: {
    financial: {
      estimated: {
        type: Number,
        min: 0,
        description: 'Estimated financial impact in SAR',
      },
      description: String,
    },
    timeline: {
      delayDays: {
        type: Number,
        min: 0,
        description: 'Estimated delay in days',
      },
      description: String,
    },
    client: {
      affectedClients: {
        type: Number,
        min: 0,
      },
      satisfactionImpact: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      description: String,
    },
    team: {
      affectedEmployees: {
        type: Number,
        min: 0,
      },
      moraleImpact: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      description: String,
    },
    overall: {
      type: String,
      enum: ['negligible', 'minor', 'moderate', 'major', 'severe'],
      description: 'Overall business impact',
    },
  },
  // Root Cause Analysis
  rootCause: {
    identified: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['resource-shortage', 'poor-planning', 'technical-issue', 'external-factor', 'process-failure', 'human-error', 'other'],
    },
    description: String,
    contributingFactors: [String],
    analysis: String,
  },
  // AI Predictions
  aiAnalysis: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'AI-calculated risk score',
    },
    escalationProbability: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Probability of escalation if not addressed',
    },
    timeToEscalation: {
      type: Number,
      min: 0,
      description: 'Estimated days until escalation',
    },
    similarIncidents: [
      {
        incidentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EarlyWarning',
        },
        similarity: {
          type: Number,
          min: 0,
          max: 100,
        },
        outcome: String,
        lessonLearned: String,
      },
    ],
    predictedOutcome: {
      type: String,
      enum: ['resolved', 'escalated', 'chronic-issue'],
    },
  },
  // Recommendations
  recommendations: [
    {
      priority: {
        type: Number,
        min: 1,
        max: 10,
        required: true,
      },
      action: {
        ar: {
          type: String,
          required: true,
        },
        en: {
          type: String,
          required: true,
        },
      },
      expectedImpact: {
        ar: String,
        en: String,
      },
      estimatedCost: {
        type: Number,
        min: 0,
      },
      timeRequired: {
        type: Number,
        min: 0,
        description: 'Estimated time in hours',
      },
      responsibleRole: {
        type: String,
        enum: ['ceo', 'coo', 'cto', 'cfo', 'hr-manager', 'project-manager', 'team-lead'],
      },
      deadline: Date,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending',
      },
      implementedAt: Date,
      result: String,
    },
  ],
  // Actions Taken
  actions: [
    {
      takenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      takenAt: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        required: true,
      },
      result: String,
      effectiveness: {
        type: Number,
        min: 0,
        max: 100,
        description: 'How effective was this action',
      },
      notes: String,
    },
  ],
  // Escalation
  escalation: {
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: Date,
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    escalationLevel: {
      type: String,
      enum: ['team-lead', 'manager', 'director', 'ceo', 'board'],
    },
    reason: String,
  },
  // Resolution
  resolution: {
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionSummary: String,
    finalCost: {
      type: Number,
      min: 0,
    },
    timeToResolve: {
      type: Number,
      min: 0,
      description: 'Hours taken to resolve',
    },
    lessonLearned: String,
    preventiveMeasures: [String],
  },
  // Notifications
  notifications: [
    {
      sentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: Date,
      channel: {
        type: String,
        enum: ['email', 'sms', 'in-app', 'slack'],
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
      acknowledgedAt: Date,
    },
  ],
  // Metadata
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User responsible for handling this warning',
  },
  dueDate: {
    type: Date,
    description: 'Deadline to address this warning',
  },
  isOverdue: {
    type: Boolean,
    default: false,
  },
  tags: [String],
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

// Auto-generate warning number
earlyWarningSchema.pre('save', async function (next) {
  if (!this.warningNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      warningNumber: new RegExp(`^WARN${year}`),
    });
    this.warningNumber = `WARN${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate deviation if both threshold and actual value exist
  if (this.warning.threshold && this.warning.actualValue) {
    this.warning.deviation = Math.round(
      ((this.warning.actualValue - this.warning.threshold) / this.warning.threshold) * 100
    );
  }

  // Check if overdue
  if (this.dueDate && !this.resolution.resolved) {
    this.isOverdue = new Date() > this.dueDate;
  }

  // Auto-escalate critical warnings after 24 hours
  if (
    this.severity === 'critical' &&
    !this.escalation.escalated &&
    !this.resolution.resolved &&
    Date.now() - this.date.getTime() > 24 * 60 * 60 * 1000
  ) {
    this.escalation.escalated = true;
    this.escalation.escalatedAt = new Date();
    this.escalation.escalationLevel = 'ceo';
    this.escalation.reason = 'Auto-escalated: Critical warning not addressed within 24 hours';
  }

  next();
});

// Indexes
earlyWarningSchema.index({ warningNumber: 1 });
earlyWarningSchema.index({ type: 1, severity: 1, status: 1 });
earlyWarningSchema.index({ date: -1 });
earlyWarningSchema.index({ assignedTo: 1, status: 1 });
earlyWarningSchema.index({ 'source.module': 1, 'source.entityId': 1 });

// Virtual for age in hours
earlyWarningSchema.virtual('ageInHours').get(function () {
  return Math.floor((Date.now() - this.date.getTime()) / (1000 * 60 * 60));
});

// Virtual for urgency score
earlyWarningSchema.virtual('urgencyScore').get(function () {
  let score = 0;

  // Severity (0-40 points)
  const severityScores = { info: 10, warning: 20, critical: 35, emergency: 40 };
  score += severityScores[this.severity] || 0;

  // Impact (0-30 points)
  const impactScores = { negligible: 5, minor: 10, moderate: 15, major: 23, severe: 30 };
  score += impactScores[this.impact.overall] || 0;

  // Age (0-20 points)
  const ageHours = this.ageInHours || 0;
  if (ageHours > 48) score += 20;
  else if (ageHours > 24) score += 15;
  else if (ageHours > 12) score += 10;
  else if (ageHours > 6) score += 5;

  // Overdue (0-10 points)
  if (this.isOverdue) score += 10;

  return Math.min(100, score);
});

// Method to assign to user
earlyWarningSchema.methods.assignTo = function (userId, dueDate) {
  this.assignedTo = userId;
  this.dueDate = dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
  this.status = 'investigating';
};

// Method to add action
earlyWarningSchema.methods.addAction = function (userId, action, result, effectiveness) {
  this.actions.push({
    takenBy: userId,
    action,
    result,
    effectiveness,
    takenAt: new Date(),
  });
  this.status = 'action-taken';
};

// Method to escalate
earlyWarningSchema.methods.escalate = function (toUserId, level, reason) {
  this.escalation = {
    escalated: true,
    escalatedAt: new Date(),
    escalatedTo: toUserId,
    escalationLevel: level,
    reason,
  };
  this.status = 'escalated';
};

// Method to resolve
earlyWarningSchema.methods.resolve = function (userId, summary, lessonLearned, preventiveMeasures) {
  const timeToResolve = (Date.now() - this.date.getTime()) / (1000 * 60 * 60); // hours

  this.resolution = {
    resolved: true,
    resolvedAt: new Date(),
    resolvedBy: userId,
    resolutionSummary: summary,
    timeToResolve: Math.round(timeToResolve),
    lessonLearned,
    preventiveMeasures,
  };
  this.status = 'resolved';
};

// Method to send notification
earlyWarningSchema.methods.sendNotification = function (userId, channel) {
  this.notifications.push({
    sentTo: userId,
    sentAt: new Date(),
    channel,
    acknowledged: false,
  });
};

// Static method to get active warnings
earlyWarningSchema.statics.getActiveWarnings = async function (filters = {}) {
  return this.find({
    ...filters,
    status: { $in: ['active', 'investigating', 'action-taken'] },
    'resolution.resolved': { $ne: true },
  })
    .sort({ severity: -1, date: -1 })
    .populate('assignedTo', 'name email')
    .populate('actions.takenBy', 'name email');
};

// Static method to get warning statistics
earlyWarningSchema.statics.getWarningStatistics = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const warnings = await this.find({
    date: { $gte: startDate },
  });

  return {
    total: warnings.length,
    bySeverity: {
      info: warnings.filter((w) => w.severity === 'info').length,
      warning: warnings.filter((w) => w.severity === 'warning').length,
      critical: warnings.filter((w) => w.severity === 'critical').length,
      emergency: warnings.filter((w) => w.severity === 'emergency').length,
    },
    byStatus: {
      active: warnings.filter((w) => w.status === 'active').length,
      investigating: warnings.filter((w) => w.status === 'investigating').length,
      actionTaken: warnings.filter((w) => w.status === 'action-taken').length,
      resolved: warnings.filter((w) => w.status === 'resolved').length,
      escalated: warnings.filter((w) => w.status === 'escalated').length,
    },
    byType: warnings.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {}),
    averageResolutionTime: warnings.filter((w) => w.resolution.resolved).length > 0
      ? Math.round(
          warnings
            .filter((w) => w.resolution.resolved)
            .reduce((sum, w) => sum + (w.resolution.timeToResolve || 0), 0) /
            warnings.filter((w) => w.resolution.resolved).length
        )
      : 0,
    escalationRate: warnings.length > 0
      ? Math.round((warnings.filter((w) => w.escalation.escalated).length / warnings.length) * 100)
      : 0,
  };
};

// Static method to create warning from anomaly
earlyWarningSchema.statics.createFromAnomaly = async function (anomalyData) {
  const warning = new this({
    type: anomalyData.type,
    severity: anomalyData.severity,
    source: anomalyData.source,
    warning: anomalyData.warning,
    impact: anomalyData.impact,
    recommendations: anomalyData.recommendations,
  });

  await warning.save();
  return warning;
};

module.exports = mongoose.model('EarlyWarning', earlyWarningSchema);
