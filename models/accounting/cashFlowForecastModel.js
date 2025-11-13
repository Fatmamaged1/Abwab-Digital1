const mongoose = require('mongoose');

const cashFlowForecastSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
    index: true,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    index: true,
  },
  hijriMonth: {
    type: String,
    description: 'Hijri month name',
  },
  // Projected Inflows
  projectedInflows: [
    {
      source: {
        type: String,
        enum: ['invoices', 'projects', 'recurring', 'investments', 'loans', 'other'],
        required: true,
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      probability: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
        description: 'Probability of receiving this amount (%)',
      },
      expectedAmount: {
        type: Number,
        min: 0,
        description: 'Amount * (Probability / 100)',
      },
      date: {
        type: Date,
        required: true,
      },
      reference: {
        type: mongoose.Schema.Types.ObjectId,
        description: 'Reference to Invoice, Project, etc.',
      },
      status: {
        type: String,
        enum: ['projected', 'confirmed', 'received', 'delayed', 'cancelled'],
        default: 'projected',
      },
    },
  ],
  // Projected Outflows
  projectedOutflows: [
    {
      category: {
        type: String,
        enum: ['salaries', 'expenses', 'taxes', 'rent', 'vendors', 'subscriptions', 'marketing', 'infrastructure', 'loan-payments', 'other'],
        required: true,
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      date: {
        type: Date,
        required: true,
      },
      recurring: {
        type: Boolean,
        default: false,
      },
      reference: {
        type: mongoose.Schema.Types.ObjectId,
        description: 'Reference to Expense, etc.',
      },
      status: {
        type: String,
        enum: ['projected', 'confirmed', 'paid', 'delayed', 'cancelled'],
        default: 'projected',
      },
    },
  ],
  // Summary
  openingBalance: {
    type: Number,
    required: true,
    description: 'Cash balance at start of period',
  },
  totalProjectedInflows: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalExpectedInflows: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Probability-weighted inflows',
  },
  totalProjectedOutflows: {
    type: Number,
    default: 0,
    min: 0,
  },
  projectedClosingBalance: {
    type: Number,
    default: 0,
    description: 'Opening + Expected Inflows - Projected Outflows',
  },
  actualClosingBalance: {
    type: Number,
    description: 'Actual balance at end of period (if available)',
  },
  // AI Predictions
  aiPrediction: {
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Predicted accuracy of forecast (%)',
    },
    riskFactors: [
      {
        factor: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        description: String,
      },
    ],
    recommendations: [String],
    cashShortfall: {
      type: Boolean,
      default: false,
      description: 'Whether cash shortfall is predicted',
    },
    shortfallAmount: {
      type: Number,
      min: 0,
      description: 'Predicted shortfall amount',
    },
    shortfallDate: {
      type: Date,
      description: 'When shortfall might occur',
    },
    optimisticScenario: {
      closingBalance: Number,
      probability: Number,
    },
    pessimisticScenario: {
      closingBalance: Number,
      probability: Number,
    },
    mostLikelyScenario: {
      closingBalance: Number,
      probability: Number,
    },
  },
  // Variance Analysis (if actual data available)
  variance: {
    inflowVariance: {
      type: Number,
      description: 'Actual inflows - Projected inflows',
    },
    outflowVariance: {
      type: Number,
      description: 'Actual outflows - Projected outflows',
    },
    balanceVariance: {
      type: Number,
      description: 'Actual balance - Projected balance',
    },
    accuracyRate: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How accurate the forecast was',
    },
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
  lastUpdatedAt: Date,
  notes: String,
  isLocked: {
    type: Boolean,
    default: false,
    description: 'Lock forecast after period ends',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save hook to calculate totals
cashFlowForecastSchema.pre('save', function (next) {
  // Calculate total projected inflows
  this.totalProjectedInflows = this.projectedInflows.reduce((sum, inflow) => sum + inflow.amount, 0);

  // Calculate total expected inflows (probability-weighted)
  this.totalExpectedInflows = this.projectedInflows.reduce((sum, inflow) => {
    inflow.expectedAmount = inflow.amount * (inflow.probability / 100);
    return sum + inflow.expectedAmount;
  }, 0);

  // Calculate total projected outflows
  this.totalProjectedOutflows = this.projectedOutflows.reduce((sum, outflow) => sum + outflow.amount, 0);

  // Calculate projected closing balance
  this.projectedClosingBalance = this.openingBalance + this.totalExpectedInflows - this.totalProjectedOutflows;

  // Check for cash shortfall
  if (this.aiPrediction) {
    this.aiPrediction.cashShortfall = this.projectedClosingBalance < 0;
    if (this.aiPrediction.cashShortfall) {
      this.aiPrediction.shortfallAmount = Math.abs(this.projectedClosingBalance);
    }
  }

  // Calculate variance if actual balance is available
  if (this.actualClosingBalance !== undefined && this.actualClosingBalance !== null) {
    this.variance = this.variance || {};
    this.variance.balanceVariance = this.actualClosingBalance - this.projectedClosingBalance;

    if (this.projectedClosingBalance !== 0) {
      this.variance.accuracyRate = 100 - Math.abs(
        (this.variance.balanceVariance / this.projectedClosingBalance) * 100
      );
      this.variance.accuracyRate = Math.max(0, Math.min(100, this.variance.accuracyRate));
    }
  }

  next();
});

// Compound index for month/year
cashFlowForecastSchema.index({ month: 1, year: 1 }, { unique: true });

// Virtual for net cash flow
cashFlowForecastSchema.virtual('netCashFlow').get(function () {
  return this.totalExpectedInflows - this.totalProjectedOutflows;
});

// Virtual for is healthy
cashFlowForecastSchema.virtual('isHealthy').get(function () {
  return this.projectedClosingBalance > 0;
});

// Virtual for period name
cashFlowForecastSchema.virtual('periodName').get(function () {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[this.month - 1]} ${this.year}`;
});

// Method to add inflow
cashFlowForecastSchema.methods.addInflow = function (inflowData) {
  this.projectedInflows.push(inflowData);
};

// Method to add outflow
cashFlowForecastSchema.methods.addOutflow = function (outflowData) {
  this.projectedOutflows.push(outflowData);
};

// Method to mark as actual
cashFlowForecastSchema.methods.recordActualBalance = function (actualBalance) {
  this.actualClosingBalance = actualBalance;
  this.isLocked = true;
};

// Static method to get forecast summary
cashFlowForecastSchema.statics.getForecastSummary = async function (startMonth, startYear, months = 6) {
  const forecasts = [];

  for (let i = 0; i < months; i++) {
    let month = startMonth + i;
    let year = startYear;

    if (month > 12) {
      month = month - 12;
      year++;
    }

    const forecast = await this.findOne({ month, year });
    if (forecast) {
      forecasts.push(forecast);
    }
  }

  return {
    forecasts,
    totalProjectedInflows: forecasts.reduce((sum, f) => sum + f.totalProjectedInflows, 0),
    totalProjectedOutflows: forecasts.reduce((sum, f) => sum + f.totalProjectedOutflows, 0),
    netCashFlow: forecasts.reduce((sum, f) => sum + f.netCashFlow, 0),
    shortfallMonths: forecasts.filter((f) => f.aiPrediction?.cashShortfall).length,
  };
};

// Static method to get accuracy metrics
cashFlowForecastSchema.statics.getAccuracyMetrics = async function (months = 6) {
  const forecasts = await this.find({
    actualClosingBalance: { $exists: true, $ne: null },
  })
    .sort({ year: -1, month: -1 })
    .limit(months);

  if (forecasts.length === 0) return { averageAccuracy: 0, count: 0 };

  const totalAccuracy = forecasts.reduce((sum, f) => sum + (f.variance?.accuracyRate || 0), 0);

  return {
    averageAccuracy: Math.round(totalAccuracy / forecasts.length),
    count: forecasts.length,
    bestMonth: forecasts.reduce((best, f) =>
      (f.variance?.accuracyRate || 0) > (best.variance?.accuracyRate || 0) ? f : best
    ),
    worstMonth: forecasts.reduce((worst, f) =>
      (f.variance?.accuracyRate || 0) < (worst.variance?.accuracyRate || 0) ? f : worst
    ),
  };
};

module.exports = mongoose.model('CashFlowForecast', cashFlowForecastSchema);
