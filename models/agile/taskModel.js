const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Task Details
  taskNumber: {
    type: String,
    required: true,
    unique: true
  },
  userStory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserStory',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Status & Priority
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Time Estimation
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },

  // Dates
  dueDate: Date,
  startDate: Date,
  completedDate: Date,

  // Time Tracking
  timeLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    hours: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String
  }],

  // Checklist
  checklist: [{
    item: {
      type: String,
      required: true
    },
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

  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Tags
  tags: [String],

  // System Fields
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
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return this.dueDate < new Date();
});

taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter(item => item.completed).length;
  return ((completed / this.checklist.length) * 100).toFixed(2);
});

// Indexes
taskSchema.index({ userStory: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ taskNumber: 1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Calculate actual hours from time log
  if (this.timeLog && this.timeLog.length > 0) {
    this.actualHours = this.timeLog.reduce((sum, entry) => sum + entry.hours, 0);
  }

  // Set completed date
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }

  next();
});

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
