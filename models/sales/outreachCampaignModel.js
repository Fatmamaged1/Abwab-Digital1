const mongoose = require('mongoose');

const outreachCampaignSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxLength: [200, 'Campaign name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Campaign Type
  type: {
    type: String,
    enum: ['email', 'linkedin', 'phone', 'sms', 'multi_channel'],
    required: true
  },

  // Campaign Goal
  goal: {
    type: String,
    enum: [
      'lead_generation',
      'product_launch',
      'event_promotion',
      'nurture',
      'reactivation',
      'upsell',
      'customer_success',
      'other'
    ],
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },

  // Schedule
  schedule: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Target Audience
  targetAudience: {
    criteria: {
      industry: [String],
      companySize: [String],
      jobTitle: [String],
      location: [String],
      leadStatus: [String],
      tags: [String]
    },
    totalContacts: {
      type: Number,
      default: 0
    },
    segmentName: String
  },

  // Campaign Sequence (for multi-touch campaigns)
  sequence: [{
    step: {
      type: Number,
      required: true
    },
    name: String,
    type: {
      type: String,
      enum: ['email', 'linkedin_message', 'linkedin_connect', 'phone_call', 'sms', 'task'],
      required: true
    },
    delay: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks'],
        default: 'days'
      }
    },
    content: {
      subject: String, // for emails
      body: {
        type: String,
        required: true
      },
      variables: [String], // e.g., {{firstName}}, {{company}}
      attachments: [{
        name: String,
        url: String
      }]
    },
    conditions: {
      sendIf: String, // e.g., "previous_opened", "not_replied"
      skipIf: String
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'skipped'],
      default: 'pending'
    }
  }],

  // Email Settings
  emailSettings: {
    fromName: String,
    fromEmail: String,
    replyTo: String,
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    }
  },

  // Performance Metrics
  metrics: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    replied: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    },
    converted: {
      type: Number,
      default: 0
    },
    // Calculated rates
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
      type: Number,
      default: 0
    },
    replyRate: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },

  // Budget & Cost
  budget: {
    amount: Number,
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // A/B Testing
  variants: [{
    name: String,
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    subject: String,
    body: String,
    metrics: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      replied: { type: Number, default: 0 }
    }
  }],

  winningVariant: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Recipients
  recipients: [{
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    email: String,
    firstName: String,
    lastName: String,
    company: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'opted_out'],
      default: 'pending'
    },
    currentStep: {
      type: Number,
      default: 0
    },
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date,
    bouncedAt: Date,
    unsubscribedAt: Date,
    variant: String
  }],

  // Exclusions
  exclusions: {
    leads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    }],
    domains: [String],
    emails: [String]
  },

  // Integration
  integrations: {
    emailProvider: {
      type: String,
      enum: ['sendgrid', 'mailgun', 'smtp', 'other']
    },
    crmSync: {
      type: Boolean,
      default: true
    }
  },

  // Tags & Categories
  tags: [String],
  category: String,

  // Team
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
outreachCampaignSchema.index({ owner: 1 });
outreachCampaignSchema.index({ status: 1 });
outreachCampaignSchema.index({ type: 1 });
outreachCampaignSchema.index({ goal: 1 });
outreachCampaignSchema.index({ 'schedule.startDate': 1 });
outreachCampaignSchema.index({ createdAt: -1 });
outreachCampaignSchema.index({ tags: 1 });

// Virtual for campaign performance score
outreachCampaignSchema.virtual('performanceScore').get(function() {
  if (this.metrics.sent === 0) return 0;

  const openScore = this.metrics.openRate * 0.3;
  const clickScore = this.metrics.clickRate * 0.3;
  const replyScore = this.metrics.replyRate * 0.2;
  const conversionScore = this.metrics.conversionRate * 0.2;

  return (openScore + clickScore + replyScore + conversionScore).toFixed(2);
});

