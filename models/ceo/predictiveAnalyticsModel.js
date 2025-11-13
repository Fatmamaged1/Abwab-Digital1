const mongoose = require('mongoose');

const predictiveAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['revenue', 'profitability', 'churn', 'project-delivery', 'sales-pipeline', 'resource-needs'],
    required: true,
    index: true,
  },
  timeframe: {
    type: String,
    enum: ['next-week', 'next-month', 'next-quarter', 'next-year'],
    required: true,
  },
  // Revenue Prediction
  revenuePrediction: {
    predicted: {
      type: Number,
      min: 0,
    },
    optimistic: {
      type: Number,
      min: 0,
    },
    pessimistic: {
      type: Number,
      min: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    breakdown: {
      newBusiness: {
        type: Number,
        min: 0,
      },
      recurring: {
        type: Number,
        min: 0,
      },
      expansions: {
        type: Number,
        min: 0,
      },
    },
    factors: [
      {
        factor: String,
        impact: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
        },
        weight: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
  },
  // Profitability Prediction
  profitabilityPrediction: {
    predictedProfit: {
      type: Number,
    },
    predictedMargin: {
      type: Number,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    costDrivers: [
      {
        category: String,
        predicted: Number,
        trend: {
          type: String,
          enum: ['increasing', 'stable', 'decreasing'],
        },
      },
    ],
    recommendations: [String],
  },
  // Churn Prediction
  churnPrediction: {
    predictedChurnRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    atRiskClients: [
      {
        client: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Client',
        },
        churnProbability: {
          type: Number,
          min: 0,
          max: 100,
        },
        riskFactors: [String],
        recommendations: [String],
        estimatedRevenueLoss: {
          type: Number,
          min: 0,
        },
      },
    ],
    preventionActions: [
      {
        action: String,
        priority: {
          type: Number,
          min: 1,
          max: 10,
        },
        expectedImpact: String,
      },
    ],
  },
  // Project Delivery Prediction
  projectDeliveryPrediction: {
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    atRiskProjects: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AgileProject',
        },
        delayProbability: {
          type: Number,
          min: 0,
          max: 100,
        },
        predictedDelay: {
          type: Number,
          description: 'Predicted delay in days',
        },
        riskFactors: [String],
        recommendations: [String],
      },
    ],
    resourceBottlenecks: [
      {
        resource: String,
        shortfall: Number,
        impact: String,
      },
    ],
  },
  // Sales Pipeline Prediction
  salesPipelinePrediction: {
    predictedDealsWon: {
      type: Number,
      min: 0,
    },
    predictedRevenue: {
      type: Number,
      min: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    dealsByStage: [
      {
        stage: String,
        count: Number,
        value: Number,
        conversionProbability: Number,
      },
    ],
    topOpportunities: [
      {
        opportunity: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Opportunity',
        },
        winProbability: {
          type: Number,
          min: 0,
          max: 100,
        },
        value: Number,
        expectedCloseDate: Date,
      },
    ],
  },
  // Resource Needs Prediction
  resourceNeedsPrediction: {
    predictedHeadcount: {
      type: Number,
      min: 0,
    },
    hiringNeeds: [
      {
        role: String,
        count: Number,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        timeframe: String,
        reasoning: String,
      },
    ],
    skillGaps: [
      {
        skill: String,
        currentLevel: Number,
        requiredLevel: Number,
        impact: String,
        recommendation: String,
      },
    ],
    capacityForecast: {
      current: Number,
      predicted: Number,
      deficit: Number,
    },
  },
  // Scenario Analysis
  scenarios: {
    optimistic: {
      assumptions: [String],
      predictedOutcome: {
        revenue: Number,
        profit: Number,
        growth: Number,
      },
      probability: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    realistic: {
      assumptions: [String],
      predictedOutcome: {
        revenue: Number,
        profit: Number,
        growth: Number,
      },
      probability: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    pessimistic: {
      assumptions: [String],
      predictedOutcome: {
        revenue: Number,
        profit: Number,
        growth: Number,
      },
      probability: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },
  // Model Performance
  modelPerformance: {
    algorithm: String,
    trainingDataPoints: {
      type: Number,
      min: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    lastTrainedAt: Date,
    features: [
      {
        name: String,
        importance: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
  },
  // Historical Accuracy
  historicalAccuracy: {
    predictions: [
      {
        predictionDate: Date,
        predictedValue: Number,
        actualValue: Number,
        accuracy: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    averageAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },
  },
  // AI Insights
  aiInsights: {
    summary: {
      ar: String,
      en: String,
    },
    keyFindings: [
      {
        finding: {
          ar: String,
          en: String,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        category: String,
      },
    ],
    recommendations: [
      {
        priority: {
          type: Number,
          min: 1,
          max: 10,
        },
        action: {
          ar: String,
          en: String,
        },
        expectedImpact: {
          ar: String,
          en: String,
        },
        implementationCost: String,
        timeline: String,
        roi: Number,
      },
    ],
    risks: [
      {
        risk: String,
        probability: {
          type: Number,
          min: 0,
          max: 100,
        },
        impact: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        mitigation: String,
      },
    ],
  },
  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    description: 'When this prediction becomes outdated',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save hook
predictiveAnalyticsSchema.pre('save', function (next) {
  // Set expiration based on timeframe
  if (!this.expiresAt) {
    const expirationDays = {
      'next-week': 7,
      'next-month': 30,
      'next-quarter': 90,
      'next-year': 365,
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expirationDays[this.timeframe] || 30));
    this.expiresAt = expiresAt;
  }

  // Calculate historical accuracy if predictions exist
  if (this.historicalAccuracy?.predictions?.length > 0) {
    const totalAccuracy = this.historicalAccuracy.predictions.reduce(
      (sum, p) => sum + (p.accuracy || 0),
      0
    );
    this.historicalAccuracy.averageAccuracy = Math.round(
      totalAccuracy / this.historicalAccuracy.predictions.length
    );

    // Determine trend
    if (this.historicalAccuracy.predictions.length >= 3) {
      const recent = this.historicalAccuracy.predictions.slice(-3);
      const recentAvg = recent.reduce((sum, p) => sum + p.accuracy, 0) / 3;
      const older = this.historicalAccuracy.predictions.slice(0, -3);
      const olderAvg = older.length > 0 ? older.reduce((sum, p) => sum + p.accuracy, 0) / older.length : recentAvg;

      if (recentAvg > olderAvg + 5) {
        this.historicalAccuracy.trend = 'improving';
      } else if (recentAvg < olderAvg - 5) {
        this.historicalAccuracy.trend = 'declining';
      } else {
        this.historicalAccuracy.trend = 'stable';
      }
    }
  }

  next();
});

// Indexes
predictiveAnalyticsSchema.index({ date: 1, type: 1, timeframe: 1 });
predictiveAnalyticsSchema.index({ type: 1, date: -1 });
predictiveAnalyticsSchema.index({ isActive: 1, expiresAt: 1 });

// Virtual for is expired
predictiveAnalyticsSchema.virtual('isExpired').get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for confidence level
predictiveAnalyticsSchema.virtual('confidenceLevel').get(function () {
  let confidence = 0;

  switch (this.type) {
    case 'revenue':
      confidence = this.revenuePrediction?.confidence || 0;
      break;
    case 'profitability':
      confidence = this.profitabilityPrediction?.confidence || 0;
      break;
    case 'sales-pipeline':
      confidence = this.salesPipelinePrediction?.confidence || 0;
      break;
    default:
      confidence = this.modelPerformance?.accuracy || 0;
  }

  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
});

// Method to record actual outcome
predictiveAnalyticsSchema.methods.recordActualOutcome = function (actualValue) {
  if (!this.historicalAccuracy) {
    this.historicalAccuracy = { predictions: [] };
  }

  let predictedValue = 0;
  switch (this.type) {
    case 'revenue':
      predictedValue = this.revenuePrediction?.predicted || 0;
      break;
    case 'profitability':
      predictedValue = this.profitabilityPrediction?.predictedProfit || 0;
      break;
    case 'sales-pipeline':
      predictedValue = this.salesPipelinePrediction?.predictedRevenue || 0;
      break;
    default:
      predictedValue = 0;
  }

  const accuracy =
    predictedValue > 0
      ? Math.max(0, 100 - Math.abs(((actualValue - predictedValue) / predictedValue) * 100))
      : 0;

  this.historicalAccuracy.predictions.push({
    predictionDate: this.date,
    predictedValue,
    actualValue,
    accuracy: Math.round(accuracy),
  });

  this.isActive = false;
};

// Static method to get prediction trends
predictiveAnalyticsSchema.statics.getPredictionTrends = async function (type, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.find({
    type,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .select('date revenuePrediction profitabilityPrediction salesPipelinePrediction modelPerformance');
};

// Static method to get accuracy report
predictiveAnalyticsSchema.statics.getAccuracyReport = async function (type) {
  const predictions = await this.find({
    type,
    'historicalAccuracy.predictions': { $exists: true, $ne: [] },
  }).select('historicalAccuracy');

  const allPredictions = predictions.flatMap((p) => p.historicalAccuracy.predictions || []);

  if (allPredictions.length === 0) {
    return {
      type,
      totalPredictions: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      worstAccuracy: 0,
    };
  }

  const accuracies = allPredictions.map((p) => p.accuracy);
  const totalAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0);

  return {
    type,
    totalPredictions: allPredictions.length,
    averageAccuracy: Math.round(totalAccuracy / allPredictions.length),
    bestAccuracy: Math.max(...accuracies),
    worstAccuracy: Math.min(...accuracies),
    recentTrend: predictions[predictions.length - 1]?.historicalAccuracy?.trend || 'stable',
  };
};

module.exports = mongoose.model('PredictiveAnalytics', predictiveAnalyticsSchema);
