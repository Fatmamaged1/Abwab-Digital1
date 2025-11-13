const mongoose = require('mongoose');

const executiveKPISchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
    index: true,
  },
  // Financial KPIs
  financial: {
    revenue: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      recurring: {
        type: Number,
        default: 0,
        min: 0,
      },
      oneTime: {
        type: Number,
        default: 0,
        min: 0,
      },
      target: {
        type: Number,
        min: 0,
      },
      achievement: {
        type: Number,
        min: 0,
        max: 100,
        description: 'Revenue achievement percentage',
      },
    },
    profit: {
      gross: {
        type: Number,
        default: 0,
      },
      net: {
        type: Number,
        default: 0,
      },
      margin: {
        type: Number,
        default: 0,
        description: 'Net profit margin percentage',
      },
    },
    costs: {
      operational: {
        type: Number,
        default: 0,
        min: 0,
      },
      salaries: {
        type: Number,
        default: 0,
        min: 0,
      },
      marketing: {
        type: Number,
        default: 0,
        min: 0,
      },
      infrastructure: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    cashFlow: {
      opening: {
        type: Number,
        default: 0,
      },
      closing: {
        type: Number,
        default: 0,
      },
      burnRate: {
        type: Number,
        default: 0,
        description: 'Monthly cash burn rate',
      },
      runway: {
        type: Number,
        default: 0,
        description: 'Months of runway remaining',
      },
    },
  },
  // Sales KPIs
  sales: {
    leads: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      qualified: {
        type: Number,
        default: 0,
        min: 0,
      },
      converted: {
        type: Number,
        default: 0,
        min: 0,
      },
      conversionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    deals: {
      active: {
        type: Number,
        default: 0,
        min: 0,
      },
      won: {
        type: Number,
        default: 0,
        min: 0,
      },
      lost: {
        type: Number,
        default: 0,
        min: 0,
      },
      winRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    pipeline: {
      value: {
        type: Number,
        default: 0,
        min: 0,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageDealSize: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  // Project KPIs
  projects: {
    active: {
      type: Number,
      default: 0,
      min: 0,
    },
    onTrack: {
      type: Number,
      default: 0,
      min: 0,
    },
    atRisk: {
      type: Number,
      default: 0,
      min: 0,
    },
    delayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    onTimeDelivery: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Percentage of projects delivered on time',
    },
    budgetAdherence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Percentage of projects within budget',
    },
    clientSatisfaction: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Average client satisfaction score',
    },
  },
  // HR KPIs
  hr: {
    headcount: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      byDepartment: {
        software: { type: Number, default: 0, min: 0 },
        marketing: { type: Number, default: 0, min: 0 },
        sales: { type: Number, default: 0, min: 0 },
        hr: { type: Number, default: 0, min: 0 },
        finance: { type: Number, default: 0, min: 0 },
        operations: { type: Number, default: 0, min: 0 },
      },
    },
    turnover: {
      hired: {
        type: Number,
        default: 0,
        min: 0,
      },
      departed: {
        type: Number,
        default: 0,
        min: 0,
      },
      rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'Employee turnover rate',
      },
    },
    utilization: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'Average team utilization percentage',
      },
      overloaded: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of overloaded employees',
      },
    },
    performance: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      highPerformers: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of high performers (rating >= 4.5)',
      },
    },
  },
  // Marketing KPIs
  marketing: {
    campaigns: {
      active: {
        type: Number,
        default: 0,
        min: 0,
      },
      completed: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageROI: {
        type: Number,
        default: 0,
        description: 'Average campaign ROI percentage',
      },
    },
    content: {
      published: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalReach: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalEngagement: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageEngagementRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    leads: {
      generated: {
        type: Number,
        default: 0,
        min: 0,
      },
      qualified: {
        type: Number,
        default: 0,
        min: 0,
      },
      cost: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Cost per lead',
      },
    },
  },
  // Software Development KPIs
  software: {
    sprints: {
      completed: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageVelocity: {
        type: Number,
        default: 0,
        min: 0,
      },
      sprintCompletion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'Percentage of sprint goals achieved',
      },
    },
    codeQuality: {
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reviewsCompleted: {
        type: Number,
        default: 0,
        min: 0,
      },
      technicalDebtCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    bugs: {
      reported: {
        type: Number,
        default: 0,
        min: 0,
      },
      resolved: {
        type: Number,
        default: 0,
        min: 0,
      },
      critical: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageResolutionTime: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Average time to resolve bugs in hours',
      },
    },
  },
  // Health Scores
  healthScores: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    financial: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    operational: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    team: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    client: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  // AI Insights
  aiInsights: {
    summary: {
      ar: String,
      en: String,
    },
    highlights: [
      {
        type: {
          type: String,
          enum: ['achievement', 'concern', 'opportunity', 'trend'],
        },
        metric: String,
        value: String,
        description: {
          ar: String,
          en: String,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
    ],
    recommendations: [
      {
        priority: {
          type: Number,
          min: 1,
          max: 10,
        },
        category: {
          type: String,
          enum: ['financial', 'sales', 'projects', 'hr', 'marketing', 'software'],
        },
        action: {
          ar: String,
          en: String,
        },
        expectedImpact: {
          ar: String,
          en: String,
        },
        timeline: String,
      },
    ],
    predictions: [
      {
        metric: String,
        currentValue: Number,
        predictedValue: Number,
        timeframe: String,
        confidence: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
  },
  // Alerts
  alerts: [
    {
      type: {
        type: String,
        enum: ['critical', 'warning', 'info'],
      },
      category: String,
      message: {
        ar: String,
        en: String,
      },
      value: Number,
      threshold: Number,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Metadata
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

// Pre-save hook to calculate health scores
executiveKPISchema.pre('save', function (next) {
  // Calculate financial health (0-100)
  let financialHealth = 0;
  if (this.financial.revenue.target > 0) {
    financialHealth += (this.financial.revenue.achievement || 0) * 0.4; // 40% weight
  }
  financialHealth += Math.min(100, Math.max(0, this.financial.profit.margin)) * 0.3; // 30% weight
  financialHealth += Math.min(100, (this.financial.cashFlow.runway / 12) * 100) * 0.3; // 30% weight
  this.healthScores.financial = Math.round(financialHealth);

  // Calculate operational health (0-100)
  let operationalHealth = 0;
  operationalHealth += (this.projects.onTimeDelivery || 0) * 0.4; // 40% weight
  operationalHealth += (this.projects.budgetAdherence || 0) * 0.3; // 30% weight
  operationalHealth += (this.software.codeQuality.averageScore || 0) * 0.3; // 30% weight
  this.healthScores.operational = Math.round(operationalHealth);

  // Calculate team health (0-100)
  let teamHealth = 0;
  teamHealth += Math.max(0, 100 - (this.hr.turnover.rate || 0) * 2) * 0.4; // 40% weight
  teamHealth += (this.hr.utilization.average || 0) * 0.3; // 30% weight
  teamHealth += ((this.hr.performance.averageRating || 0) / 5) * 100 * 0.3; // 30% weight
  this.healthScores.team = Math.round(teamHealth);

  // Calculate client health (0-100)
  let clientHealth = 0;
  clientHealth += (this.projects.clientSatisfaction || 0) * 0.5; // 50% weight
  clientHealth += (this.sales.deals.winRate || 0) * 0.3; // 30% weight
  clientHealth += (this.sales.leads.conversionRate || 0) * 0.2; // 20% weight
  this.healthScores.client = Math.round(clientHealth);

  // Calculate overall health (average of all health scores)
  this.healthScores.overall = Math.round(
    (this.healthScores.financial +
      this.healthScores.operational +
      this.healthScores.team +
      this.healthScores.client) /
      4
  );

  // Generate alerts based on thresholds
  this.alerts = [];

  // Revenue alert
  if (this.financial.revenue.achievement < 70) {
    this.alerts.push({
      type: 'critical',
      category: 'financial',
      message: {
        ar: 'الإيرادات أقل من المستهدف',
        en: 'Revenue below target',
      },
      value: this.financial.revenue.achievement,
      threshold: 70,
    });
  }

  // Cash runway alert
  if (this.financial.cashFlow.runway < 6) {
    this.alerts.push({
      type: 'critical',
      category: 'financial',
      message: {
        ar: 'السيولة النقدية منخفضة',
        en: 'Low cash runway',
      },
      value: this.financial.cashFlow.runway,
      threshold: 6,
    });
  }

  // Turnover alert
  if (this.hr.turnover.rate > 15) {
    this.alerts.push({
      type: 'warning',
      category: 'hr',
      message: {
        ar: 'معدل دوران الموظفين مرتفع',
        en: 'High employee turnover',
      },
      value: this.hr.turnover.rate,
      threshold: 15,
    });
  }

  // Project delays alert
  if (this.projects.delayed > 0) {
    this.alerts.push({
      type: 'warning',
      category: 'projects',
      message: {
        ar: 'مشاريع متأخرة',
        en: 'Delayed projects',
      },
      value: this.projects.delayed,
      threshold: 0,
    });
  }

  next();
});

// Indexes
executiveKPISchema.index({ date: 1, period: 1 }, { unique: true });
executiveKPISchema.index({ period: 1, date: -1 });

// Virtual for is healthy
executiveKPISchema.virtual('isHealthy').get(function () {
  return this.healthScores.overall >= 70;
});

// Virtual for critical alerts count
executiveKPISchema.virtual('criticalAlertsCount').get(function () {
  return this.alerts ? this.alerts.filter((a) => a.type === 'critical').length : 0;
});

// Static method to get KPI trends
executiveKPISchema.statics.getKPITrends = async function (period = 'monthly', limit = 12) {
  return this.find({ period })
    .sort({ date: -1 })
    .limit(limit)
    .select('date financial.revenue.total financial.profit.net sales.deals.winRate projects.onTimeDelivery hr.turnover.rate healthScores');
};

// Static method to get executive summary
executiveKPISchema.statics.getExecutiveSummary = async function (date) {
  const daily = await this.findOne({ date, period: 'daily' });
  const weekly = await this.findOne({ date: { $lte: date }, period: 'weekly' }).sort({ date: -1 });
  const monthly = await this.findOne({ date: { $lte: date }, period: 'monthly' }).sort({ date: -1 });

  return {
    daily,
    weekly,
    monthly,
    summary: {
      overallHealth: daily?.healthScores.overall || 0,
      criticalAlerts: daily?.criticalAlertsCount || 0,
      revenue: {
        today: daily?.financial.revenue.total || 0,
        thisWeek: weekly?.financial.revenue.total || 0,
        thisMonth: monthly?.financial.revenue.total || 0,
      },
      projects: {
        active: daily?.projects.active || 0,
        atRisk: daily?.projects.atRisk || 0,
        onTrack: daily?.projects.onTrack || 0,
      },
    },
  };
};

module.exports = mongoose.model('ExecutiveKPI', executiveKPISchema);
