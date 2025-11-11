const mongoose = require('mongoose');

const salesHandbookSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },

  // Content Type
  type: {
    type: String,
    enum: [
      'playbook',
      'script',
      'template',
      'best_practice',
      'objection_handler',
      'product_knowledge',
      'competitive_analysis',
      'case_study',
      'pricing_guide',
      'process',
      'other'
    ],
    required: true
  },

  // Category
  category: {
    type: String,
    enum: [
      'prospecting',
      'discovery',
      'demo',
      'proposal',
      'negotiation',
      'closing',
      'onboarding',
      'general'
    ],
    required: true
  },

  // Content
  content: {
    type: String,
    required: [true, 'Content is required']
  },

  // Rich Content Support
  richContent: {
    html: String,
    markdown: String
  },

  // Metadata
  industry: [{
    type: String,
    enum: ['technology', 'healthcare', 'finance', 'education', 'manufacturing', 'retail', 'real_estate', 'automotive', 'media', 'consulting', 'all']
  }],

  productLine: [String],

  salesStage: [{
    type: String,
    enum: ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closing']
  }],

  // Scripts & Templates
  scripts: [{
    name: String,
    scenario: String, // e.g., "Cold call intro", "Email follow-up"
    script: String,
    tips: [String]
  }],

  // Objection Handlers
  objections: [{
    objection: String, // e.g., "Too expensive"
    response: String,
    alternatives: [String]
  }],

  // Best Practices
  dos: [String],
  donts: [String],
  tips: [String],

  // Success Metrics
  successMetrics: [{
    metric: String,
    target: String,
    description: String
  }],

  // Resources
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'doc', 'ppt', 'video', 'image', 'link', 'other']
    },
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  externalLinks: [{
    title: String,
    url: String,
    description: String
  }],

  // Related Content
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesHandbook'
  }],

  // Usage Tracking
  usage: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },

  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],

  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Reviews & Feedback
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    helpful: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // Version Control
  version: {
    type: String,
    default: '1.0'
  },
  versionHistory: [{
    version: String,
    changes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  archivedAt: Date,

  // Access Control
  visibility: {
    type: String,
    enum: ['public', 'team', 'private'],
    default: 'team'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Tags
  tags: [String],

  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true
  },

  // System Fields
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
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
salesHandbookSchema.index({ type: 1 });
salesHandbookSchema.index({ category: 1 });
salesHandbookSchema.index({ status: 1 });
salesHandbookSchema.index({ author: 1 });
salesHandbookSchema.index({ tags: 1 });
salesHandbookSchema.index({ slug: 1 });
salesHandbookSchema.index({ 'usage.views': -1 });
salesHandbookSchema.index({ averageRating: -1 });
salesHandbookSchema.index({ createdAt: -1 });

// Text index for search
salesHandbookSchema.index({
  title: 'text',
  description: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual for excerpt
salesHandbookSchema.virtual('excerpt').get(function() {
  if (this.content) {
    return this.content.substring(0, 200) + (this.content.length > 200 ? '...' : '');
  }
  return '';
});

// Pre-save middleware
salesHandbookSchema.pre('save', function(next) {
  // Generate slug from title
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = (totalRating / this.reviews.length).toFixed(1);
  }

  // Set published date
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Set archived date
  if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }

  next();
});

// Instance methods
salesHandbookSchema.methods.incrementView = async function(userId) {
  this.usage.views += 1;

  // Track unique viewer
  const alreadyViewed = this.viewedBy.some(view => view.user.equals(userId));
  if (!alreadyViewed) {
    this.viewedBy.push({ user: userId });
  }

  return this.save();
};

salesHandbookSchema.methods.toggleLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);

  if (index > -1) {
    // Unlike
    this.likedBy.splice(index, 1);
    this.usage.likes -= 1;
  } else {
    // Like
    this.likedBy.push(userId);
    this.usage.likes += 1;
  }

  return this.save();
};

salesHandbookSchema.methods.toggleBookmark = async function(userId) {
  const index = this.bookmarkedBy.indexOf(userId);

  if (index > -1) {
    // Remove bookmark
    this.bookmarkedBy.splice(index, 1);
    this.usage.bookmarks -= 1;
  } else {
    // Add bookmark
    this.bookmarkedBy.push(userId);
    this.usage.bookmarks += 1;
  }

  return this.save();
};

// Static methods
salesHandbookSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'published', isDeleted: false })
    .sort({ 'usage.views': -1, averageRating: -1 })
    .limit(limit);
};

salesHandbookSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ status: 'published', isDeleted: false })
    .sort({ averageRating: -1, 'usage.views': -1 })
    .limit(limit);
};

salesHandbookSchema.statics.searchContent = function(query) {
  return this.find(
    { $text: { $search: query }, status: 'published', isDeleted: false },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.models.SalesHandbook || mongoose.model('SalesHandbook', salesHandbookSchema);
