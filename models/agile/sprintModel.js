const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true,
    maxLength: [100, 'Sprint name cannot exceed 100 characters']
  },
  goal: {
    type: String,
    required: [true, 'Sprint goal is required'],
    trim: true,
    maxLength: [500, 'Sprint goal cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Sprint Details
  sprintNumber: {
    type: Number,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Timeline
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    type: Number, // in days
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },

  // Team
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['product_owner', 'scrum_master', 'developer', 'designer', 'qa', 'ba'],
      required: true
    },
    capacity: {
      type: Number, // hours per day
      default: 6
    }
  }],

  // Capacity Planning
  capacity: {
    totalHours: {
      type: Number,
      default: 0
    },
    availableHours: {
      type: Number,
      default: 0
    },
    committedHours: {
      type: Number,
      default: 0
    },
    remainingHours: {
      type: Number,
      default: 0
    }
  },

  // Story Points
  storyPoints: {
    committed: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 0
    }
  },

  // Velocity
  velocity: {
    planned: {
      type: Number,
      default: 0
    },
    actual: {
      type: Number,
      default: 0
    }
  },

  // Sprint Metrics
  metrics: {
    totalStories: {
      type: Number,
      default: 0
    },
    completedStories: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    bugs: {
      total: {
        type: Number,
        default: 0
      },
      resolved: {
        type: Number,
        default: 0
      }
    },
    blockers: {
      type: Number,
      default: 0
    }
  },

  // Burndown Data
  burndown: [{
    date: {
      type: Date,
      required: true
    },
    remainingPoints: {
      type: Number,
      required: true
    },
    idealPoints: {
      type: Number,
      required: true
    },
    completedPoints: {
      type: Number,
      default: 0
    }
  }],

  // Daily Standups
  standups: [{
    date: {
      type: Date,
      required: true
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    notes: String,
    blockers: [String],
    achievements: [String]
  }],

  // Sprint Reviews
  review: {
    date: Date,
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    demoCompleted: {
      type: Boolean,
      default: false
    },
    stakeholderFeedback: String,
    successMetrics: [{
      metric: String,
      target: String,
      actual: String,
      achieved: Boolean
    }]
  },

  // Sprint Retrospective
  retrospective: {
    date: Date,
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    whatWentWell: [String],
    whatDidntGoWell: [String],
    actionItems: [{
      item: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['open', 'in_progress', 'completed'],
        default: 'open'
      }
    }]
  },

  // Tags & Labels
  tags: [String],
  labels: [{
    name: String,
    color: String
  }],

  // Notes
  notes: String,

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
sprintSchema.virtual('userStories', {
  ref: 'UserStory',
  localField: '_id',
  foreignField: 'sprint'
});

sprintSchema.virtual('progress').get(function() {
  if (this.storyPoints.committed === 0) return 0;
  return ((this.storyPoints.completed / this.storyPoints.committed) * 100).toFixed(2);
});

sprintSchema.virtual('daysElapsed').get(function() {
  if (this.status !== 'active') return 0;
  const elapsed = Math.floor((Date.now() - this.startDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, elapsed);
});

sprintSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return 0;
  const remaining = Math.floor((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
});

sprintSchema.virtual('completionRate').get(function() {
  if (this.metrics.totalStories === 0) return 0;
  return ((this.metrics.completedStories / this.metrics.totalStories) * 100).toFixed(2);
});

// Indexes
sprintSchema.index({ project: 1, sprintNumber: 1 });
sprintSchema.index({ status: 1 });
sprintSchema.index({ startDate: 1, endDate: 1 });
sprintSchema.index({ 'team.user': 1 });
sprintSchema.index({ createdAt: -1 });

// Pre-save middleware
sprintSchema.pre('save', function(next) {
  // Calculate duration if not set
  if (!this.duration && this.startDate && this.endDate) {
    this.duration = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate total capacity
  if (this.team && this.team.length > 0) {
    this.capacity.totalHours = this.team.reduce((sum, member) => {
      return sum + (member.capacity * this.duration);
    }, 0);
  }

  // Calculate remaining capacity
  this.capacity.remainingHours = this.capacity.totalHours - this.capacity.committedHours;

  // Calculate remaining story points
  this.storyPoints.remaining = this.storyPoints.committed - this.storyPoints.completed;

  // Calculate actual velocity
  if (this.status === 'completed') {
    this.velocity.actual = this.storyPoints.completed;
  }

  next();
});

// Instance methods
sprintSchema.methods.addBurndownEntry = async function(remainingPoints, completedPoints) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate ideal points
  const totalDays = this.duration;
  const daysPassed = Math.floor((today - this.startDate) / (1000 * 60 * 60 * 24));
  const idealPoints = this.storyPoints.committed - ((this.storyPoints.committed / totalDays) * daysPassed);

  this.burndown.push({
    date: today,
    remainingPoints,
    idealPoints: Math.max(0, idealPoints),
    completedPoints
  });

  await this.save();
};

sprintSchema.methods.startSprint = async function() {
  this.status = 'active';
  this.startDate = new Date();
  await this.save();
};

sprintSchema.methods.completeSprint = async function() {
  this.status = 'completed';
  this.velocity.actual = this.storyPoints.completed;
  await this.save();
};

// Static methods
sprintSchema.statics.getActiveSprints = function(projectId) {
  return this.find({
    project: projectId,
    status: 'active',
    isDeleted: false
  }).populate('team.user', 'firstName lastName email');
};

sprintSchema.statics.getTeamVelocity = async function(projectId, numberOfSprints = 3) {
  const sprints = await this.find({
    project: projectId,
    status: 'completed',
    isDeleted: false
  })
    .sort({ endDate: -1 })
    .limit(numberOfSprints);

  if (sprints.length === 0) return 0;

  const totalVelocity = sprints.reduce((sum, sprint) => sum + sprint.velocity.actual, 0);
  return (totalVelocity / sprints.length).toFixed(2);
};

module.exports = mongoose.models.Sprint || mongoose.model('Sprint', sprintSchema);
