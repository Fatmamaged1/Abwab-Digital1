const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    // Budget Name
    name: {
      ar: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },

    // Budget Type
    type: {
      type: String,
      enum: [
        'departmental',
        'project',
        'campaign',
        'expense_category',
        'revenue',
        'operational',
        'capital',
        'master',
      ],
      required: true,
    },

    // Budget Period
    period: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'custom'],
      required: true,
    },
    fiscalYear: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    hijriStartDate: {
      year: Number,
      month: Number,
      day: Number,
      formatted: String,
    },
    hijriEndDate: {
      year: Number,
      month: Number,
      day: Number,
      formatted: String,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'locked', 'closed', 'archived'],
      default: 'draft',
    },

    // Linked Entities
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },

    // Budget Owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Currency
    currency: {
      type: String,
      enum: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP'],
      default: 'SAR',
    },

    // Budget Lines
    lines: [
      {
        lineNumber: {
          type: Number,
          required: true,
        },
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Account',
          required: true,
        },
        category: {
          ar: String,
          en: String,
        },
        description: {
          ar: String,
          en: String,
        },
        // Budget allocations by month (for monthly budgets)
        monthlyAllocations: [
          {
            month: {
              type: Number,
              min: 1,
              max: 12,
            },
            budgetedAmount: {
              type: Number,
              default: 0,
            },
            actualAmount: {
              type: Number,
              default: 0,
            },
            variance: {
              type: Number,
              default: 0,
            },
            variancePercentage: {
              type: Number,
              default: 0,
            },
          },
        ],
        // Total amounts
        totalBudgeted: {
          type: Number,
          required: true,
          default: 0,
        },
        totalActual: {
          type: Number,
          default: 0,
        },
        totalVariance: {
          type: Number,
          default: 0,
        },
        variancePercentage: {
          type: Number,
          default: 0,
        },
        // Alerts
        warningThreshold: {
          type: Number,
          default: 80, // Alert at 80% utilization
        },
        criticalThreshold: {
          type: Number,
          default: 95, // Critical alert at 95% utilization
        },
        isOverBudget: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Total Budget
    totalBudgeted: {
      type: Number,
      default: 0,
    },
    totalActual: {
      type: Number,
      default: 0,
    },
    totalVariance: {
      type: Number,
      default: 0,
    },
    variancePercentage: {
      type: Number,
      default: 0,
    },
    utilizationPercentage: {
      type: Number,
      default: 0,
    },

    // Approval Workflow
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    approvers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        approvedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        comments: String,
      },
    ],

    // Notes
    description: {
      ar: String,
      en: String,
    },
    notes: String,
    assumptions: {
      ar: String,
      en: String,
    },

    // Revision Control
    version: {
      type: Number,
      default: 1,
    },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
    },
    revisionHistory: [
      {
        version: Number,
        revisedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        revisedAt: Date,
        changes: String,
      },
    ],

    // Alerts and Notifications
    alerts: [
      {
        type: {
          type: String,
          enum: ['warning', 'critical', 'overbudget', 'underutilized'],
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        acknowledgedAt: Date,
      },
    ],

    // System Fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
budgetSchema.index({ fiscalYear: 1 });
budgetSchema.index({ status: 1 });
budgetSchema.index({ type: 1 });
budgetSchema.index({ department: 1 });
budgetSchema.index({ project: 1 });
budgetSchema.index({ campaign: 1 });
budgetSchema.index({ owner: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });
budgetSchema.index({ isDeleted: 1 });

// Virtuals
budgetSchema.virtual('isOverBudget').get(function () {
  return this.totalActual > this.totalBudgeted;
});

budgetSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

budgetSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  if (this.endDate < now) return 0;
  return Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
budgetSchema.pre('save', function (next) {
  // Calculate totals
  let totalBudgeted = 0;
  let totalActual = 0;

  this.lines.forEach((line, index) => {
    line.lineNumber = index + 1;

    // Calculate monthly variances
    if (line.monthlyAllocations && line.monthlyAllocations.length > 0) {
      line.monthlyAllocations.forEach((month) => {
        month.variance = month.budgetedAmount - month.actualAmount;
        month.variancePercentage =
          month.budgetedAmount > 0 ? ((month.variance / month.budgetedAmount) * 100).toFixed(2) : 0;
      });

      // Sum up monthly amounts
      line.totalBudgeted = line.monthlyAllocations.reduce((sum, m) => sum + m.budgetedAmount, 0);
      line.totalActual = line.monthlyAllocations.reduce((sum, m) => sum + m.actualAmount, 0);
    }

    // Calculate line variance
    line.totalVariance = line.totalBudgeted - line.totalActual;
    line.variancePercentage =
      line.totalBudgeted > 0 ? ((line.totalVariance / line.totalBudgeted) * 100).toFixed(2) : 0;

    // Check if over budget
    line.isOverBudget = line.totalActual > line.totalBudgeted;

    // Add to total
    totalBudgeted += line.totalBudgeted;
    totalActual += line.totalActual;
  });

  // Set totals
  this.totalBudgeted = Math.round(totalBudgeted * 100) / 100;
  this.totalActual = Math.round(totalActual * 100) / 100;
  this.totalVariance = Math.round((this.totalBudgeted - this.totalActual) * 100) / 100;
  this.variancePercentage =
    this.totalBudgeted > 0 ? ((this.totalVariance / this.totalBudgeted) * 100).toFixed(2) : 0;
  this.utilizationPercentage =
    this.totalBudgeted > 0 ? ((this.totalActual / this.totalBudgeted) * 100).toFixed(2) : 0;

  // Generate alerts
  this.lines.forEach((line) => {
    const utilization = line.totalBudgeted > 0 ? (line.totalActual / line.totalBudgeted) * 100 : 0;

    // Check for warnings
    if (utilization >= line.criticalThreshold && !line.isOverBudget) {
      this.addAlert('critical', `Budget line ${line.lineNumber} is at ${utilization.toFixed(1)}% utilization`);
    } else if (utilization >= line.warningThreshold) {
      this.addAlert('warning', `Budget line ${line.lineNumber} is at ${utilization.toFixed(1)}% utilization`);
    }

    // Check for over budget
    if (line.isOverBudget) {
      const overAmount = Math.abs(line.totalVariance);
      this.addAlert('overbudget', `Budget line ${line.lineNumber} is over budget by ${overAmount.toFixed(2)}`);
    }
  });

  next();
});

// Query middleware to exclude soft-deleted documents
budgetSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
budgetSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'archived';
  return this.save();
};

