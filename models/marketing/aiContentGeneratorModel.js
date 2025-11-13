const mongoose = require('mongoose');

const aiContentGeneratorSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    // Auto-generated: AICG2025000001
  },
  type: {
    type: String,
    enum: ['post', 'caption', 'article', 'email', 'ad-copy', 'blog', 'story', 'script'],
    required: [true, 'Content type is required'],
    index: true,
  },
  language: {
    type: String,
    enum: ['ar', 'en', 'both'],
    required: [true, 'Language is required'],
    default: 'both',
  },
  tone: {
    type: String,
    enum: ['professional', 'casual', 'friendly', 'formal', 'creative', 'persuasive', 'humorous', 'inspirational'],
    required: [true, 'Tone is required'],
    default: 'professional',
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
  },
  keywords: [
    {
      type: String,
      trim: true,
    },
  ],
  targetAudience: {
    type: String,
    description: 'Description of target audience',
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'youtube', 'website', 'email', 'other'],
  },
  maxLength: {
    type: Number,
    min: 10,
    description: 'Maximum length in characters',
  },
  // Additional Context
  context: {
    brandVoice: String,
    productService: String,
    callToAction: String,
    includeEmojis: {
      type: Boolean,
      default: true,
    },
    includeHashtags: {
      type: Boolean,
      default: true,
    },
    numberOfVariations: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
  },
  // Generated Content
  generatedContent: {
    ar: {
      type: String,
      description: 'Arabic content',
    },
    en: {
      type: String,
      description: 'English content',
    },
    variations: [
      {
        ar: String,
        en: String,
        score: {
          type: Number,
          min: 0,
          max: 100,
          description: 'AI confidence score',
        },
      },
    ],
    hashtags: {
      ar: [String],
      en: [String],
    },
    suggestedTimes: [
      {
        day: String,
        time: String,
        reasoning: String,
      },
    ],
    metadata: {
      estimatedEngagement: Number,
      suggestedMedia: [String],
      trendingTopics: [String],
    },
  },
  // AI Model Info
  aiModel: {
    name: {
      type: String,
      default: 'gemini-flash-latest',
    },
    version: String,
    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
    tokensUsed: Number,
  },
  // Usage Tracking
  usedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  usedInCampaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingCampaign',
  },
  usedInCalendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentCalendar',
  },
  // Quality & Feedback
  approved: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  published: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    description: 'User rating of generated content',
  },
  feedback: {
    type: String,
    description: 'User feedback on quality',
  },
  selectedVariation: {
    type: Number,
    description: 'Index of variation selected by user',
  },
  edited: {
    type: Boolean,
    default: false,
    description: 'Whether user edited the generated content',
  },
  editedContent: {
    ar: String,
    en: String,
  },
  // Performance (if published)
  performance: {
    impressions: Number,
    engagement: Number,
    clicks: Number,
    conversions: Number,
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  // Cost Tracking
  cost: {
    apiCalls: {
      type: Number,
      default: 1,
    },
    estimatedCost: {
      type: Number,
      description: 'Estimated cost in SAR',
    },
  },
  // Generation Status
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'cancelled'],
    default: 'generating',
    index: true,
  },
  error: {
    message: String,
    code: String,
    timestamp: Date,
  },
  // Metadata
  tags: [String],
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

// Auto-generate request ID
aiContentGeneratorSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      requestId: new RegExp(`^AICG${year}`),
    });
    this.requestId = `AICG${year}${String(count + 1).padStart(6, '0')}`;
  }

  next();
});

// Indexes
aiContentGeneratorSchema.index({ requestId: 1 });
aiContentGeneratorSchema.index({ usedByUser: 1, createdAt: -1 });
aiContentGeneratorSchema.index({ type: 1, language: 1 });
aiContentGeneratorSchema.index({ status: 1 });
aiContentGeneratorSchema.index({ approved: 1, published: 1 });
aiContentGeneratorSchema.index({ rating: 1 });
aiContentGeneratorSchema.index({ tags: 1 });

