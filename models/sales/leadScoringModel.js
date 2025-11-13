const mongoose = require('mongoose');

const leadScoringSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead reference is required'],
    unique: true,
    index: true,
  },
  scores: {
    demographic: {
      type: Number,
      min: 0,
      max: 25,
      default: 0,
      description: 'Score based on demographics (location, company size, industry)',
    },
    behavioral: {
      type: Number,
      min: 0,
      max: 25,
      default: 0,
      description: 'Score based on behavior (email opens, website visits, downloads)',
    },
    engagement: {
      type: Number,
      min: 0,
      max: 25,
      default: 0,
      description: 'Score based on engagement level (meetings, calls, responses)',
    },
    firmographic: {
      type: Number,
      min: 0,
      max: 25,
      default: 0,
      description: 'Score based on company characteristics (revenue, employees, budget)',
    },
    total: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
    description: 'Letter grade based on total score',
  },
  factors: [
    {
      factor: {
        type: String,
        required: true,
        description: 'Specific scoring factor (e.g., "Decision Maker", "Budget Confirmed")',
      },
      score: {
        type: Number,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
        description: 'Weight/importance of this factor',
      },
      explanation: {
        type: String,
        description: 'Why this score was given',
      },
    },
  ],
  aiPrediction: {
    conversionProbability: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Predicted probability of conversion (%)',
    },
    recommendedActions: [
      {
        type: String,
        description: 'AI-suggested next steps',
      },
    ],
    bestContactTime: {
      type: String,
      description: 'Best time to contact this lead',
    },
    estimatedDealValue: {
      type: Number,
      min: 0,
      description: 'Predicted deal value in SAR',
    },
    timeToConversion: {
      type: Number,
      min: 0,
      description: 'Estimated days until conversion',
    },
    contactChannel: {
      type: String,
      enum: ['email', 'phone', 'linkedin', 'whatsapp', 'meeting'],
      description: 'Recommended contact channel',
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      description: 'Urgency to follow up',
    },
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastRecalculatedAt: Date,
  // Tracking changes
  scoreHistory: [
    {
      date: Date,
      totalScore: Number,
      grade: String,
      change: Number, // + or -
    },
  ],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Calculate total score and grade before saving
leadScoringSchema.pre('save', function (next) {
  // Calculate total score
  this.scores.total =
    this.scores.demographic +
    this.scores.behavioral +
    this.scores.engagement +
    this.scores.firmographic;

  // Assign grade
  const score = this.scores.total;
  if (score >= 90) this.grade = 'A+';
  else if (score >= 80) this.grade = 'A';
  else if (score >= 70) this.grade = 'B';
  else if (score >= 60) this.grade = 'C';
  else if (score >= 50) this.grade = 'D';
  else this.grade = 'F';

  // Add to history
  if (this.isModified('scores')) {
    const previousScore = this.scoreHistory.length > 0
      ? this.scoreHistory[this.scoreHistory.length - 1].totalScore
      : 0;

    this.scoreHistory.push({
      date: new Date(),
      totalScore: this.scores.total,
      grade: this.grade,
      change: this.scores.total - previousScore,
    });

    this.lastRecalculatedAt = new Date();
  }

  next();
});

// Indexes
leadScoringSchema.index({ lead: 1 });
leadScoringSchema.index({ 'scores.total': -1 });
leadScoringSchema.index({ grade: 1 });
leadScoringSchema.index({ calculatedAt: -1 });

// Virtual for score trend
leadScoringSchema.virtual('scoreTrend').get(function () {
  if (this.scoreHistory.length < 2) return 'stable';

  const recent = this.scoreHistory.slice(-5); // Last 5 scores
  const changes = recent.map((h) => h.change);
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;

  if (avgChange > 2) return 'increasing';
  if (avgChange < -2) return 'decreasing';
  return 'stable';
});

// Static method to get high-quality leads
leadScoringSchema.statics.getHighQualityLeads = async function (minScore = 70) {
  return this.find({
    'scores.total': { $gte: minScore },
  })
    .populate('lead')
    .sort({ 'scores.total': -1 });
};

module.exports = mongoose.model('LeadScoring', leadScoringSchema);
