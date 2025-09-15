const mongoose = require('mongoose');
const crypto = require('crypto');

// Version schema for document versioning
const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number },
  mimeType: { type: String },
  checksum: { type: String },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  uploadedAt: { type: Date, default: Date.now },
  changeLog: { type: String },
  isActive: { type: Boolean, default: false }
}, { _id: false });

// View tracking schema
const viewSchema = new mongoose.Schema({
  viewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead'
  },
  viewerEmail: { type: String },
  viewerName: { type: String },
  viewTime: { type: Number, default: 0 }, // in seconds
  viewDate: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  location: {
    country: { type: String },
    city: { type: String }
  },
  pageViews: [{ 
    page: Number, 
    timeSpent: Number 
  }],
  downloadedAt: { type: Date },
  isDownloaded: { type: Boolean, default: false }
});

// Share link schema
const shareLinkSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  expiresAt: { type: Date },
  password: { type: String },
  maxViews: { type: Number },
  currentViews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  allowDownload: { type: Boolean, default: false },
  requireEmail: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Signature tracking (for contracts/proposals)
const signatureSchema = new mongoose.Schema({
  requestId: { type: String },
  signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  signerEmail: { type: String },
  signerName: { type: String },
  signedAt: { type: Date },
  ipAddress: { type: String },
  status: {
    type: String,
    enum: ['pending', 'signed', 'declined', 'expired'],
    default: 'pending'
  },
  declineReason: { type: String }
}, { _id: false });

// Main Document Schema
const documentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  titleAr: { type: String },
  description: { type: String },
  descriptionAr: { type: String },
  
  // Document Type & Category
  type: {
    type: String,
    enum: [
      'proposal', 'contract', 'invoice', 'quotation',
      'presentation', 'brochure', 'case-study', 'whitepaper',
      'technical-spec', 'sow', 'nda', 'agreement',
      'report', 'certificate', 'portfolio', 'other'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'sales', 'marketing', 'legal', 'technical',
      'financial', 'operational', 'strategic'
    ],
    default: 'sales'
  },
  
  // Association
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  relatedLeads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // Current Version Info
  currentVersion: { type: Number, default: 1 },
  filename: { type: String, required: true },
  originalName: { type: String },
  path: { type: String, required: true },
  size: { type: Number },
  mimeType: { type: String },
  fileExtension: { type: String },
  checksum: { type: String },
  
  // Versions
  versions: [versionSchema],
  
  // Storage
  storageType: {
    type: String,
    enum: ['local', 's3', 'azure', 'gcs'],
    default: 'local'
  },
  storageUrl: { type: String },
  thumbnailUrl: { type: String },
  
  // Tracking & Analytics
  views: [viewSchema],
  viewCount: { type: Number, default: 0 },
  uniqueViewers: { type: Number, default: 0 },
  totalViewTime: { type: Number, default: 0 }, // in seconds
  avgViewTime: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  lastDownloadedAt: { type: Date },
  
  // Engagement Metrics
  engagement: {
    sentCount: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // % of doc viewed
    hotSpots: [{ // Most viewed sections
      page: Number,
      avgTimeSpent: Number,
      viewCount: Number
    }]
  },
  
  // Share Links
  shareLinks: [shareLinkSchema],
  publicUrl: { type: String },
  isPublic: { type: Boolean, default: false },
  
  // Permissions
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  canView: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  canEdit: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  canDownload: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Signature Management
  requiresSignature: { type: Boolean, default: false },
  signatures: [signatureSchema],
  signatureDeadline: { type: Date },
  
  // Document State
  status: {
    type: String,
    enum: [
      'draft', 'review', 'approved', 'sent', 'viewed',
      'signed', 'expired', 'archived', 'rejected'
    ],
    default: 'draft',
    index: true
  },
  
  // Validity
  validFrom: { type: Date },
  validUntil: { type: Date },
  isExpired: { type: Boolean, default: false },
  
  // Tags & Labels
  tags: [{ type: String }],
  labels: [{
    name: { type: String },
    color: { type: String }
  }],
  
  // Language & Localization
  language: {
    type: String,
    enum: ['ar', 'en', 'bilingual'],
    default: 'ar'
  },
  
  // Security
  isConfidential: { type: Boolean, default: false },
  watermark: { type: Boolean, default: false },
  passwordProtected: { type: Boolean, default: false },
  encryptionKey: { type: String },
  
  // Metadata
  keywords: [{ type: String }],
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
documentSchema.index({ title: 'text', description: 'text', keywords: 'text' });
documentSchema.index({ lead: 1, type: 1, status: 1 });
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ 'shareLinks.token': 1 });
documentSchema.index({ viewCount: -1, engagement: -1 });

// Virtuals