// Virtual for best variation
aiContentGeneratorSchema.virtual('bestVariation').get(function () {
  if (!this.generatedContent.variations || this.generatedContent.variations.length === 0) {
    return null;
  }

  return this.generatedContent.variations.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });
});

// Virtual for average variation score
aiContentGeneratorSchema.virtual('averageVariationScore').get(function () {
  if (!this.generatedContent.variations || this.generatedContent.variations.length === 0) {
    return 0;
  }

  const total = this.generatedContent.variations.reduce((sum, v) => sum + v.score, 0);
  return Math.round(total / this.generatedContent.variations.length);
});

// Virtual for estimated ROI (if performance data available)
aiContentGeneratorSchema.virtual('estimatedROI').get(function () {
  if (!this.performance || !this.cost.estimatedCost || this.cost.estimatedCost === 0) {
    return null;
  }

  // Simple ROI calculation based on performance
  const valuePerConversion = 100; // Assumed value in SAR
  const revenue = (this.performance.conversions || 0) * valuePerConversion;
  const cost = this.cost.estimatedCost;

  if (cost === 0) return null;
  return Math.round(((revenue - cost) / cost) * 100);
});

// Method to mark as approved
aiContentGeneratorSchema.methods.approveContent = function (userId, variationIndex = null) {
  this.approved = true;
  this.approvedBy = userId;
  this.approvedAt = new Date();
  if (variationIndex !== null) {
    this.selectedVariation = variationIndex;
  }
};

// Method to update performance metrics
aiContentGeneratorSchema.methods.updatePerformance = function (metrics) {
  this.performance = {
    ...this.performance,
    ...metrics,
  };

  // Calculate performance score (0-100)
  // Simple formula: weighted average of engagement rate and conversion rate
  if (metrics.impressions > 0) {
    const engagementRate = ((metrics.engagement || 0) / metrics.impressions) * 100;
    const conversionRate = ((metrics.conversions || 0) / metrics.impressions) * 100;

    this.performance.performanceScore = Math.round(
      engagementRate * 0.6 + conversionRate * 0.4
    );
  }
};

// Static method to get generation statistics
aiContentGeneratorSchema.statics.getGenerationStatistics = async function (filters = {}, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const requests = await this.find({
    ...filters,
    createdAt: { $gte: startDate },
  });

  return {
    totalRequests: requests.length,
    completed: requests.filter((r) => r.status === 'completed').length,
    failed: requests.filter((r) => r.status === 'failed').length,
    approved: requests.filter((r) => r.approved).length,
    published: requests.filter((r) => r.published).length,
    averageRating: this.calculateAverageRating(requests),
    byType: this.groupByType(requests),
    byLanguage: this.groupByLanguage(requests),
    byTone: this.groupByTone(requests),
    totalCost: requests.reduce((sum, r) => sum + (r.cost?.estimatedCost || 0), 0),
  };
};

// Helper methods
aiContentGeneratorSchema.statics.calculateAverageRating = function (requests) {
  const rated = requests.filter((r) => r.rating);
  if (rated.length === 0) return 0;

  const total = rated.reduce((sum, r) => sum + r.rating, 0);
  return parseFloat((total / rated.length).toFixed(1));
};

aiContentGeneratorSchema.statics.groupByType = function (requests) {
  return requests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {});
};

aiContentGeneratorSchema.statics.groupByLanguage = function (requests) {
  return requests.reduce((acc, req) => {
    acc[req.language] = (acc[req.language] || 0) + 1;
    return acc;
  }, {});
};

aiContentGeneratorSchema.statics.groupByTone = function (requests) {
  return requests.reduce((acc, req) => {
    acc[req.tone] = (acc[req.tone] || 0) + 1;
    return acc;
  }, {});
};

// Static method to get top performing content
aiContentGeneratorSchema.statics.getTopPerformingContent = async function (limit = 10) {
  return this.find({
    published: true,
    'performance.performanceScore': { $exists: true },
  })
    .sort({ 'performance.performanceScore': -1 })
    .limit(limit)
    .populate('usedByUser', 'name email')
    .populate('usedInCampaign', 'name');
};

module.exports = mongoose.model('AIContentGenerator', aiContentGeneratorSchema);
