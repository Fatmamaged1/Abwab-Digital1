const mongoose = require('mongoose');

const projectBillingSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    unique: true,
    index: true,
  },
  billingType: {
    type: String,
    enum: ['fixed-price', 'time-and-material', 'milestone', 'retainer'],
    required: [true, 'Billing type is required'],
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  // Milestone-based Billing
  milestones: [
    {
      name: {
        ar: String,
        en: String,
      },
      description: String,
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      amount: {
        type: Number,
        min: 0,
      },
      dueDate: Date,
      completedDate: Date,
      invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
      },
      status: {
        type: String,
        enum: ['pending', 'invoiced', 'paid', 'overdue'],
        default: 'pending',
      },
    },
  ],
  // Time and Material Tracking
  timeTracking: {
    billableHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    nonBillableHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      description: 'Rate per hour in SAR',
    },
    totalBillable: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: Date,
  },
  // Expenses
  expenses: [
    {
      expense: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
      billable: {
        type: Boolean,
        default: true,
      },
      amount: {
        type: Number,
        min: 0,
      },
      category: String,
      description: String,
      invoiced: {
        type: Boolean,
        default: false,
      },
    },
  ],
  // Retainer Details
  retainer: {
    monthlyAmount: {
      type: Number,
      min: 0,
    },
    hoursIncluded: {
      type: Number,
      min: 0,
    },
    startDate: Date,
    endDate: Date,
    renewalType: {
      type: String,
      enum: ['auto', 'manual', 'none'],
      default: 'manual',
    },
  },
  // Financial Summary
  totalBilled: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total amount invoiced',
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total amount received',
  },
  outstanding: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Amount still owed',
  },
  // Invoice Schedule
  invoiceSchedule: [
    {
      scheduledDate: Date,
      amount: Number,
      description: String,
      generated: {
        type: Boolean,
        default: false,
      },
      invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
      },
    },
  ],
  nextInvoiceDate: Date,
  // Budget vs Actual
  budgetVsActual: {
    budgeted: {
      type: Number,
      min: 0,
    },
    actual: {
      type: Number,
      min: 0,
    },
    variance: {
      type: Number,
      description: 'Budgeted - Actual',
    },
    variancePercentage: {
      type: Number,
      description: 'Variance as percentage of budget',
    },
  },
  // Profit Margin
  profitMargin: {
    revenue: {
      type: Number,
      default: 0,
    },
    costs: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    marginPercentage: {
      type: Number,
      default: 0,
    },
  },
  // Metadata
  isActive: {
    type: Boolean,
    default: true,
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save hook to calculate totals
projectBillingSchema.pre('save', function (next) {
  // Calculate time tracking total
  if (this.timeTracking && this.timeTracking.hourlyRate) {
    this.timeTracking.totalBillable = this.timeTracking.billableHours * this.timeTracking.hourlyRate;
  }

  // Calculate outstanding
  this.outstanding = this.totalBilled - this.totalPaid;

  // Calculate budget variance
  if (this.budgetVsActual && this.budgetVsActual.budgeted) {
    this.budgetVsActual.actual = this.totalBilled;
    this.budgetVsActual.variance = this.budgetVsActual.budgeted - this.budgetVsActual.actual;
    this.budgetVsActual.variancePercentage = this.budgetVsActual.budgeted > 0
      ? Math.round((this.budgetVsActual.variance / this.budgetVsActual.budgeted) * 100)
      : 0;
  }

  // Calculate profit margin
  if (this.profitMargin) {
    this.profitMargin.revenue = this.totalBilled;
    this.profitMargin.profit = this.profitMargin.revenue - this.profitMargin.costs;
    this.profitMargin.marginPercentage = this.profitMargin.revenue > 0
      ? Math.round((this.profitMargin.profit / this.profitMargin.revenue) * 100)
      : 0;
  }

  next();
});

// Indexes
projectBillingSchema.index({ project: 1 });
projectBillingSchema.index({ billingType: 1 });
projectBillingSchema.index({ isActive: 1 });
projectBillingSchema.index({ nextInvoiceDate: 1 });

// Virtual for completion percentage (milestones)
projectBillingSchema.virtual('completionPercentage').get(function () {
  if (!this.milestones || this.milestones.length === 0) return 0;

  const completed = this.milestones.filter((m) => m.status === 'paid').length;
  return Math.round((completed / this.milestones.length) * 100);
});

// Virtual for collection rate
projectBillingSchema.virtual('collectionRate').get(function () {
  if (this.totalBilled === 0) return 0;
  return Math.round((this.totalPaid / this.totalBilled) * 100);
});

// Method to add billable hours
projectBillingSchema.methods.addBillableHours = function (hours, description) {
  this.timeTracking.billableHours += hours;
  this.timeTracking.lastUpdated = new Date();

  if (this.timeTracking.hourlyRate) {
    this.timeTracking.totalBillable = this.timeTracking.billableHours * this.timeTracking.hourlyRate;
  }
};

// Method to mark milestone as completed
projectBillingSchema.methods.completeMilestone = function (milestoneId, invoiceId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.completedDate = new Date();
    milestone.invoice = invoiceId;
    milestone.status = 'invoiced';
    this.totalBilled += milestone.amount;
  }
};

// Method to record payment
projectBillingSchema.methods.recordPayment = function (amount, milestoneId = null) {
  this.totalPaid += amount;

  if (milestoneId) {
    const milestone = this.milestones.id(milestoneId);
    if (milestone) {
      milestone.status = 'paid';
    }
  }
};

// Static method to get billing summary
projectBillingSchema.statics.getBillingSummary = async function (filters = {}) {
  const billings = await this.find(filters);

  return {
    totalProjects: billings.length,
    totalBilled: billings.reduce((sum, b) => sum + b.totalBilled, 0),
    totalPaid: billings.reduce((sum, b) => sum + b.totalPaid, 0),
    totalOutstanding: billings.reduce((sum, b) => sum + b.outstanding, 0),
    averageCollectionRate: billings.length > 0
      ? Math.round(billings.reduce((sum, b) => sum + b.collectionRate, 0) / billings.length)
      : 0,
    byBillingType: this.groupByBillingType(billings),
  };
};

// Helper method
projectBillingSchema.statics.groupByBillingType = function (billings) {
  return billings.reduce((acc, billing) => {
    acc[billing.billingType] = (acc[billing.billingType] || 0) + 1;
    return acc;
  }, {});
};

module.exports = mongoose.model('ProjectBilling', projectBillingSchema);