// Pre-save middleware
outreachCampaignSchema.pre('save', function(next) {
  // Calculate rates
  if (this.metrics.sent > 0) {
    this.metrics.openRate = ((this.metrics.opened / this.metrics.sent) * 100).toFixed(2);
    this.metrics.clickRate = ((this.metrics.clicked / this.metrics.sent) * 100).toFixed(2);
    this.metrics.replyRate = ((this.metrics.replied / this.metrics.sent) * 100).toFixed(2);
    this.metrics.conversionRate = ((this.metrics.converted / this.metrics.sent) * 100).toFixed(2);
  }

  // Update total contacts
  if (this.recipients) {
    this.targetAudience.totalContacts = this.recipients.length;
  }

  next();
});

// Instance methods
outreachCampaignSchema.methods.addRecipient = async function(leadId, leadData) {
  // Check if already exists
  const exists = this.recipients.some(r => r.lead && r.lead.equals(leadId));
  if (!exists) {
    this.recipients.push({
      lead: leadId,
      email: leadData.email,
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      company: leadData.company
    });
    await this.save();
  }
};

outreachCampaignSchema.methods.removeRecipient = async function(leadId) {
  this.recipients = this.recipients.filter(r => !r.lead.equals(leadId));
  await this.save();
};

outreachCampaignSchema.methods.updateRecipientStatus = async function(leadId, status, timestamp) {
  const recipient = this.recipients.find(r => r.lead.equals(leadId));
  if (recipient) {
    recipient.status = status;

    // Update timestamp based on status
    switch (status) {
      case 'sent':
        recipient.sentAt = timestamp || new Date();
        this.metrics.sent += 1;
        break;
      case 'opened':
        recipient.openedAt = timestamp || new Date();
        this.metrics.opened += 1;
        break;
      case 'clicked':
        recipient.clickedAt = timestamp || new Date();
        this.metrics.clicked += 1;
        break;
      case 'replied':
        recipient.repliedAt = timestamp || new Date();
        this.metrics.replied += 1;
        break;
      case 'bounced':
        recipient.bouncedAt = timestamp || new Date();
        this.metrics.bounced += 1;
        break;
      case 'unsubscribed':
        recipient.unsubscribedAt = timestamp || new Date();
        this.metrics.unsubscribed += 1;
        break;
    }

    await this.save();
  }
};

outreachCampaignSchema.methods.markConverted = async function(leadId) {
  const recipient = this.recipients.find(r => r.lead.equals(leadId));
  if (recipient) {
    this.metrics.converted += 1;
    await this.save();
  }
};

// Static methods
outreachCampaignSchema.statics.getActiveCampaigns = function(userId) {
  return this.find({
    owner: userId,
    status: { $in: ['active', 'scheduled'] },
    isDeleted: false
  }).sort({ 'schedule.startDate': -1 });
};

outreachCampaignSchema.statics.getCampaignStats = async function(userId, startDate, endDate) {
  const campaigns = await this.find({
    owner: userId,
    createdAt: { $gte: startDate, $lte: endDate },
    isDeleted: false
  });

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalConverted: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    avgReplyRate: 0,
    avgConversionRate: 0
  };

  campaigns.forEach(campaign => {
    stats.totalSent += campaign.metrics.sent;
    stats.totalOpened += campaign.metrics.opened;
    stats.totalClicked += campaign.metrics.clicked;
    stats.totalReplied += campaign.metrics.replied;
    stats.totalConverted += campaign.metrics.converted;
  });

  if (stats.totalSent > 0) {
    stats.avgOpenRate = ((stats.totalOpened / stats.totalSent) * 100).toFixed(2);
    stats.avgClickRate = ((stats.totalClicked / stats.totalSent) * 100).toFixed(2);
    stats.avgReplyRate = ((stats.totalReplied / stats.totalSent) * 100).toFixed(2);
    stats.avgConversionRate = ((stats.totalConverted / stats.totalSent) * 100).toFixed(2);
  }

  return stats;
};

module.exports = mongoose.models.OutreachCampaign || mongoose.model('OutreachCampaign', outreachCampaignSchema);
