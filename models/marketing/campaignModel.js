const mongoose = require('mongoose');

const marketingCampaignSchema = new mongoose.Schema({
  campaignNumber: {
    type: String,
    unique: true,
    // Auto-generated: CAMP2025000001
  },
  name: {
    ar: {
      type: String,
      required: [true, 'Arabic campaign name is required'],
      trim: true,
    },
    en: {
      type: String,
      required: [true, 'English campaign name is required'],
      trim: true,
    },
  },
  description: {
    ar: String,
    en: String,
  },
  type: {
    type: String,
    enum: ['awareness', 'lead-generation', 'conversion', 'retention', 'brand', 'product-launch', 'seasonal', 'event'],
    required: [true, 'Campaign type is required'],
    index: true,
  },
  status: {
    type: String,
    enum: ['planning', 'pending-approval', 'approved', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planning',
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  // Budget Management
  budget: {
    total: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    allocated: {
      type: Map,
      of: Number,
      description: 'Budget allocated per channel',
    },
    spent: {
      type: Number,
      min: 0,
      default: 0,
    },
    remaining: {
      type: Number,
      min: 0,
    },
  },
  // Marketing Channels
  channels: [
    {
      type: {
        type: String,
        enum: [
          'social-media',
          'google-ads',
          'facebook-ads',
          'instagram-ads',
          'linkedin-ads',
          'twitter-ads',
          'snapchat-ads',
          'tiktok-ads',
          'youtube-ads',
          'email',
          'seo',
          'content-marketing',
          'influencer',
          'events',
          'print-media',
          'radio',
          'tv',
          'outdoor',
          'other'
        ],
        required: true,
      },
      platform: String,
      budget: {
        type: Number,
        min: 0,
      },
      spent: {
        type: Number,
        min: 0,
        default: 0,
      },
      metrics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        leads: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 }, // Click-through rate
        cpc: { type: Number, default: 0 }, // Cost per click
        cpa: { type: Number, default: 0 }, // Cost per acquisition
        engagement: { type: Number, default: 0 },
      },
      status: {
        type: String,
        enum: ['planned', 'active', 'paused', 'completed'],
        default: 'planned',
      },
    },
  ],
  // Target Audience
  targetAudience: {
    demographics: {
      ageRange: {
        min: Number,
        max: Number,
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female'],
        default: 'all',
      },
      income: String,
      education: String,
    },
    interests: [String],
    location: [String],
    language: {
      type: [String],
      default: ['ar', 'en'],
    },
    customSegments: [String],
  },
  // Campaign Objectives
  objectives: [
    {
      metric: {
        type: String,
        required: true,
        description: 'e.g., leads, sales, traffic, engagement',
      },
      target: {
        type: Number,
        required: true,
      },
      achieved: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        description: 'e.g., count, percentage, SAR',
      },
    },
  ],
  // Content for Campaign
  content: [
    {
      contentId: String,
      type: {
        type: String,
        enum: ['post', 'ad', 'video', 'article', 'email', 'landing-page', 'banner', 'story', 'reel'],
        required: true,
      },
      title: String,
      body: String,
      media: [
        {
          type: {
            type: String,
            enum: ['image', 'video', 'gif', 'document'],
          },
          url: String,
          filename: String,
        },
      ],
      status: {
        type: String,
        enum: ['draft', 'pending-approval', 'approved', 'published', 'archived'],
        default: 'draft',
      },
      scheduledFor: Date,
      publishedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      aiGenerated: {
        type: Boolean,
        default: false,
      },
      performance: {
        impressions: Number,
        likes: Number,
        comments: Number,
        shares: Number,
        clicks: Number,
        engagement: Number,
      },
    },
  ],
  // Approval Workflow
  approvalWorkflow: [
    {
      step: {
        type: Number,
        required: true,
      },
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      comments: String,
      timestamp: Date,
    },
  ],
  // Performance Metrics
  performance: {
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    leads: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      description: 'Revenue generated (SAR)',
    },
    roi: {
      type: Number,
      default: 0,
      description: 'Return on investment percentage',
    },
    ctr: {
      type: Number,
      default: 0,
      description: 'Overall click-through rate',
    },
    cpc: {
      type: Number,
      default: 0,
      description: 'Average cost per click',
    },
    cpa: {
      type: Number,
      default: 0,
      description: 'Average cost per acquisition',
    },
    engagement: {
      type: Number,
      default: 0,
      description: 'Total engagement score',
    },
  },
  // AI Insights
  aiInsights: {
    performancePrediction: String,
    optimizationSuggestions: [String],
    audienceInsights: String,
    competitorAnalysis: String,
    trendingTopics: [String],
    recommendedContent: [String],
    budgetOptimization: {
      recommendations: [
        {
          channel: String,
          currentBudget: Number,
          recommendedBudget: Number,
          reasoning: String,
        },
      ],
    },
    bestPostingTimes: [String],
    analyzedAt: Date,
  },
  // Related Items
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
  },
  leads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
  ],
  // Team
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  team: [
    {
      member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: String,
    },
  ],
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Tags
  tags: [String],
  // Metadata
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

