const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxLength: [200, 'Project name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxLength: [10, 'Project code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Project code must contain only uppercase letters and numbers']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [5000, 'Description cannot exceed 5000 characters']
  },

  // Project Type
  type: {
    type: String,
    enum: ['scrum', 'kanban', 'waterfall', 'hybrid'],
    default: 'scrum'
  },

  // Project Details
  category: {
    type: String,
    enum: ['software', 'web', 'mobile', 'design', 'marketing', 'other']
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'team'],
    default: 'team'
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
    default: 'planning'
  },

  // Timeline
  startDate: Date,
  targetDate: Date,
  completedDate: Date,

  // Team Structure
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['product_owner', 'scrum_master', 'tech_lead', 'developer', 'designer', 'qa', 'ba', 'stakeholder'],
      required: true
    },
    permissions: {
      canCreateStories: {
        type: Boolean,
        default: true
      },
      canEditStories: {
        type: Boolean,
        default: true
      },
      canDeleteStories: {
        type: Boolean,
        default: false
      },
      canManageSprints: {
        type: Boolean,
        default: false
      },
      canManageTeam: {
        type: Boolean,
        default: false
      },
      isAdmin: {
        type: Boolean,
        default: false
      }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Sprint Configuration
  sprintConfig: {
    defaultDuration: {
      type: Number,
      default: 14 // days
    },
    daysPerWeek: {
      type: Number,
      default: 5
    },
    hoursPerDay: {
      type: Number,
      default: 6
    },
    autoCreateSprints: {
      type: Boolean,
      default: false
    }
  },

  // Story Point Configuration
  storyPointScale: {
    type: [Number],
    default: [1, 2, 3, 5, 8, 13, 21] // Fibonacci
  },

  // Workflow & Status
  workflow: {
    states: [{
      name: {
        type: String,
        required: true
      },
      category: {
        type: String,
        enum: ['todo', 'in_progress', 'done'],
        required: true
      },
      color: String,
      order: Number
    }],
    transitions: [{
      from: String,
      to: String,
      name: String,
      rules: [String]
    }]
  },

  // Issue Types Configuration
  issueTypes: [{
    name: {
      type: String,
      required: true
    },
    icon: String,
    color: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Priority Configuration
  priorities: [{
    name: {
      type: String,
      required: true
    },
    level: Number,
    color: String,
    icon: String
  }],

  // Custom Fields
  customFields: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'multiselect', 'user', 'checkbox'],
      required: true
    },
    options: [String],
    required: {
      type: Boolean,
      default: false
    }
  }],

  // Metrics & Statistics
  metrics: {
    totalSprints: {
      type: Number,
      default: 0
    },
    completedSprints: {
      type: Number,
      default: 0
    },
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
    },
    averageVelocity: {
      type: Number,
      default: 0
    },
    teamSize: {
      type: Number,
      default: 0
    }
  },

  // Budget & Resources
  budget: {
    allocated: Number,
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Integration Settings
  integrations: {
    github: {
      enabled: {
        type: Boolean,
        default: false
      },
      repoUrl: String
    },
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    },
    jira: {
      enabled: {
        type: Boolean,
        default: false
      },
      projectKey: String
    }
  },

  // Automation Rules
  automationRules: [{
    name: String,
    trigger: String,
    conditions: [{
      field: String,
      operator: String,
      value: String
    }],
    actions: [{
      type: String,
      params: mongoose.Schema.Types.Mixed
    }],
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Notification Settings
  notifications: {
    emailEnabled: {
      type: Boolean,
      default: true
    },
    slackEnabled: {
      type: Boolean,
      default: false
    },
    events: [{
      event: String,
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },

  // Tags & Labels
  tags: [String],
  labels: [{
    name: String,
    color: String,
    description: String
  }],

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

  // Archive
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
projectSchema.virtual('sprints', {
  ref: 'Sprint',
  localField: '_id',
  foreignField: 'project'
});

projectSchema.virtual('userStories', {
  ref: 'UserStory',
  localField: '_id',
  foreignField: 'project'
});

projectSchema.virtual('epics', {
  ref: 'Epic',
  localField: '_id',
  foreignField: 'project'
});

projectSchema.virtual('milestones', {
  ref: 'Milestone',
  localField: '_id',
  foreignField: 'project'
});

projectSchema.virtual('progress').get(function() {
  if (this.metrics.totalStories === 0) return 0;
  return ((this.metrics.completedStories / this.metrics.totalStories) * 100).toFixed(2);
});

projectSchema.virtual('isOverdue').get(function() {
  if (!this.targetDate || this.status === 'completed') return false;
  return this.targetDate < new Date();
});

projectSchema.virtual('daysRemaining').get(function() {
  if (!this.targetDate || this.status === 'completed') return null;
  return Math.ceil((this.targetDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Indexes
projectSchema.index({ code: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ lead: 1 });
projectSchema.index({ 'team.user': 1 });
projectSchema.index({ createdAt: -1 });

// Text index for search
projectSchema.index({
  name: 'text',
  description: 'text',
  code: 'text'
});

// Pre-save middleware
projectSchema.pre('save', function(next) {
  // Update team size
  this.metrics.teamSize = this.team.length;

  // Set default workflow if not exists
  if (!this.workflow || !this.workflow.states || this.workflow.states.length === 0) {
    this.workflow = {
      states: [
        { name: 'Backlog', category: 'todo', color: '#gray', order: 1 },
        { name: 'Ready', category: 'todo', color: '#blue', order: 2 },
        { name: 'In Progress', category: 'in_progress', color: '#yellow', order: 3 },
        { name: 'In Review', category: 'in_progress', color: '#purple', order: 4 },
        { name: 'Testing', category: 'in_progress', color: '#orange', order: 5 },
        { name: 'Done', category: 'done', color: '#green', order: 6 }
      ],
      transitions: [
        { from: 'Backlog', to: 'Ready', name: 'Mark Ready' },
        { from: 'Ready', to: 'In Progress', name: 'Start Work' },
        { from: 'In Progress', to: 'In Review', name: 'Submit Review' },
        { from: 'In Review', to: 'Testing', name: 'Move to Testing' },
        { from: 'Testing', to: 'Done', name: 'Complete' },
        { from: 'In Progress', to: 'Backlog', name: 'Cancel' }
      ]
    };
  }

  // Set default issue types
  if (!this.issueTypes || this.issueTypes.length === 0) {
    this.issueTypes = [
      { name: 'Story', icon: '📖', color: '#green', enabled: true },
      { name: 'Bug', icon: '🐛', color: '#red', enabled: true },
      { name: 'Task', icon: '✓', color: '#blue', enabled: true },
      { name: 'Epic', icon: '⚡', color: '#purple', enabled: true },
      { name: 'Spike', icon: '🔍', color: '#orange', enabled: true }
    ];
  }

  // Set default priorities
  if (!this.priorities || this.priorities.length === 0) {
    this.priorities = [
      { name: 'Critical', level: 1, color: '#red', icon: '🔴' },
      { name: 'High', level: 2, color: '#orange', icon: '🟠' },
      { name: 'Medium', level: 3, color: '#yellow', icon: '🟡' },
      { name: 'Low', level: 4, color: '#green', icon: '🟢' }
    ];
  }

  next();
});

// Instance methods
projectSchema.methods.addTeamMember = async function(userId, role, permissions) {
  const exists = this.team.some(member => member.user.equals(userId));
  if (!exists) {
    this.team.push({
      user: userId,
      role,
      permissions: permissions || {}
    });
    await this.save();
  }
};

projectSchema.methods.removeTeamMember = async function(userId) {
  this.team = this.team.filter(member => !member.user.equals(userId));
  await this.save();
};

projectSchema.methods.updateMetrics = async function() {
  const Sprint = mongoose.model('Sprint');
  const UserStory = mongoose.model('UserStory');

  // Count sprints
  this.metrics.totalSprints = await Sprint.countDocuments({ project: this._id, isDeleted: false });
  this.metrics.completedSprints = await Sprint.countDocuments({
    project: this._id,
    status: 'completed',
    isDeleted: false
  });

  // Count stories
  const stories = await UserStory.find({ project: this._id, isDeleted: false });
  this.metrics.totalStories = stories.length;
  this.metrics.completedStories = stories.filter(s => s.status === 'done').length;

  // Calculate points
  this.metrics.totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
  this.metrics.completedPoints = stories
    .filter(s => s.status === 'done')
    .reduce((sum, s) => sum + (s.storyPoints || 0), 0);

  // Calculate average velocity
  const completedSprints = await Sprint.find({
    project: this._id,
    status: 'completed',
    isDeleted: false
  })
    .sort({ endDate: -1 })
    .limit(5);

  if (completedSprints.length > 0) {
    const totalVelocity = completedSprints.reduce((sum, sprint) => sum + sprint.velocity.actual, 0);
    this.metrics.averageVelocity = (totalVelocity / completedSprints.length).toFixed(2);
  }

  await this.save();
};

// Static methods
projectSchema.statics.getUserProjects = function(userId) {
  return this.find({
    $or: [
      { lead: userId },
      { 'team.user': userId },
      { createdBy: userId }
    ],
    isDeleted: false
  })
    .populate('lead', 'firstName lastName email')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
