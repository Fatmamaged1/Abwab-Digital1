const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxLength: [100, 'Job title cannot exceed 100 characters']
  },

  // Company Information
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxLength: [200, 'Company name cannot exceed 200 characters']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    },
    industry: {
      type: String,
      enum: [
        'technology', 'healthcare', 'finance', 'education', 'manufacturing',
        'retail', 'real_estate', 'automotive', 'media', 'consulting', 'other'
      ]
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    status: {
      type: String,
      enum: ['prospect', 'customer', 'churned'],
      default: 'prospect'
    }
  },

  // Lead Classification
  source: {
    type: String,
    enum: ['web', 'referral', 'ads', 'event', 'cold_outreach', 'other'],
    required: [true, 'Lead source is required']
  },
  campaign: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'working', 'qualified', 'unqualified', 'converted'],
    default: 'new'
  },
  pipelineStage: {
    type: String,
    enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'prospecting'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lead owner is required']
  },

  // BANT Scoring (0-10 each)
  bant: {
    budget: {
      type: Number,
      min: [0, 'Budget score must be between 0 and 10'],
      max: [10, 'Budget score must be between 0 and 10'],
      default: 0
    },
    authority: {
      type: Number,
      min: [0, 'Authority score must be between 0 and 10'],
      max: [10, 'Authority score must be between 0 and 10'],
      default: 0
    },
    need: {
      type: Number,
      min: [0, 'Need score must be between 0 and 10'],
      max: [10, 'Need score must be between 0 and 10'],
      default: 0
    },
    timeline: {
      type: Number,
      min: [0, 'Timeline score must be between 0 and 10'],
      max: [10, 'Timeline score must be between 0 and 10'],
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Priority derived from BANT + Engagement
  priority: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'cold'
  },

  // Engagement Tracking
  engagement: {
    emailOpens: {
      type: Number,
      default: 0
    },
    linkClicks: {
      type: Number,
      default: 0
    },
    lastContacted: {
      type: Date
    },
    lastEngaged: {
      type: Date
    },
    meetingAttendance: {
      type: Number,
      default: 0
    }
  },

  // Conversion Tracking
  conversion: {
    convertedToOpportunity: {
      type: Boolean,
      default: false
    },
    conversionDate: {
      type: Date
    },
    conversionOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    history: [{
      stage: {
        type: String,
        enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
      },
      date: {
        type: Date,
        default: Date.now
      },
      notes: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Compliance
  compliance: {
    consentGiven: {
      type: Boolean,
      default: false
    },
    consentDate: {
      type: Date
    },
    unsubscribed: {
      type: Boolean,
      default: false
    },
    unsubscribeReason: {
      type: String
    },
    unsubscribeDate: {
      type: Date
    }
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

  // Custom Fields (extensible)
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Notes
  notes: {
    type: String,
    maxLength: [2000, 'Notes cannot exceed 2000 characters']
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for activities (referenced)
leadSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'lead'
});

// Virtual for documents (referenced)
leadSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'lead'
});

// Indexes for performance
leadSchema.index({ email: 1 });
leadSchema.index({ owner: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ pipelineStage: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ 'company.name': 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate overall BANT score and priority
leadSchema.pre('save', function(next) {
  // Calculate overall BANT score (0-100)
  const { budget, authority, need, timeline } = this.bant;
  this.bant.overallScore = Math.round(((budget + authority + need + timeline) / 40) * 100);

  // Calculate priority based on BANT score and engagement
  const engagementScore = this.engagement.emailOpens + this.engagement.linkClicks + this.engagement.meetingAttendance;
  const combinedScore = this.bant.overallScore + (engagementScore * 2); // Weight engagement

  if (combinedScore >= 70) {
    this.priority = 'hot';
  } else if (combinedScore >= 40) {
    this.priority = 'warm';
  } else {
    this.priority = 'cold';
  }

  next();
});

// ✅ الحل: استخدم existing model إذا موجود
module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);