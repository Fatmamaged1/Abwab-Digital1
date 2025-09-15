const mongoose = require('mongoose');
const { DateTime } = require('luxon');

// Bilingual string schema for Arabic/English support
const bilingualString = {
  ar: { type: String },
  en: { type: String }
};

// BANT Scoring Schema (Budget, Authority, Need, Timeline)
const bantSchema = new mongoose.Schema({
  budget: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
    description: 'Budget availability score (0-10)'
  },
  authority: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
    description: 'Decision-making authority score (0-10)'
  },
  need: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
    description: 'Business need urgency score (0-10)'
  },
  timeline: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
    description: 'Implementation timeline score (0-10)'
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    description: 'Calculated overall BANT score'
  }
}, { _id: false });

// Engagement tracking schema
const engagementSchema = new mongoose.Schema({
  emailOpens: { type: Number, default: 0 },
  linkClicks: { type: Number, default: 0 },
  documentsViewed: { type: Number, default: 0 },
  meetingAttendance: { type: Number, default: 0 },
  proposalViews: { type: Number, default: 0 },
  websiteVisits: { type: Number, default: 0 },
  lastEngaged: { type: Date },
  engagementScore: { type: Number, default: 0 }, // Calculated engagement score
  communicationPreference: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'in-person', 'teams', 'zoom'],
    default: 'email'
  }
}, { _id: false });

