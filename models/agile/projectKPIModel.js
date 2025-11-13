const mongoose = require('mongoose');

const projectKPISchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  metrics: {
    // Budget Metrics
    budgetUtilization: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Percentage of budget used',
    },
    budgetVariance: {
      type: Number,
      description: 'Difference between actual and planned budget (SAR)',
    },
    costPerformanceIndex: {
      type: Number,
      min: 0,
      description: 'CPI = Earned Value / Actual Cost (1.0 is on budget)',
    },

    // Schedule Metrics
    scheduleVariance: {
      type: Number,
      description: 'Difference in days between planned and actual',
    },
    schedulePerformanceIndex: {
      type: Number,
      min: 0,
      description: 'SPI = Earned Value / Planned Value (1.0 is on schedule)',
    },
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Scope Metrics
    scopeCreep: {
      type: Number,
      min: 0,
      description: 'Percentage of scope changes',
    },
    requirementsStability: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    // Team Metrics
    teamVelocity: {
      type: Number,
      min: 0,
      description: 'Story points completed per sprint',
    },
    teamCapacityUtilization: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    teamMorale: {
      type: Number,
      min: 0,
      max: 10,
      description: 'Team satisfaction score',
    },

    // Quality Metrics
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    defectDensity: {
      type: Number,
      min: 0,
      description: 'Number of defects per 1000 lines of code',
    },
    codeQualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    testCoverage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Client Metrics
    clientSatisfaction: {
      type: Number,
      min: 0,
      max: 10,
      description: 'Client satisfaction score',
    },
    clientEngagement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Client participation and responsiveness',
    },

    // Risk Metrics
    riskIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Overall project risk score',
    },
    openRisks: {
      type: Number,
      min: 0,
      default: 0,
    },
    criticalIssues: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Progress Metrics
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    milestonesCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalMilestones: {
      type: Number,
      min: 0,
      default: 0,
    },
  },

  // Alerts and Warnings
  alerts: [
    {
      type: {
        type: String,
        enum: ['budget', 'schedule', 'quality', 'risk', 'resource', 'client'],
        required: true,
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
      },
      message: {
        ar: String,
        en: String,
      },
      metric: String,
      currentValue: mongoose.Schema.Types.Mixed,
      threshold: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolution: String,
    },
  ],

  // Historical Snapshots (for trend analysis)
  weeklySnapshots: [
    {
      week: Number,
      year: Number,
      metrics: mongoose.Schema.Types.Mixed,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Trends (calculated)
  trends: {
    budgetTrend: {
      type: String,
      enum: ['improving', 'stable', 'deteriorating'],
    },
    scheduleTrend: {
      type: String,
      enum: ['improving', 'stable', 'deteriorating'],
    },
    qualityTrend: {
      type: String,
      enum: ['improving', 'stable', 'deteriorating'],
    },
    velocityTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
    },
  },

  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
projectKPISchema.index({ project: 1, date: -1 });
projectKPISchema.index({ 'alerts.severity': 1, 'alerts.resolved': 1 });

// Virtual for health score (0-100)
projectKPISchema.virtual('healthScore').get(function () {
  const metrics = this.metrics;

  // Weighted health calculation
  const weights = {
    budgetUtilization: 0.2,
    schedulePerformanceIndex: 0.2,
    qualityScore: 0.2,
    clientSatisfaction: 0.15,
    teamVelocity: 0.15,
    riskIndex: 0.1,
  };

  let score = 0;

  // Budget (100 - utilization, capped at 100)
  if (metrics.budgetUtilization <= 100) {
    score += (100 - Math.min(metrics.budgetUtilization, 100)) * weights.budgetUtilization;
  }

  // Schedule (SPI to percentage)
  if (metrics.schedulePerformanceIndex) {
    score += Math.min(metrics.schedulePerformanceIndex * 100, 100) * weights.schedulePerformanceIndex;
  }

  // Quality
  score += (metrics.qualityScore || 0) * weights.qualityScore;

  // Client satisfaction (convert 0-10 to 0-100)
  score += ((metrics.clientSatisfaction || 0) * 10) * weights.clientSatisfaction;

  // Team velocity (normalized - assume 50 is average)
  if (metrics.teamVelocity) {
    score += Math.min((metrics.teamVelocity / 50) * 100, 100) * weights.teamVelocity;
  }

  // Risk (inverted - lower risk is better)
  score += (100 - (metrics.riskIndex || 0)) * weights.riskIndex;

  return Math.round(score);
});

// Virtual for status
projectKPISchema.virtual('status').get(function () {
  const health = this.healthScore;
  if (health >= 80) return 'excellent';
  if (health >= 60) return 'good';
  if (health >= 40) return 'fair';
  if (health >= 20) return 'poor';
  return 'critical';
});

// Method to add weekly snapshot
projectKPISchema.methods.addWeeklySnapshot = function () {
  const now = new Date();
  const weekNumber = this.getWeekNumber(now);
  const year = now.getFullYear();

  this.weeklySnapshots.push({
    week: weekNumber,
    year: year,
    metrics: JSON.parse(JSON.stringify(this.metrics)),
    date: now,
  });

  // Keep only last 26 weeks (6 months)
  if (this.weeklySnapshots.length > 26) {
    this.weeklySnapshots = this.weeklySnapshots.slice(-26);
  }
};

// Helper method to get week number
projectKPISchema.methods.getWeekNumber = function (date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Method to calculate trends
projectKPISchema.methods.calculateTrends = function () {
  if (this.weeklySnapshots.length < 2) return;

  const recent = this.weeklySnapshots.slice(-4); // Last 4 weeks

  // Budget trend
  const budgetValues = recent.map((s) => s.metrics.budgetUtilization || 0);
  this.trends.budgetTrend = this.getTrend(budgetValues, true); // Inverted (lower is better)

  // Schedule trend
  const scheduleValues = recent.map((s) => s.metrics.schedulePerformanceIndex || 1);
  this.trends.scheduleTrend = this.getTrend(scheduleValues);

  // Quality trend
  const qualityValues = recent.map((s) => s.metrics.qualityScore || 0);
  this.trends.qualityTrend = this.getTrend(qualityValues);

  // Velocity trend
  const velocityValues = recent.map((s) => s.metrics.teamVelocity || 0);
  this.trends.velocityTrend = this.getVelocityTrend(velocityValues);
};

// Helper method to determine trend
projectKPISchema.methods.getTrend = function (values, inverted = false) {
  if (values.length < 2) return 'stable';

  const avg1 = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
  const avg2 = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);

  const threshold = 0.05; // 5% change threshold
  const change = (avg2 - avg1) / avg1;

  if (Math.abs(change) < threshold) return 'stable';

  if (inverted) {
    return change > 0 ? 'deteriorating' : 'improving';
  } else {
    return change > 0 ? 'improving' : 'deteriorating';
  }
};

// Helper method for velocity trend
projectKPISchema.methods.getVelocityTrend = function (values) {
  if (values.length < 2) return 'stable';

  const avg1 = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
  const avg2 = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);

  const threshold = 0.05;
  const change = (avg2 - avg1) / avg1;

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
};

module.exports = mongoose.model('ProjectKPI', projectKPISchema);
