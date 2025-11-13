const mongoose = require('mongoose');

const projectRequirementSchema = new mongoose.Schema({
  requirementNumber: {
    type: String,
    unique: true,
    // Auto-generated: REQ2025000001
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    index: true,
  },
  type: {
    type: String,
    enum: ['functional', 'non-functional', 'technical', 'business'],
    required: [true, 'Requirement type is required'],
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'in-progress', 'completed', 'rejected'],
    default: 'draft',
    index: true,
  },
  title: {
    ar: {
      type: String,
      required: [true, 'Arabic title is required'],
      trim: true,
    },
    en: {
      type: String,
      required: [true, 'English title is required'],
      trim: true,
    },
  },
  description: {
    ar: {
      type: String,
      required: [true, 'Arabic description is required'],
    },
    en: {
      type: String,
      required: [true, 'English description is required'],
    },
  },
  acceptanceCriteria: [
    {
      ar: String,
      en: String,
    },
  ],
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  dependencies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
    },
  ],
  attachments: [
    {
      filename: String,
      path: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  // AI Analysis
  aiAnalysis: {
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex', 'very-complex'],
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    suggestedTasks: [String],
    estimatedEffort: String,
    recommendations: [String],
    analyzedAt: Date,
  },
  // Tracking
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
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: String,
  rejectedAt: Date,
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

// Auto-generate requirement number
projectRequirementSchema.pre('save', async function (next) {
  if (!this.requirementNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      requirementNumber: new RegExp(`^REQ${year}`),
    });
    this.requirementNumber = `REQ${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for performance
projectRequirementSchema.index({ project: 1, status: 1 });
projectRequirementSchema.index({ 'title.en': 'text', 'title.ar': 'text', 'description.en': 'text', 'description.ar': 'text' });
projectRequirementSchema.index({ createdAt: -1 });

// Virtual for progress percentage
projectRequirementSchema.virtual('progressPercentage').get(function () {
  if (this.estimatedHours === 0) return 0;
  return Math.round((this.actualHours / this.estimatedHours) * 100);
});

module.exports = mongoose.model('ProjectRequirement', projectRequirementSchema);