// Auto-generate campaign number
marketingCampaignSchema.pre('save', async function (next) {
  if (!this.campaignNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      campaignNumber: new RegExp(`^CAMP${year}`),
    });
    this.campaignNumber = `CAMP${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate budget remaining
  this.budget.remaining = this.budget.total - this.budget.spent;

  // Calculate ROI
  if (this.budget.spent > 0 && this.performance.revenue > 0) {
    this.performance.roi = Math.round(((this.performance.revenue - this.budget.spent) / this.budget.spent) * 100);
  }

  // Calculate overall CTR
  if (this.performance.impressions > 0) {
    this.performance.ctr = ((this.performance.clicks / this.performance.impressions) * 100).toFixed(2);
  }

  // Calculate overall CPC
  if (this.performance.clicks > 0) {
    this.performance.cpc = (this.budget.spent / this.performance.clicks).toFixed(2);
  }

  // Calculate overall CPA
  if (this.performance.conversions > 0) {
    this.performance.cpa = (this.budget.spent / this.performance.conversions).toFixed(2);
  }

  next();
});

// Indexes
marketingCampaignSchema.index({ campaignNumber: 1 });
marketingCampaignSchema.index({ status: 1, startDate: -1 });
marketingCampaignSchema.index({ type: 1, status: 1 });
marketingCampaignSchema.index({ manager: 1, createdAt: -1 });
marketingCampaignSchema.index({ client: 1 });
marketingCampaignSchema.index({ tags: 1 });
marketingCampaignSchema.index({ 'name.en': 'text', 'name.ar': 'text', 'description.en': 'text', 'description.ar': 'text' });

// Virtual for campaign duration
marketingCampaignSchema.virtual('duration').get(function () {
  const diff = this.endDate - this.startDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)); // in days
});

// Virtual for budget utilization percentage
marketingCampaignSchema.virtual('budgetUtilization').get(function () {
  if (!this.budget.total || this.budget.total === 0) return 0;
  return Math.round((this.budget.spent / this.budget.total) * 100);
});

// Virtual for objectives completion percentage
marketingCampaignSchema.virtual('objectivesCompletion').get(function () {
  if (!this.objectives || this.objectives.length === 0) return 0;

  const totalCompletion = this.objectives.reduce((sum, obj) => {
    const completion = obj.target > 0 ? (obj.achieved / obj.target) * 100 : 0;
    return sum + Math.min(completion, 100);
  }, 0);

  return Math.round(totalCompletion / this.objectives.length);
});

// Virtual for campaign status based on dates
marketingCampaignSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

// Method to approve campaign
marketingCampaignSchema.methods.approve = function (approverId, step) {
  const workflow = this.approvalWorkflow.find((w) => w.step === step);
  if (workflow) {
    workflow.status = 'approved';
    workflow.timestamp = new Date();

    // Check if all steps are approved
    const allApproved = this.approvalWorkflow.every((w) => w.status === 'approved');
    if (allApproved) {
      this.status = 'approved';
    }
  }
};

// Method to calculate channel ROI
marketingCampaignSchema.methods.getChannelROI = function (channelType) {
  const channel = this.channels.find((c) => c.type === channelType);
  if (!channel || !channel.spent || channel.spent === 0) return 0;

  // Estimate revenue contribution based on conversions
  const channelRevenue = (channel.metrics.conversions / this.performance.conversions) * this.performance.revenue;
  return Math.round(((channelRevenue - channel.spent) / channel.spent) * 100);
};

// Static method to get campaign statistics
marketingCampaignSchema.statics.getCampaignStatistics = async function (filters = {}, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const campaigns = await this.find({
    ...filters,
    startDate: { $gte: startDate },
  });

  return {
    total: campaigns.length,
    active: campaigns.filter((c) => c.isActive).length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget.spent, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + c.performance.revenue, 0),
    totalLeads: campaigns.reduce((sum, c) => sum + c.performance.leads, 0),
    averageROI: this.calculateAverageROI(campaigns),
    byType: this.groupByType(campaigns),
  };
};

// Helper methods
marketingCampaignSchema.statics.calculateAverageROI = function (campaigns) {
  const campaignsWithROI = campaigns.filter((c) => c.performance.roi !== 0);
  if (campaignsWithROI.length === 0) return 0;

  const totalROI = campaignsWithROI.reduce((sum, c) => sum + c.performance.roi, 0);
  return Math.round(totalROI / campaignsWithROI.length);
};

marketingCampaignSchema.statics.groupByType = function (campaigns) {
  return campaigns.reduce((acc, campaign) => {
    acc[campaign.type] = (acc[campaign.type] || 0) + 1;
    return acc;
  }, {});
};

module.exports = mongoose.model('MarketingCampaign', marketingCampaignSchema);