// Check if document is valid
documentSchema.virtual('isValid').get(function() {
  if (!this.validUntil) return true;
  return this.validUntil > new Date();
});

// Get active version
documentSchema.virtual('activeVersion').get(function() {
  return this.versions.find(v => v.isActive) || this.versions[this.versions.length - 1];
});

// Calculate engagement score
documentSchema.virtual('engagementScore').get(function() {
  if (this.engagement.sentCount === 0) return 0;
  
  const openScore = (this.uniqueViewers / this.engagement.sentCount) * 40;
  const completionScore = this.engagement.completionRate * 30;
  const timeScore = Math.min(30, (this.avgViewTime / 60) * 3); // Cap at 30 points
  
  return Math.round(openScore + completionScore + timeScore);
});

// Methods

// Track document view
documentSchema.methods.trackView = async function(viewerData) {
  const { viewerId, viewerEmail, viewTime = 0, pageViews = [], ipAddress, userAgent } = viewerData;
  
  // Check if viewer already exists
  const existingView = this.views.find(v => 
    (viewerId && v.viewerId?.toString() === viewerId.toString()) ||
    (viewerEmail && v.viewerEmail === viewerEmail)
  );
  
  if (existingView) {
    // Update existing view
    existingView.viewTime += viewTime;
    existingView.viewDate = new Date();
    if (pageViews.length > 0) {
      existingView.pageViews = existingView.pageViews.concat(pageViews);
    }
  } else {
    // Add new view
    this.views.push({
      viewerId,
      viewerEmail,
      viewerName: viewerData.viewerName,
      viewTime,
      pageViews,
      ipAddress,
      userAgent,
      location: viewerData.location
    });
    this.uniqueViewers += 1;
  }
  
  // Update counters
  this.viewCount += 1;
  this.totalViewTime += viewTime;
  this.avgViewTime = Math.round(this.totalViewTime / this.viewCount);
  this.lastViewedAt = new Date();
  
  // Update engagement metrics
  if (this.engagement.sentCount > 0) {
    this.engagement.openRate = (this.uniqueViewers / this.engagement.sentCount) * 100;
  }
  
  // Calculate completion rate based on page views
  if (pageViews.length > 0 && viewerData.totalPages) {
    const pagesViewed = new Set(pageViews.map(pv => pv.page)).size;
    const completionRate = (pagesViewed / viewerData.totalPages) * 100;
    this.engagement.completionRate = 
      (this.engagement.completionRate + completionRate) / 2;
  }
  
  // Update hot spots
  for (const pageView of pageViews) {
    const hotSpot = this.engagement.hotSpots.find(hs => hs.page === pageView.page);
    if (hotSpot) {
      hotSpot.viewCount += 1;
      hotSpot.avgTimeSpent = (hotSpot.avgTimeSpent + pageView.timeSpent) / 2;
    } else {
      this.engagement.hotSpots.push({
        page: pageView.page,
        avgTimeSpent: pageView.timeSpent,
        viewCount: 1
      });
    }
  }
  
  // Update lead engagement if associated
  if (this.lead && viewerId) {
    const Lead = mongoose.model('Lead');
    const lead = await Lead.findById(this.lead);
    if (lead) {
      lead.trackEngagement('documentsViewed');
      await lead.save();
    }
  }
  
  return this.save();
};

// Track download
documentSchema.methods.trackDownload = function(userId, leadId) {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  
  // Mark in views if exists
  const view = this.views.find(v => 
    v.viewerId?.toString() === leadId?.toString()
  );
  if (view) {
    view.isDownloaded = true;
    view.downloadedAt = new Date();
  }
  
  return this.save();
};

// Add new version
documentSchema.methods.addVersion = function(versionData, userId) {
  const versionNumber = this.versions.length + 1;
  
  // Deactivate all previous versions
  this.versions.forEach(v => v.isActive = false);
  
  // Add new version
  this.versions.push({
    versionNumber,
    ...versionData,
    uploadedBy: userId,
    isActive: true
  });
  
  // Update current version info
  this.currentVersion = versionNumber;
  this.filename = versionData.filename;
  this.path = versionData.path;
  this.size = versionData.size;
  this.mimeType = versionData.mimeType;
  this.checksum = versionData.checksum;
  
  return this.save();
};

// Rollback to previous version
documentSchema.methods.rollbackToVersion = function(versionNumber) {
  const version = this.versions.find(v => v.versionNumber === versionNumber);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Deactivate all versions
  this.versions.forEach(v => v.isActive = false);
  
  // Activate selected version
  version.isActive = true;
  
  // Update current version info
  this.currentVersion = version.versionNumber;
  this.filename = version.filename;
  this.path = version.path;
  this.size = version.size;
  this.mimeType = version.mimeType;
  this.checksum = version.checksum;
  
  return this.save();
};

