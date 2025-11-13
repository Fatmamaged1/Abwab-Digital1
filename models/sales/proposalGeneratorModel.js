const mongoose = require('mongoose');

const proposalGeneratorSchema = new mongoose.Schema({
  proposalNumber: {
    type: String,
    unique: true,
    // Auto-generated: PROP2025000001
  },
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: [true, 'Opportunity reference is required'],
    index: true,
  },
  type: {
    type: String,
    enum: ['technical', 'financial', 'combined'],
    required: [true, 'Proposal type is required'],
    default: 'combined',
  },
  status: {
    type: String,
    enum: ['draft', 'pending-review', 'approved', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
    index: true,
  },
  client: {
    name: {
      ar: String,
      en: String,
    },
    industry: String,
    contact: {
      name: String,
      email: String,
      phone: String,
      position: String,
    },
    company: {
      size: String,
      revenue: String,
      location: String,
    },
  },
  project: {
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
      ar: String,
      en: String,
    },
    scope: [
      {
        ar: String,
        en: String,
      },
    ],
    deliverables: [
      {
        ar: String,
        en: String,
      },
    ],
    timeline: {
      duration: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'weeks',
      },
      phases: [
        {
          name: {
            ar: String,
            en: String,
          },
          duration: Number,
          deliverables: [String],
          milestones: [String],
        },
      ],
    },
  },
  technical: {
    technologies: [
      {
        name: String,
        category: {
          type: String,
          enum: ['frontend', 'backend', 'database', 'infrastructure', 'tools', 'other'],
        },
        version: String,
      },
    ],
    architecture: {
      type: String,
      description: 'System architecture description',
    },
    team: [
      {
        role: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          min: 1,
          required: true,
        },
        experience: String,
        responsibilities: {
          ar: String,
          en: String,
        },
      },
    ],
    methodology: {
      type: String,
      enum: ['agile', 'scrum', 'waterfall', 'hybrid'],
      default: 'agile',
    },
    qualityAssurance: {
      ar: String,
      en: String,
    },
    securityMeasures: {
      ar: String,
      en: String,
    },
    scalability: {
      ar: String,
      en: String,
    },
  },
  financial: {
    items: [
      {
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
        quantity: {
          type: Number,
          min: 0,
          required: true,
        },
        unitPrice: {
          type: Number,
          min: 0,
          required: true,
        },
        total: {
          type: Number,
          min: 0,
        },
        category: {
          type: String,
          enum: ['development', 'design', 'infrastructure', 'licensing', 'support', 'training', 'other'],
        },
      },
    ],
    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    vat: {
      type: Number,
      min: 0,
      default: 0,
      description: 'VAT amount (15% in Saudi Arabia)',
    },
    vatRate: {
      type: Number,
      default: 15,
      description: 'VAT rate percentage',
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    total: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentTerms: {
      ar: String,
      en: String,
    },
    paymentSchedule: [
      {
        milestone: String,
        percentage: Number,
        amount: Number,
        dueDate: String,
      },
    ],
    currency: {
      type: String,
      default: 'SAR',
    },
  },
  aiGenerated: {
    type: Boolean,
    default: false,
    description: 'Whether content was AI-generated',
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProposalTemplate',
    description: 'Template used for generation',
  },
  generatedContent: {
    executiveSummary: {
      ar: String,
      en: String,
    },
    problemStatement: {
      ar: String,
      en: String,
    },
    proposedSolution: {
      ar: String,
      en: String,
    },
    valueProposition: {
      ar: String,
      en: String,
    },
    whyUs: {
      ar: String,
      en: String,
    },
    caseStudies: [
      {
        title: String,
        client: String,
        challenge: String,
        solution: String,
        results: String,
      },
    ],
    riskMitigation: {
      ar: String,
      en: String,
    },
    nextSteps: {
      ar: String,
      en: String,
    },
    termsAndConditions: {
      ar: String,
      en: String,
    },
  },
  attachments: [
    {
      filename: String,
      path: String,
      type: {
        type: String,
        enum: ['pdf', 'document', 'presentation', 'spreadsheet', 'other'],
      },
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  validity: {
    validUntil: {
      type: Date,
      description: 'Proposal expiration date',
    },
    daysValid: {
      type: Number,
      default: 30,
      description: 'Number of days proposal is valid',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  sentAt: Date,
  sentTo: [
    {
      email: String,
      name: String,
      sentAt: Date,
    },
  ],
  viewedBy: [
    {
      email: String,
      viewedAt: Date,
      viewCount: {
        type: Number,
        default: 1,
      },
    },
  ],
  clientFeedback: {
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'questions', 'negotiating', 'accepted', 'rejected'],
    },
    comments: String,
    timestamp: Date,
  },
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

// Auto-generate proposal number
proposalGeneratorSchema.pre('save', async function (next) {
  if (!this.proposalNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      proposalNumber: new RegExp(`^PROP${year}`),
    });
    this.proposalNumber = `PROP${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate financial totals
  if (this.financial && this.financial.items) {
    // Calculate item totals
    this.financial.items.forEach((item) => {
      item.total = item.quantity * item.unitPrice;
    });

    // Calculate subtotal
    this.financial.subtotal = this.financial.items.reduce((sum, item) => sum + item.total, 0);

    // Apply discount
    let afterDiscount = this.financial.subtotal;
    if (this.financial.discount > 0) {
      if (this.financial.discountType === 'percentage') {
        afterDiscount = this.financial.subtotal * (1 - this.financial.discount / 100);
      } else {
        afterDiscount = this.financial.subtotal - this.financial.discount;
      }
    }

    // Calculate VAT
    this.financial.vat = afterDiscount * (this.financial.vatRate / 100);

    // Calculate total
    this.financial.total = afterDiscount + this.financial.vat;
  }

  // Set validity date
  if (!this.validity.validUntil && this.validity.daysValid) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + this.validity.daysValid);
    this.validity.validUntil = validUntil;
  }

  next();
});

// Indexes
proposalGeneratorSchema.index({ proposalNumber: 1 });
proposalGeneratorSchema.index({ opportunity: 1 });
proposalGeneratorSchema.index({ status: 1 });
proposalGeneratorSchema.index({ createdBy: 1, createdAt: -1 });
proposalGeneratorSchema.index({ 'validity.validUntil': 1 });

// Virtual for is expired
proposalGeneratorSchema.virtual('isExpired').get(function () {
  if (!this.validity.validUntil) return false;
  return new Date() > this.validity.validUntil;
});

// Virtual for total value
proposalGeneratorSchema.virtual('totalValue').get(function () {
  return this.financial?.total || 0;
});

// Method to mark as sent
proposalGeneratorSchema.methods.markAsSent = function (recipients) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.sentTo = recipients.map((r) => ({
    email: r.email,
    name: r.name,
    sentAt: new Date(),
  }));
};

// Method to track view
proposalGeneratorSchema.methods.trackView = function (email) {
  const existingView = this.viewedBy.find((v) => v.email === email);
  if (existingView) {
    existingView.viewCount++;
    existingView.viewedAt = new Date();
  } else {
    this.viewedBy.push({
      email,
      viewedAt: new Date(),
      viewCount: 1,
    });
  }
};

// Static method to get proposal statistics
proposalGeneratorSchema.statics.getProposalStatistics = async function (filters = {}, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const proposals = await this.find({
    ...filters,
    createdAt: { $gte: startDate },
  });

  return {
    total: proposals.length,
    byStatus: {
      draft: proposals.filter((p) => p.status === 'draft').length,
      sent: proposals.filter((p) => p.status === 'sent').length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      rejected: proposals.filter((p) => p.status === 'rejected').length,
    },
    totalValue: proposals.reduce((sum, p) => sum + (p.financial?.total || 0), 0),
    acceptedValue: proposals
      .filter((p) => p.status === 'accepted')
      .reduce((sum, p) => sum + (p.financial?.total || 0), 0),
    winRate: proposals.filter((p) => p.status === 'sent' || p.status === 'accepted' || p.status === 'rejected').length > 0
      ? Math.round(
          (proposals.filter((p) => p.status === 'accepted').length /
            proposals.filter((p) => p.status === 'sent' || p.status === 'accepted' || p.status === 'rejected').length) *
            100
        )
      : 0,
    averageValue: proposals.length > 0
      ? Math.round(proposals.reduce((sum, p) => sum + (p.financial?.total || 0), 0) / proposals.length)
      : 0,
  };
};

module.exports = mongoose.model('ProposalGenerator', proposalGeneratorSchema);
