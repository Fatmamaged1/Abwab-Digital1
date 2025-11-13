const mongoose = require('mongoose');

const contentCalendarSchema = new mongoose.Schema({
  calendarId: {
    type: String,
    unique: true,
    // Auto-generated: CAL2025000001
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingCampaign',
    index: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    index: true,
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
    index: true,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    index: true,
  },
  entries: [
    {
      entryId: {
        type: String,
        unique: true,
      },
      date: {
        type: Date,
        required: [true, 'Date is required'],
      },
      time: {
        type: String,
        description: 'Posting time in HH:MM format',
      },
      platform: {
        type: String,
        enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'youtube', 'pinterest', 'threads'],
        required: [true, 'Platform is required'],
      },
      contentType: {
        type: String,
        enum: ['post', 'story', 'reel', 'video', 'carousel', 'article', 'poll', 'live', 'short'],
        required: [true, 'Content type is required'],
      },
      title: {
        ar: String,
        en: String,
      },
      caption: {
        ar: {
          type: String,
          required: [true, 'Arabic caption is required'],
        },
        en: {
          type: String,
          required: [true, 'English caption is required'],
        },
      },
      hashtags: [
        {
          type: String,
          trim: true,
        },
      ],
      media: [
        {
          type: {
            type: String,
            enum: ['image', 'video', 'gif', 'carousel'],
          },
          url: String,
          filename: String,
          thumbnailUrl: String,
          duration: Number, // for videos in seconds
          order: Number, // for carousels
        },
      ],
      links: [
        {
          url: String,
          description: String,
          tracking: String, // UTM parameters
        },
      ],
      targetAudience: {
        ageRange: String,
        gender: String,
        location: [String],
        interests: [String],
      },
      status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'failed', 'cancelled'],
        default: 'draft',
      },
      scheduledFor: {
        type: Date,
        description: 'Exact date and time for publishing',
      },
      publishedAt: Date,
      aiGenerated: {
        type: Boolean,
        default: false,
      },
      aiGenerationData: {
        prompt: String,
        tone: String,
        keywords: [String],
        generatedAt: Date,
      },
      // Performance Metrics
      metrics: {
        impressions: {
          type: Number,
          default: 0,
        },
        reach: {
          type: Number,
          default: 0,
        },
        likes: {
          type: Number,
          default: 0,
        },
        comments: {
          type: Number,
          default: 0,
        },
        shares: {
          type: Number,
          default: 0,
        },
        saves: {
          type: Number,
          default: 0,
        },
        views: {
          type: Number,
          default: 0,
        },
        clicks: {
          type: Number,
          default: 0,
        },
        engagement: {
          type: Number,
          default: 0,
          description: 'Overall engagement score',
        },
        engagementRate: {
          type: Number,
          default: 0,
          description: 'Percentage of engagement vs impressions',
        },
      },
      // Approval
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
      needsApproval: {
        type: Boolean,
        default: true,
      },
      // Publishing
      publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      publishingError: String,
      retryCount: {
        type: Number,
        default: 0,
      },
      // Notes
      notes: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    },
  ],
  // Calendar Settings
  settings: {
    autoPublish: {
      type: Boolean,
      default: false,
      description: 'Auto-publish approved content at scheduled time',
    },
    requireApproval: {
      type: Boolean,
      default: true,
    },
    notifyBeforePublish: {
      type: Number,
      default: 60,
      description: 'Minutes before publishing to send notification',
    },
    defaultPlatforms: [String],
    defaultHashtags: [String],
  },
  // Client Sync
  syncedWithClient: {
    type: Boolean,
    default: false,
    description: 'Whether client has visibility of this calendar',
  },
  lastSyncedAt: Date,
  clientFeedback: [
    {
      entryId: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      feedback: String,
      status: {
        type: String,
        enum: ['approved', 'changes-requested', 'rejected'],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
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
      role: {
        type: String,
        enum: ['creator', 'approver', 'publisher', 'viewer'],
      },
    },
  ],
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

// Auto-generate calendar ID
contentCalendarSchema.pre('save', async function (next) {
  if (!this.calendarId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      calendarId: new RegExp(`^CAL${year}`),
    });
    this.calendarId = `CAL${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Auto-generate entry IDs
  if (this.entries && this.entries.length > 0) {
    for (const entry of this.entries) {
      if (!entry.entryId) {
        entry.entryId = `${this.calendarId}-E${String(this.entries.indexOf(entry) + 1).padStart(3, '0')}`;
      }

      // Calculate engagement rate
      if (entry.metrics && entry.metrics.impressions > 0) {
        const totalEngagement =
          (entry.metrics.likes || 0) +
          (entry.metrics.comments || 0) +
          (entry.metrics.shares || 0) +
          (entry.metrics.saves || 0);

        entry.metrics.engagement = totalEngagement;
        entry.metrics.engagementRate = parseFloat(
          ((totalEngagement / entry.metrics.impressions) * 100).toFixed(2)
        );
      }
    }
  }

  next();
});

// Indexes
contentCalendarSchema.index({ month: 1, year: 1 });
contentCalendarSchema.index({ campaign: 1 });
contentCalendarSchema.index({ client: 1 });
contentCalendarSchema.index({ manager: 1, createdAt: -1 });
contentCalendarSchema.index({ 'entries.platform': 1, 'entries.status': 1 });
contentCalendarSchema.index({ 'entries.scheduledFor': 1 });

// Virtual for total scheduled posts
contentCalendarSchema.virtual('totalScheduledPosts').get(function () {
  if (!this.entries) return 0;
  return this.entries.filter((e) => e.status === 'scheduled').length;
});

// Virtual for total published posts
contentCalendarSchema.virtual('totalPublishedPosts').get(function () {
  if (!this.entries) return 0;
  return this.entries.filter((e) => e.status === 'published').length;
});

// Virtual for overall engagement
contentCalendarSchema.virtual('overallEngagement').get(function () {
  if (!this.entries || this.entries.length === 0) return 0;

  const totalEngagement = this.entries.reduce((sum, entry) => {
    return sum + (entry.metrics?.engagement || 0);
  }, 0);

  return totalEngagement;
});

// Virtual for average engagement rate
contentCalendarSchema.virtual('averageEngagementRate').get(function () {
  if (!this.entries || this.entries.length === 0) return 0;

  const publishedEntries = this.entries.filter((e) => e.status === 'published' && e.metrics?.impressions > 0);
  if (publishedEntries.length === 0) return 0;

  const totalRate = publishedEntries.reduce((sum, entry) => {
    return sum + (entry.metrics?.engagementRate || 0);
  }, 0);

  return parseFloat((totalRate / publishedEntries.length).toFixed(2));
});

// Method to get posts by platform
contentCalendarSchema.methods.getPostsByPlatform = function (platform) {
  return this.entries.filter((entry) => entry.platform === platform);
};

// Method to get posts by status
contentCalendarSchema.methods.getPostsByStatus = function (status) {
  return this.entries.filter((entry) => entry.status === status);
};

// Method to get upcoming posts (next 7 days)
contentCalendarSchema.methods.getUpcomingPosts = function (days = 7) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return this.entries.filter((entry) => {
    const scheduledDate = new Date(entry.scheduledFor);
    return scheduledDate >= now && scheduledDate <= future && entry.status === 'scheduled';
  });
};

// Method to schedule post
contentCalendarSchema.methods.schedulePost = function (entryId, scheduledFor) {
  const entry = this.entries.find((e) => e.entryId === entryId);
  if (entry) {
    entry.scheduledFor = scheduledFor;
    entry.status = 'scheduled';
  }
};

// Method to mark as published
contentCalendarSchema.methods.markAsPublished = function (entryId, publishedBy) {
  const entry = this.entries.find((e) => e.entryId === entryId);
  if (entry) {
    entry.status = 'published';
    entry.publishedAt = new Date();
    entry.publishedBy = publishedBy;
  }
};

// Static method to get calendar statistics
contentCalendarSchema.statics.getCalendarStatistics = async function (filters = {}) {
  const calendars = await this.find(filters);

  let totalScheduled = 0;
  let totalPublished = 0;
  let totalEngagement = 0;
  let platformBreakdown = {};

  calendars.forEach((calendar) => {
    calendar.entries.forEach((entry) => {
      if (entry.status === 'scheduled') totalScheduled++;
      if (entry.status === 'published') totalPublished++;
      if (entry.metrics) {
        totalEngagement += entry.metrics.engagement || 0;
      }

      platformBreakdown[entry.platform] = (platformBreakdown[entry.platform] || 0) + 1;
    });
  });

  return {
    totalCalendars: calendars.length,
    totalScheduled,
    totalPublished,
    totalEngagement,
    platformBreakdown,
  };
};

module.exports = mongoose.model('ContentCalendar', contentCalendarSchema);