// Create share link
documentSchema.methods.createShareLink = function(options = {}) {
  const shareLink = {
    createdBy: options.createdBy,
    expiresAt: options.expiresAt,
    password: options.password,
    maxViews: options.maxViews,
    allowDownload: options.allowDownload || false,
    requireEmail: options.requireEmail || false
  };
  
  this.shareLinks.push(shareLink);
  return this.save();
};

// Mark as sent
documentSchema.methods.markAsSent = function(recipientCount = 1) {
  this.status = 'sent';
  this.engagement.sentCount += recipientCount;
  return this.save();
};

// Request signature
documentSchema.methods.requestSignature = function(signers) {
  this.requiresSignature = true;
  this.status = 'sent';
  
  for (const signer of signers) {
    this.signatures.push({
      signerId: signer.id,
      signerEmail: signer.email,
      signerName: signer.name,
      status: 'pending'
    });
  }
  
  return this.save();
};

// Record signature
documentSchema.methods.recordSignature = function(signerEmail, ipAddress) {
  const signature = this.signatures.find(s => s.signerEmail === signerEmail);
  
  if (!signature) {
    throw new Error('Signer not found');
  }
  
  signature.status = 'signed';
  signature.signedAt = new Date();
  signature.ipAddress = ipAddress;
  
  // Check if all signatures are collected
  const allSigned = this.signatures.every(s => s.status === 'signed');
  if (allSigned) {
    this.status = 'signed';
  }
  
  return this.save();
};

// Soft delete
documentSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Calculate checksum for file
documentSchema.methods.calculateChecksum = function(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Pre-save middleware
documentSchema.pre('save', function(next) {
  // Extract file extension
  if (this.filename) {
    const parts = this.filename.split('.');
    this.fileExtension = parts.length > 1 ? parts.pop().toLowerCase() : '';
  }
  
  // Check expiry
  if (this.validUntil && this.validUntil < new Date()) {
    this.isExpired = true;
    if (this.status !== 'expired' && this.status !== 'archived') {
      this.status = 'expired';
    }
  }
  
  next();
});

// Static methods

// Get trending documents
documentSchema.statics.getTrendingDocuments = function(days = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        isDeleted: false,
        lastViewedAt: { $gte: startDate }
      }
    },
    {
      $addFields: {
        trendScore: {
          $add: [
            { $multiply: ['$viewCount', 2] },
            { $multiply: ['$uniqueViewers', 3] },
            { $multiply: ['$downloadCount', 5] }
          ]
        }
      }
    },
    { $sort: { trendScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'leads',
        localField: 'lead',
        foreignField: '_id',
        as: 'leadInfo'
      }
    }
  ]);
};

// Get document analytics
documentSchema.statics.getAnalytics = async function(filters = {}) {
  const match = { isDeleted: false };
  
  if (filters.startDate) match.createdAt = { $gte: filters.startDate };
  if (filters.endDate) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = filters.endDate;
  }
  if (filters.type) match.type = filters.type;
  if (filters.owner) match.owner = filters.owner;
  
  const analytics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
        avgViewTime: { $avg: '$avgViewTime' },
        avgEngagement: { $avg: '$engagement.openRate' },
        byType: {
          $push: {
            type: '$type',
            views: '$viewCount'
          }
        },
        byStatus: {
          $push: '$status'
        },
        topViewed: {
          $push: {
            title: '$title',
            views: '$viewCount',
            id: '$_id'
          }
        }
      }
    },
    {
      $project: {
        totalDocuments: 1,
        totalViews: 1,
        totalDownloads: 1,
        avgViewTime: { $round: ['$avgViewTime', 2] },
        avgEngagement: { $round: ['$avgEngagement', 2] },
        byType: 1,
        byStatus: 1,
        topViewed: {
          $slice: [
            { $sortArray: { input: '$topViewed', sortBy: { views: -1 } } },
            5
          ]
        }
      }
    }
  ]);
  
  return analytics[0] || {
    totalDocuments: 0,
    totalViews: 0,
    totalDownloads: 0,
    avgViewTime: 0,
    avgEngagement: 0,
    byType: [],
    byStatus: [],
    topViewed: []
  };
};

// Get documents needing follow-up (viewed but no action)
documentSchema.statics.getFollowUpDocuments = function(days = 3) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    isDeleted: false,
    status: 'sent',
    lastViewedAt: { $lte: cutoffDate },
    viewCount: { $gt: 0 },
    'signatures.status': { $ne: 'signed' }
  })
  .populate('lead', 'firstName lastName company.nameEn')
  .populate('owner', 'name email')
  .sort('-lastViewedAt');
};

module.exports = mongoose.model('Document', documentSchema);