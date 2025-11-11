const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true,
    maxLength: [200, 'Milestone name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Milestone Details
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Timeline
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completedDate: Date,

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending'
  },

  // Progress
  progress: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    }
  },

  // Associated Items
  epics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Epic'
  }],
  userStories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserStory'
  }],

  // Deliverables
  deliverables: [{
    name: String,
    description: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  }],

  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Tags
  tags: [String],

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
milestoneSchema.virtual('progressPercentage').get(function() {
  if (this.progress.totalTasks === 0) return 0;
  return ((this.progress.completedTasks / this.progress.totalTasks) * 100).toFixed(2);
});

milestoneSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return this.dueDate < new Date();
});

milestoneSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const days = Math.ceil((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Indexes
milestoneSchema.index({ project: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ dueDate: 1 });

// Pre-save middleware
milestoneSchema.pre('save', function(next) {
  // Auto-update status based on date
  if (this.status !== 'completed' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }

  next();
});

module.exports = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
