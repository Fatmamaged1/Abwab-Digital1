const mongoose = require('mongoose');

const userStorySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [5000, 'Description cannot exceed 5000 characters']
  },

  // User Story Format: As a [user], I want [feature], so that [benefit]
  asA: {
    type: String,
    trim: true
  },
  iWant: {
    type: String,
    trim: true
  },
  soThat: {
    type: String,
    trim: true
  },

  // Story Details
  storyNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['story', 'bug', 'task', 'spike', 'epic'],
    default: 'story'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },

  // Estimation
  storyPoints: {
    type: Number,
    min: 0,
    max: 100
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },

  // Status & Workflow
  status: {
    type: String,
    enum: ['backlog', 'ready', 'in_progress', 'in_review', 'testing', 'done', 'blocked'],
    default: 'backlog'
  },
  resolution: {
    type: String,
    enum: ['unresolved', 'completed', 'wont_do', 'duplicate', 'cannot_reproduce'],
    default: 'unresolved'
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sprint & Epic
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  epic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Epic'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Acceptance Criteria
  acceptanceCriteria: [{
    description: {
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

  // Technical Details
  technicalNotes: String,
  testingNotes: String,

  // Dependencies
  dependencies: [{
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserStory'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'relates_to', 'duplicates'],
      required: true
    }
  }],

  // Blockers
  blockers: [{
    description: String,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolution: String
  }],

  // Dates
  startDate: Date,
  dueDate: Date,
  completedDate: Date,

  // Labels & Tags
  labels: [{
    name: String,
    color: String
  }],
  tags: [String],

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Comments & Activity
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
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  }],

  // Activity Log
  activityLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      required: true
    },
    field: String,
    oldValue: String,
    newValue: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Time Tracking
  timeTracking: [{
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

  // Definition of Done
  definitionOfDone: [{
    item: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],

  // Business Value
  businessValue: {
    type: Number,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
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
userStorySchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'userStory'
});

userStorySchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'done') return false;
  return this.dueDate < new Date();
});

userStorySchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate || this.status === 'done') return null;
  const days = Math.ceil((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
});

userStorySchema.virtual('acceptanceCriteriaProgress').get(function() {
  if (!this.acceptanceCriteria || this.acceptanceCriteria.length === 0) return 0;
  const completed = this.acceptanceCriteria.filter(ac => ac.completed).length;
  return ((completed / this.acceptanceCriteria.length) * 100).toFixed(2);
});

userStorySchema.virtual('hasBlockers').get(function() {
  return this.blockers && this.blockers.some(b => !b.resolved);
});

userStorySchema.virtual('totalTimeSpent').get(function() {
  if (!this.timeTracking || this.timeTracking.length === 0) return 0;
  return this.timeTracking.reduce((sum, entry) => sum + entry.hours, 0);
});

// Indexes
userStorySchema.index({ storyNumber: 1 });
userStorySchema.index({ project: 1 });
userStorySchema.index({ sprint: 1 });
userStorySchema.index({ epic: 1 });
userStorySchema.index({ status: 1 });
userStorySchema.index({ assignedTo: 1 });
userStorySchema.index({ priority: 1 });
userStorySchema.index({ type: 1 });
userStorySchema.index({ createdAt: -1 });

// Text index for search
userStorySchema.index({
  title: 'text',
  description: 'text',
  technicalNotes: 'text'
});

// Pre-save middleware
userStorySchema.pre('save', function(next) {
  // Update completed date when status changes to done
  if (this.isModified('status') && this.status === 'done' && !this.completedDate) {
    this.completedDate = new Date();
    this.resolution = 'completed';
  }

  // Calculate actual hours from time tracking
  if (this.timeTracking && this.timeTracking.length > 0) {
    this.actualHours = this.timeTracking.reduce((sum, entry) => sum + entry.hours, 0);
  }

  next();
});

// Instance methods
userStorySchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    user: userId,
    text
  });

  this.activityLog.push({
    user: userId,
    action: 'commented',
    timestamp: new Date()
  });

  await this.save();
};

userStorySchema.methods.logActivity = async function(userId, action, field, oldValue, newValue) {
  this.activityLog.push({
    user: userId,
    action,
    field,
    oldValue,
    newValue,
    timestamp: new Date()
  });

  await this.save();
};

userStorySchema.methods.addBlocker = async function(userId, description) {
  this.blockers.push({
    description,
    raisedBy: userId,
    raisedAt: new Date()
  });

  this.status = 'blocked';
  await this.save();
};

userStorySchema.methods.resolveBlocker = async function(blockerId, userId, resolution) {
  const blocker = this.blockers.id(blockerId);
  if (blocker) {
    blocker.resolved = true;
    blocker.resolvedBy = userId;
    blocker.resolvedAt = new Date();
    blocker.resolution = resolution;

    // Check if there are any other unresolved blockers
    const hasUnresolvedBlockers = this.blockers.some(b => !b.resolved);
    if (!hasUnresolvedBlockers && this.status === 'blocked') {
      this.status = 'in_progress';
    }

    await this.save();
  }
};

// Static methods
userStorySchema.statics.getBacklog = function(projectId) {
  return this.find({
    project: projectId,
    sprint: null,
    status: 'backlog',
    isDeleted: false
  })
    .populate('assignedTo', 'firstName lastName email')
    .populate('reporter', 'firstName lastName email')
    .sort({ priority: -1, createdAt: -1 });
};

userStorySchema.statics.getSprintStories = function(sprintId) {
  return this.find({
    sprint: sprintId,
    isDeleted: false
  })
    .populate('assignedTo', 'firstName lastName email')
    .populate('reporter', 'firstName lastName email')
    .sort({ priority: -1, status: 1 });
};

userStorySchema.statics.generateStoryNumber = async function(projectId) {
  const project = await mongoose.model('Project').findById(projectId);
  const prefix = project?.code || 'STORY';

  const lastStory = await this.findOne({ project: projectId })
    .sort({ createdAt: -1 });

  let number = 1;
  if (lastStory && lastStory.storyNumber) {
    const match = lastStory.storyNumber.match(/\d+$/);
    if (match) {
      number = parseInt(match[0]) + 1;
    }
  }

  return `${prefix}-${number}`;
};

module.exports = mongoose.models.UserStory || mongoose.model('UserStory', userStorySchema);
