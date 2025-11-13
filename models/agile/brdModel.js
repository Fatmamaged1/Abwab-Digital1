const mongoose = require('mongoose');

const brdSchema = new mongoose.Schema({
  brdNumber: {
    type: String,
    unique: true,
    // Auto-generated: BRD2025000001
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    index: true,
  },
  version: {
    type: String,
    default: '1.0',
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'archived'],
    default: 'draft',
    index: true,
  },
  executiveSummary: {
    ar: {
      type: String,
      required: [true, 'Arabic executive summary is required'],
    },
    en: {
      type: String,
      required: [true, 'English executive summary is required'],
    },
  },
  businessObjectives: [
    {
      ar: String,
      en: String,
      priority: {
        type: Number,
        min: 1,
      },
    },
  ],
  scope: {
    inScope: [
      {
        ar: String,
        en: String,
      },
    ],
    outOfScope: [
      {
        ar: String,
        en: String,
      },
    ],
  },
  stakeholders: [
    {
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      email: String,
      phone: String,
      responsibilities: String,
      department: String,
      influenceLevel: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
      },
    },
  ],
  functionalRequirements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
    },
  ],
  nonFunctionalRequirements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
    },
  ],
  assumptions: [
    {
      ar: String,
      en: String,
      critical: Boolean,
    },
  ],
  constraints: [
    {
      ar: String,
      en: String,
      type: {
        type: String,
        enum: ['budget', 'time', 'resource', 'technical', 'regulatory'],
      },
    },
  ],
  risks: [
    {
      description: {
        ar: String,
        en: String,
      },
      impact: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
      },
      probability: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
      },
      mitigation: {
        ar: String,
        en: String,
      },
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['open', 'monitoring', 'mitigated', 'closed'],
        default: 'open',
      },
    },
  ],
  timeline: {
    expectedStart: Date,
    expectedEnd: Date,
    milestones: [
      {
        name: {
          ar: String,
          en: String,
        },
        date: Date,
        deliverables: [String],
        status: {
          type: String,
          enum: ['upcoming', 'in-progress', 'completed', 'delayed'],
          default: 'upcoming',
        },
      },
    ],
  },
  budget: {
    estimated: {
      type: Number,
      min: 0,
    },
    approved: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    breakdown: [
      {
        category: String,
        amount: Number,
        description: String,
      },
    ],
  },
  successCriteria: [
    {
      ar: String,
      en: String,
      measurable: Boolean,
      target: String,
    },
  ],
  // AI Generated Content
  aiGeneratedContent: {
    epics: [
      {
        name: { ar: String, en: String },
        description: { ar: String, en: String },
        priority: String,
        estimatedStoryPoints: Number,
      },
    ],
    userStories: [String],
    tasks: [String],
    timeline: mongoose.Schema.Types.Mixed,
    risks: [String],
    recommendations: [String],
    generatedAt: Date,
  },
  // Approval Workflow
  approvalWorkflow: [
    {
      step: {
        type: Number,
        required: true,
      },
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      comments: String,
      timestamp: Date,
    },
  ],
  // Attachments
  attachments: [
    {
      filename: String,
      path: String,
      mimeType: String,
      size: Number,
      category: {
        type: String,
        enum: ['diagram', 'mockup', 'specification', 'other'],
      },
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  // Version History
  previousVersions: [
    {
      version: String,
      brdData: mongoose.Schema.Types.Mixed,
      modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      modifiedAt: Date,
      changeNotes: String,
    },
  ],
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

// Auto-generate BRD number
brdSchema.pre('save', async function (next) {
  if (!this.brdNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      brdNumber: new RegExp(`^BRD${year}`),
    });
    this.brdNumber = `BRD${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
brdSchema.index({ project: 1, version: 1 });
brdSchema.index({ status: 1 });
brdSchema.index({ 'executiveSummary.en': 'text', 'executiveSummary.ar': 'text' });
brdSchema.index({ createdAt: -1 });

// Virtual for overall risk score
brdSchema.virtual('overallRiskScore').get(function () {
  if (!this.risks || this.risks.length === 0) return 0;

  const riskScores = this.risks.map((risk) => {
    const impactScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const probabilityScores = { low: 1, medium: 2, high: 3 };
    return impactScores[risk.impact] * probabilityScores[risk.probability];
  });

  const avgScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
  return Math.round(avgScore * 10) / 10;
});

// Method to create new version
brdSchema.methods.createNewVersion = function (changeNotes, userId) {
  this.previousVersions.push({
    version: this.version,
    brdData: this.toObject(),
    modifiedBy: userId,
    modifiedAt: new Date(),
    changeNotes: changeNotes,
  });

  const [major, minor] = this.version.split('.').map(Number);
  this.version = `${major}.${minor + 1}`;
  this.lastModifiedBy = userId;
};

module.exports = mongoose.model('BRD', brdSchema);