budgetSchema.methods.activate = async function () {
  if (this.status !== 'draft') {
    throw new Error('Only draft budgets can be activated');
  }
  this.status = 'active';
  return this.save();
};

budgetSchema.methods.lock = async function () {
  if (this.status !== 'active') {
    throw new Error('Only active budgets can be locked');
  }
  this.status = 'locked';
  return this.save();
};

budgetSchema.methods.close = async function () {
  if (this.status !== 'active' && this.status !== 'locked') {
    throw new Error('Only active or locked budgets can be closed');
  }
  this.status = 'closed';
  return this.save();
};

budgetSchema.methods.addAlert = function (type, message) {
  // Check if similar alert already exists and is not acknowledged
  const existingAlert = this.alerts.find(
    (alert) => alert.type === type && alert.message === message && !alert.acknowledged
  );

  if (!existingAlert) {
    this.alerts.push({
      type,
      message,
      createdAt: new Date(),
    });
  }
};

budgetSchema.methods.acknowledgeAlert = function (alertId, userId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
  }
  return this.save();
};

budgetSchema.methods.updateActuals = async function () {
  const Expense = mongoose.model('Expense');
  const JournalEntry = mongoose.model('JournalEntry');

  // Update actual amounts based on expenses and journal entries
  for (const line of this.lines) {
    let actualAmount = 0;

    // Query for expenses related to this account
    const expenses = await Expense.find({
      expenseAccount: line.account,
      expenseDate: { $gte: this.startDate, $lte: this.endDate },
      status: { $in: ['approved', 'paid'] },
      isDeleted: false,
    });

    actualAmount = expenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);

    // Also check journal entries
    const journalEntries = await JournalEntry.find({
      'lines.account': line.account,
      date: { $gte: this.startDate, $lte: this.endDate },
      status: 'posted',
      isDeleted: false,
    });

    journalEntries.forEach((entry) => {
      entry.lines.forEach((jLine) => {
        if (jLine.account.toString() === line.account.toString()) {
          if (jLine.type === 'debit') {
            actualAmount += jLine.amountInBaseCurrency;
          }
        }
      });
    });

    line.totalActual = Math.round(actualAmount * 100) / 100;

    // Update monthly allocations if applicable
    if (this.period === 'monthly' && line.monthlyAllocations.length > 0) {
      for (const monthData of line.monthlyAllocations) {
        const monthStart = new Date(this.fiscalYear, monthData.month - 1, 1);
        const monthEnd = new Date(this.fiscalYear, monthData.month, 0);

        const monthExpenses = await Expense.find({
          expenseAccount: line.account,
          expenseDate: { $gte: monthStart, $lte: monthEnd },
          status: { $in: ['approved', 'paid'] },
          isDeleted: false,
        });

        monthData.actualAmount = monthExpenses.reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);
      }
    }
  }

  return this.save();
};

budgetSchema.methods.createRevision = async function (userId, changes) {
  // Save revision history
  this.revisionHistory.push({
    version: this.version,
    revisedBy: userId,
    revisedAt: new Date(),
    changes,
  });

  this.version += 1;
  this.updatedBy = userId;

  return this.save();
};

// Ensure virtual fields are included when converting to JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
