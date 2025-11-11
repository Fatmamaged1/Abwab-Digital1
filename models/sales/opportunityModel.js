const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Opportunity name is required'],
    trim: true,
    maxLength: [200, 'Opportunity name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Related Records
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead reference is required']
  },
  account: {
    name: {
      type: String,
      required: [true, 'Account name is required']
    },
    website: String,
    industry: String,
    size: String
  },
  contact: {
    firstName: {
      type: String,
      required: [true, 'Contact first name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Contact last name is required']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true
    },
    phone: String,
    jobTitle: String
  },

  // Sales Information
  amount: {
    value: {
      type: Number,
      required: [true, 'Opportunity amount is required'],
      min: [0, 'Amount must be positive']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP'],
      default: 'USD'
    }
  },
  expectedRevenue: {
    type: Number,
    min: [0, 'Expected revenue must be positive']
  },
  probability: {
    type: Number,
    min: [0, 'Probability must be between 0 and 100'],
    max: [100, 'Probability must be between 0 and 100'],
    default: 10
  },

  // Pipeline Management
  stage: {
    type: String,
    enum: [
      'qualification',
      'needs_analysis',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost'
    ],
    default: 'qualification',
    required: true
  },
  stageHistory: [{
    stage: {
      type: String,
      required: true
    },
    enteredAt: {
      type: Date,
      default: Date.now
    },
    exitedAt: Date,
    duration: Number, // in days
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Timeline
  expectedCloseDate: {
    type: Date,
    required: [true, 'Expected close date is required']
  },
  actualCloseDate: Date,

  // Assignment
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Opportunity owner is required']
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'support', 'technical', 'executive']
    }
  }],

  // Type & Category
  type: {
    type: String,
    enum: ['new_business', 'existing_customer', 'renewal', 'upsell'],
    default: 'new_business'
  },
  category: {
    type: String,
    enum: ['software', 'consulting', 'design', 'development', 'maintenance', 'other']
  },

  // Competition
  competitors: [{
    name: String,
    strengths: String,
    weaknesses: String
  }],

  // Products/Services
  lineItems: [{
    product: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],

  // Decision Makers
  decisionMakers: [{
    name: String,
    role: String,
    email: String,
    phone: String,
    influence: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    stance: {
      type: String,
      enum: ['champion', 'supporter', 'neutral', 'blocker']
    }
  }],

  // Next Steps & Actions
  nextStep: {
    action: String,
    dueDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    }
  },

  // Risk Assessment
  risk: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    factors: [String],
    mitigation: String
  },

  // Loss Analysis (for closed lost)
  lossReason: {
    type: String,
    enum: [
      'price',
      'competitor',
      'timing',
      'no_budget',
      'no_decision',
      'lost_contact',
      'other'
    ]
  },
  lossDetails: String,

  // Status
  isClosed: {
    type: Boolean,
    default: false
  },
  isWon: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Tags
  tags: [String],

  // Notes
  notes: {
    type: String,
    maxLength: [5000, 'Notes cannot exceed 5000 characters']
  },

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Custom Fields
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
opportunitySchema.virtual('contactFullName').get(function() {
  return `${this.contact.firstName} ${this.contact.lastName}`;
});

opportunitySchema.virtual('daysInStage').get(function() {
  if (this.stageHistory.length > 0) {
    const currentStage = this.stageHistory[this.stageHistory.length - 1];
    if (!currentStage.exitedAt) {
      const days = Math.floor((Date.now() - currentStage.enteredAt) / (1000 * 60 * 60 * 24));
      return days;
    }
  }
  return 0;
});

opportunitySchema.virtual('daysToClose').get(function() {
  if (this.expectedCloseDate) {
    return Math.floor((this.expectedCloseDate - Date.now()) / (1000 * 60 * 60 * 24));
  }
  return null;
});

opportunitySchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'opportunity'
});

opportunitySchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'opportunity'
});

// Indexes
opportunitySchema.index({ owner: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ expectedCloseDate: 1 });
opportunitySchema.index({ 'amount.value': -1 });
opportunitySchema.index({ lead: 1 });
opportunitySchema.index({ isClosed: 1 });
opportunitySchema.index({ isWon: 1 });
opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index({ 'account.name': 1 });

// Pre-save middleware
opportunitySchema.pre('save', function(next) {
  // Calculate expected revenue based on amount and probability
  if (this.amount.value && this.probability) {
    this.expectedRevenue = this.amount.value * (this.probability / 100);
  }

  // Auto-close based on stage
  if (this.stage === 'closed_won') {
    this.isClosed = true;
    this.isWon = true;
    if (!this.actualCloseDate) {
      this.actualCloseDate = new Date();
    }
  } else if (this.stage === 'closed_lost') {
    this.isClosed = true;
    this.isWon = false;
    if (!this.actualCloseDate) {
      this.actualCloseDate = new Date();
    }
  }

  // Track stage changes
  if (this.isModified('stage')) {
    // Exit previous stage
    if (this.stageHistory.length > 0) {
      const lastStage = this.stageHistory[this.stageHistory.length - 1];
      if (!lastStage.exitedAt) {
        lastStage.exitedAt = new Date();
        lastStage.duration = Math.floor((lastStage.exitedAt - lastStage.enteredAt) / (1000 * 60 * 60 * 24));
      }
    }

    // Enter new stage
    this.stageHistory.push({
      stage: this.stage,
      enteredAt: new Date(),
      changedBy: this.updatedBy
    });
  }

  // Calculate line items total
  if (this.lineItems && this.lineItems.length > 0) {
    let total = 0;
    this.lineItems.forEach(item => {
      const discountAmount = item.unitPrice * item.quantity * (item.discount / 100);
      item.total = (item.unitPrice * item.quantity) - discountAmount;
      total += item.total;
    });
    this.amount.value = total;
  }

  next();
});

// Static methods
opportunitySchema.statics.getPipelineMetrics = async function(userId) {
  return this.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(userId), isDeleted: false, isClosed: false } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$amount.value' },
        avgProbability: { $avg: '$probability' }
      }
    }
  ]);
};

opportunitySchema.statics.getWinRate = async function(userId, startDate, endDate) {
  const opportunities = await this.find({
    owner: userId,
    isClosed: true,
    actualCloseDate: { $gte: startDate, $lte: endDate }
  });

  const total = opportunities.length;
  const won = opportunities.filter(opp => opp.isWon).length;

  return {
    total,
    won,
    lost: total - won,
    winRate: total > 0 ? (won / total * 100).toFixed(2) : 0
  };
};

module.exports = mongoose.models.Opportunity || mongoose.model('Opportunity', opportunitySchema);
