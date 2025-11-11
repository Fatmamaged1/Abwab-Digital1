const mongoose = require('mongoose');

const epicSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Epic name is required'],
    trim: true,
    maxLength: [200, 'Epic name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [5000, 'Description cannot exceed 5000 characters']
  },
  epicNumber: {
    type: String,
    required: true,
    unique: true
  },

  // Epic Details
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'planned'
  },

  // Timeline
  startDate: Date,
  targetDate: Date,
  completedDate: Date,

  // Progress
  progress: {
    totalStories: {
      type: Number,
      default: 0
    },
    completedStories: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    completedPoints: {
      type: Number,
      default: 0
    }
  },

  // Business Value
  businessValue: {
    type: Number,
    min: 0,
    max: 100
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },

  // Objectives & Key Results
  objectives: [{
    objective: {
      type: String,
      required: true
    },
    keyResults: [{
      result: String,
      target: String,
      actual: String,
      achieved: {
        type: Boolean,
        default: false
      }
    }]
  }],

  // Tags & Labels
  tags: [String],
  labels: [{
    name: String,
    color: String
  }],

  // Stakeholders
  stakeholders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],

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
  isDeleted: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
epicSchema.virtual('userStories', {
  ref: 'UserStory',
  localField: '_id',
  foreignField: 'epic'
});

epicSchema.virtual('completionRate').get(function() {
  if (this.progress.totalStories === 0) return 0;
  return ((this.progress.completedStories / this.progress.totalStories) * 100).toFixed(2);
});

epicSchema.virtual('isOverdue').get(function() {
  if (!this.targetDate || this.status === 'completed') return false;
  return this.targetDate < new Date();
});

// Indexes
epicSchema.index({ project: 1 });
epicSchema.index({ owner: 1 });
epicSchema.index({ status: 1 });
epicSchema.index({ epicNumber: 1 });

module.exports = mongoose.models.Epic || mongoose.model('Epic', epicSchema);