// Saudi-specific company information
const companySchema = new mongoose.Schema({
  name: bilingualString,
  nameEn: { type: String, required: true },
  nameAr: { type: String },
  crNumber: { type: String }, // Commercial Registration Number
  vatNumber: { type: String }, // VAT registration number
  sector: {
    type: String,
    enum: [
      'government', 'semi-government', 'private', 'startup', 
      'enterprise', 'sme', 'family-business', 'non-profit',
      'healthcare', 'education', 'retail', 'manufacturing',
      'construction', 'hospitality', 'financial-services',
      'telecom', 'energy', 'real-estate', 'logistics'
    ]
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  city: {
    type: String,
    enum: [
      'riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 
      'khobar', 'dhahran', 'tabuk', 'buraidah', 'khamis-mushait',
      'taif', 'najran', 'abha', 'yanbu', 'jubail', 'hail', 'other'
    ]
  },
  region: {
    type: String,
    enum: ['central', 'western', 'eastern', 'northern', 'southern']
  },
  website: { type: String },
  industry: { type: String }
}, { _id: false });

// Service interests for software/marketing agency
const serviceInterestsSchema = new mongoose.Schema({
  // Software Development Services
  webDevelopment: { type: Boolean, default: false },
  mobileAppDevelopment: { type: Boolean, default: false },
  customSoftware: { type: Boolean, default: false },
  ecommercePlatform: { type: Boolean, default: false },
  erpSystems: { type: Boolean, default: false },
  
  // Digital Marketing Services
  socialMediaMarketing: { type: Boolean, default: false },
  seoServices: { type: Boolean, default: false },
  contentMarketing: { type: Boolean, default: false },
  emailMarketing: { type: Boolean, default: false },
  ppcAdvertising: { type: Boolean, default: false },
  
  // Branding & Design
  brandingStrategy: { type: Boolean, default: false },
  uiUxDesign: { type: Boolean, default: false },
  graphicDesign: { type: Boolean, default: false },
  videoProduction: { type: Boolean, default: false },
  
  // Consulting Services
  digitalTransformation: { type: Boolean, default: false },
  itConsulting: { type: Boolean, default: false },
  marketingStrategy: { type: Boolean, default: false },
  
  estimatedBudget: {
    type: String,
    enum: [
      'under-10k', '10k-50k', '50k-100k', '100k-250k', 
      '250k-500k', '500k-1m', 'above-1m'
    ]
  },
  projectTimeline: {
    type: String,
    enum: ['immediate', '1-month', '3-months', '6-months', '1-year', 'planning']
  }
}, { _id: false });

// Conversion tracking
const conversionSchema = new mongoose.Schema({
  converted: { type: Boolean, default: false },
  conversionDate: { type: Date },
  conversionValue: { type: Number },
  conversionType: {
    type: String,
    enum: ['opportunity', 'customer', 'project', 'retainer', 'partner']
  },
  wonReason: { type: String },
  lostReason: { type: String },
  competitorWon: { type: String }
}, { _id: false });

// Main Lead Schema
const leadSchema = new mongoose.Schema({
  // Personal Information (Bilingual support)
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  firstNameAr: { type: String },
  lastNameAr: { type: String },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Saudi phone number validation (05xxxxxxxx or +9665xxxxxxxx)
        return /^(\+966|0)?5\d{8}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Invalid Saudi phone number'
    }
  },
  alternatePhone: { type: String },
  jobTitle: bilingualString,
  department: {
    type: String,
    enum: [
      'executive', 'it', 'marketing', 'sales', 'operations',
      'finance', 'hr', 'procurement', 'strategy', 'other'
    ]
  },
  linkedinProfile: { type: String },
  preferredLanguage: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar'
  },

  // Company Information
  company: companySchema,

  // Lead Management
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  assignedTeam: {
    type: String,
    enum: ['sales', 'marketing', 'technical', 'account-management']
  },
  status: {
    type: String,
    enum: [
      'new', 'contacted', 'qualified', 'proposal-sent',
      'negotiation', 'won', 'lost', 'on-hold', 'nurturing'
    ],
    default: 'new',
    index: true
  },
  pipelineStage: {
    type: String,
    enum: [
      'awareness', 'interest', 'consideration', 
      'intent', 'evaluation', 'purchase', 'retention'
    ],
    default: 'awareness',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Lead Source & Campaign
  source: {
    type: String,
    enum: [
      'website', 'social-media', 'email-campaign', 'referral',
      'exhibition', 'cold-call', 'partner', 'advertising',
      'seo', 'content-marketing', 'webinar', 'direct-inquiry',
      'government-tender', 'linkedin', 'twitter', 'instagram'
    ],
    index: true
  },
  sourceDetails: { type: String },
  campaign: { type: String, index: true },
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead'
  },
  
  // Service Interests
  serviceInterests: serviceInterestsSchema,
  
  // Scoring
  bant: bantSchema,
  engagement: engagementSchema,
  leadScore: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  
  // Conversion Tracking
  conversion: conversionSchema,
  
  // Compliance & Consent (PDPL - Saudi Personal Data Protection Law)
  consent: {
    marketing: { type: Boolean, default: false },
    dataProcessing: { type: Boolean, default: false },
    consentDate: { type: Date },
    ipAddress: { type: String }
  },
  
  // Activity & Engagement
  lastContactDate: { type: Date },
  nextFollowUp: { type: Date, index: true },
  totalActivities: { type: Number, default: 0 },
  
  // Notes & Tags
  notes: { type: String },
  internalNotes: { type: String }, // Not visible to client
  tags: [{ type: String }],
  
  // Metadata
  importId: { type: String }, // For bulk import tracking
  externalId: { type: String }, // Integration with external systems
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
leadSchema.index({ email: 1, isDeleted: 1 });
leadSchema.index({ owner: 1, status: 1, priority: 1 });
leadSchema.index({ 'company.nameEn': 'text', 'company.nameAr': 'text', firstName: 'text', lastName: 'text', notes: 'text' });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ nextFollowUp: 1, status: 1 });
leadSchema.index({ 'company.sector': 1, 'company.city': 1 });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

leadSchema.virtual('fullNameAr').get(function() {
  return this.firstNameAr && this.lastNameAr ? 
    `${this.firstNameAr} ${this.lastNameAr}` : null;
});

// Virtual for days since last contact
leadSchema.virtual('daysSinceContact').get(function() {
  if (!this.lastContactDate) return null;
  return Math.floor((Date.now() - this.lastContactDate) / (1000 * 60 * 60 * 24));
});

// Methods

