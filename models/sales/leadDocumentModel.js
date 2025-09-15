const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  checksum: String
});

const documentSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead reference is required']
  },
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxLength: [200, 'Document name cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['proposal', 'contract', 'brochure', 'presentation', 'quote', 'other'],
    required: [true, 'Document type is required']
  },
  currentVersion: {
    type: String,
    default: '1.0'
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  size: {
    type: Number,
    required: [true, 'Document size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  
  // Engagement Tracking
  engagement: {
    viewed: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0
    },
    totalViewTime: {
      type: Number,
      default: 0 // in seconds
    },
    lastViewedAt: {
      type: Date
    },
    lastViewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uniqueViewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewCount: {
        type: Number,
        default: 1
      },
      totalViewTime: {
        type: Number,
        default: 0
      },
      firstViewedAt: {
        type: Date,
        default: Date.now
      },
      lastViewedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Version History
  versions: [documentVersionSchema],

  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'signed', 'rejected'],
    default: 'draft'
  },

  // Permissions
  permissions: {
    canView: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canEdit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isPublic: {
      type: Boolean,
      default: false
    }
  },

  // System fields
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Metadata
  tags: [String],
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  expiresAt: {
    type: Date
  },

  // Integration fields
  externalId: String,
  signatureRequestId: String // For DocuSign integration

}, {
  timestamps: true
});

// Indexes
documentSchema.index({ lead: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

// Method to track document view
documentSchema.methods.trackView = function(userId, viewTime = 0) {
  this.engagement.viewed = true;
  this.engagement.viewCount += 1;
  this.engagement.totalViewTime += viewTime;
  this.engagement.lastViewedAt = new Date();
  this.engagement.lastViewedBy = userId;

  // Update unique viewers
  const existingViewer = this.engagement.uniqueViewers.find(
    viewer => viewer.user.toString() === userId.toString()
  );

  if (existingViewer) {
    existingViewer.viewCount += 1;
    existingViewer.totalViewTime += viewTime;
    existingViewer.lastViewedAt = new Date();
  } else {
    this.engagement.uniqueViewers.push({
      user: userId,
      viewCount: 1,
      totalViewTime: viewTime,
      firstViewedAt: new Date(),
      lastViewedAt: new Date()
    });
  }

  return this.save();
};

module.exports = mongoose.model('Document', documentSchema);
