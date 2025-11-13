const mongoose = require('mongoose');

const sprintVelocitySchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team reference is required'],
    index: true,
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    required: [true, 'Sprint reference is required'],
    index: true,
  },
  sprintNumber: Number,
  sprintName: String,
  startDate: Date,
  endDate: Date,

  // Planned Metrics
  plannedStoryPoints: {
    type: Number,
    required: true,
    min: 0,
  },
  plannedCapacity: {
    type: Number, // in hours
    min: 0,
  },

  // Actual Metrics
  completedStoryPoints: {
    type: Number,
    min: 0,
    default: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0,
  },

  // Calculated Metrics
  velocity: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Completed story points',
  },
  capacityUtilization: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    description: 'Percentage of planned capacity used',
  },
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    description: 'Percentage of planned stories completed',
  },

  // Sprint Details
  storiesCompleted: {
    type: Number,
    min: 0,
    default: 0,
  },
  storiesPlanned: {
    type: Number,
    min: 0,
    default: 0,
  },
  storiesCarriedOver: {
    type: Number,
    min: 0,
    default: 0,
  },
  storiesAdded: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Stories added mid-sprint',
  },

  // Team Composition
  teamSize: {
    type: Number,
    min: 0,
  },
  membersOnLeave: {
    type: Number,
    min: 0,
    default: 0,
  },
  newMembers: {
    type: Number,
    min: 0,
    default: 0,
  },

  // External Factors
  holidays: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Number of holiday days in sprint',
  },
  impediments: [
    {
      description: String,
      impact: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      daysLost: Number,
    },
  ],

  // AI Prediction
  aiPrediction: {
    nextSprintVelocity: {
      type: Number,
      min: 0,
    },
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Confidence percentage in prediction',
    },
    factorsConsidered: [String],
    recommendations: [String],
    willMissTarget: {
      type: Boolean,
      default: false,
    },
    reasonsForDelay: [String],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    expectedCompletion: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Expected percentage of sprint completion',
    },
    predictedAt: Date,
  },

  actualCompletion: Date,
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
sprintVelocitySchema.index({ team: 1, createdAt: -1 });
sprintVelocitySchema.index({ sprint: 1 });
sprintVelocitySchema.index({ status: 1 });

// Virtual for velocity per team member
sprintVelocitySchema.virtual('velocityPerMember').get(function () {
  if (!this.teamSize || this.teamSize === 0) return 0;
  return Math.round((this.velocity / this.teamSize) * 10) / 10;
});

// Virtual for focus factor
sprintVelocitySchema.virtual('focusFactor').get(function () {
  if (!this.plannedCapacity || this.plannedCapacity === 0) return 0;
  return Math.round((this.actualHours / this.plannedCapacity) * 100);
});

// Pre-save hook to calculate metrics
sprintVelocitySchema.pre('save', function (next) {
  // Calculate velocity (completed story points)
  this.velocity = this.completedStoryPoints;

  // Calculate capacity utilization
  if (this.plannedCapacity > 0) {
    this.capacityUtilization = Math.round((this.actualHours / this.plannedCapacity) * 100);
  }

  // Calculate completion rate
  if (this.storiesPlanned > 0) {
    this.completionRate = Math.round((this.storiesCompleted / this.storiesPlanned) * 100);
  }

  next();
});

// Static method to get team average velocity
sprintVelocitySchema.statics.getTeamAverageVelocity = async function (teamId, lastNSprints = 5) {
  const velocities = await this.find({
    team: teamId,
    status: 'completed',
  })
    .sort({ createdAt: -1 })
    .limit(lastNSprints)
    .select('velocity');

  if (velocities.length === 0) return 0;

  const sum = velocities.reduce((acc, v) => acc + v.velocity, 0);
  return Math.round(sum / velocities.length);
};

// Static method to get velocity trend
sprintVelocitySchema.statics.getVelocityTrend = async function (teamId, lastNSprints = 5) {
  const velocities = await this.find({
    team: teamId,
    status: 'completed',
  })
    .sort({ createdAt: -1 })
    .limit(lastNSprints)
    .select('velocity createdAt');

  if (velocities.length < 2) return 'stable';

  const firstHalf = velocities.slice(Math.ceil(velocities.length / 2));
  const secondHalf = velocities.slice(0, Math.floor(velocities.length / 2));

  const firstAvg = firstHalf.reduce((acc, v) => acc + v.velocity, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((acc, v) => acc + v.velocity, 0) / secondHalf.length;

  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
};

module.exports = mongoose.model('SprintVelocity', sprintVelocitySchema);