// Calculate BANT score
leadSchema.methods.calculateBANTScore = function() {
  const { budget, authority, need, timeline } = this.bant;
  const totalScore = budget + authority + need + timeline;
  this.bant.overallScore = Math.round((totalScore / 40) * 100);
  return this.bant.overallScore;
};

// Calculate engagement score
leadSchema.methods.calculateEngagementScore = function() {
  const weights = {
    emailOpens: 1,
    linkClicks: 2,
    documentsViewed: 3,
    meetingAttendance: 5,
    proposalViews: 4,
    websiteVisits: 1
  };
  
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (this.engagement[key] || 0) * weight;
  }
  
  // Normalize to 0-100
  this.engagement.engagementScore = Math.min(100, Math.round(score));
  return this.engagement.engagementScore;
};

// Calculate overall lead score
leadSchema.methods.calculateLeadScore = function() {
  const bantScore = this.calculateBANTScore();
  const engagementScore = this.calculateEngagementScore();
  
  // Weighted average: BANT 60%, Engagement 40%
  this.leadScore = Math.round((bantScore * 0.6) + (engagementScore * 0.4));
  
  // Auto-set priority based on score
  if (this.leadScore >= 80) this.priority = 'urgent';
  else if (this.leadScore >= 60) this.priority = 'high';
  else if (this.leadScore >= 40) this.priority = 'medium';
  else this.priority = 'low';
  
  return this.leadScore;
};

// Track engagement
leadSchema.methods.trackEngagement = function(type) {
  const validTypes = ['emailOpens', 'linkClicks', 'documentsViewed', 
                      'meetingAttendance', 'proposalViews', 'websiteVisits'];
  
  if (validTypes.includes(type)) {
    this.engagement[type] = (this.engagement[type] || 0) + 1;
    this.engagement.lastEngaged = new Date();
    this.calculateLeadScore();
  }
};

// Convert lead
leadSchema.methods.convertLead = function(type, value, reason) {
  this.conversion.converted = true;
  this.conversion.conversionDate = new Date();
  this.conversion.conversionType = type;
  this.conversion.conversionValue = value;
  this.conversion.wonReason = reason;
  this.status = 'won';
  return this.save();
};

// Soft delete
leadSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Pre-save middleware
leadSchema.pre('save', async function(next) {
  // Calculate scores before saving
  if (this.isModified('bant') || this.isModified('engagement')) {
    this.calculateLeadScore();
  }
  
  // Format phone number
  if (this.isModified('phone')) {
    this.phone = this.phone.replace(/\s/g, '');
    if (!this.phone.startsWith('+')) {
      if (this.phone.startsWith('0')) {
        this.phone = '+966' + this.phone.substring(1);
      } else if (!this.phone.startsWith('+966')) {
        this.phone = '+966' + this.phone;
      }
    }
  }
  
  next();
});

// Static methods

// Get hot leads
leadSchema.statics.getHotLeads = function(ownerId = null) {
  const query = {
    isDeleted: false,
    leadScore: { $gte: 70 },
    status: { $nin: ['won', 'lost'] }
  };
  
  if (ownerId) query.owner = ownerId;
  
  return this.find(query)
    .populate('owner', 'name email')
    .sort('-leadScore')
    .limit(20);
};

// Get leads needing follow-up
leadSchema.statics.getFollowUpLeads = function(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    isDeleted: false,
    nextFollowUp: { $lte: date },
    status: { $nin: ['won', 'lost'] }
  })
  .populate('owner', 'name email')
  .sort('nextFollowUp');
};

// Bulk import
leadSchema.statics.bulkImport = async function(leads, options = {}) {
  const { upsert = true, validate = true } = options;
  const results = { success: [], errors: [] };
  
  for (const leadData of leads) {
    try {
      if (upsert) {
        const lead = await this.findOneAndUpdate(
          { email: leadData.email },
          leadData,
          { new: true, upsert: true, runValidators: validate }
        );
        results.success.push(lead);
      } else {
        const lead = new this(leadData);
        if (validate) await lead.validate();
        await lead.save();
        results.success.push(lead);
      }
    } catch (error) {
      results.errors.push({
        data: leadData,
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('Lead', leadSchema);