const mongoose = require('mongoose');

// Bilingual support
const bilingualString = {
  ar: { type: String },
  en: { type: String }
};

// Attachment schema
const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  path: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// Meeting schema for virtual meetings
const meetingSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['zoom', 'teams', 'google-meet', 'webex', 'in-person', 'phone', 'whatsapp-call']
  },
  meetingLink: { type: String },
  meetingId: { type: String },
  passcode: { type: String },
  location: bilingualString,
  attendees: [{
    name: { type: String },
    email: { type: String },
    attended: { type: Boolean, default: false }
  }]
}, { _id: false });

// Activity outcome schema
const outcomeSchema = new mongoose.Schema({
  result: {
    type: String,
    enum: [
      'successful', 'no-answer', 'rescheduled', 'cancelled',
      'interested', 'not-interested', 'follow-up-required',
      'proposal-requested', 'meeting-scheduled', 'deal-closed'
    ]
  },
  notes: { type: String },
  nextSteps: { type: String },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  recordedAt: { type: Date, default: Date.now }
}, { _id: false });

// Main Activity Schema
const activitySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  titleAr: { type: String },
  description: { type: String },
  descriptionAr: { type: String },
  
  // Activity Type & Category
  type: {
    type: String,
    enum: [
      'call', 'email', 'meeting', 'task', 'note', 'whatsapp',
      'proposal', 'presentation', 'demo', 'follow-up',
      'contract-review', 'site-visit', 'webinar', 'training'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'sales', 'marketing', 'support', 'technical',
      'administrative', 'relationship', 'service-delivery'
    ],
    default: 'sales'
  },
  
  // Association
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  relatedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],
  
  // Assignment & Ownership
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTeam: {
    type: String,
    enum: ['sales', 'marketing', 'technical', 'account-management']
  },
  
  // Scheduling
  dueDate: {
    type: Date,
    index: true
  },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number }, // in minutes
  isAllDay: { type: Boolean, default: false },
  
  // Reminder settings
  reminder: {
    enabled: { type: Boolean, default: true },
    reminderTime: { type: Date },
    reminderType: {
      type: String,
      enum: ['email', 'notification', 'both'],
      default: 'notification'
    },
    reminderSent: { type: Boolean, default: false }
  },
  
  // Priority & Status
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: [
      'pending', 'in-progress', 'completed', 'cancelled',
      'overdue', 'deferred', 'waiting'
    ],
    default: 'pending',
    index: true
  },
  
  // Completion tracking
  completed: { type: Boolean, default: false, index: true },
  completedDate: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completionNotes: { type: String },
  
  // Meeting specific fields
  meeting: meetingSchema,
  
  // Outcome tracking
  outcome: outcomeSchema,
  
  // Attachments
  attachments: [attachmentSchema],
  
  // Follow-up
  isFollowUp: { type: Boolean, default: false },
  followUpFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  requiresFollowUp: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpCreated: { type: Boolean, default: false },
  
  // Communication tracking (for emails/calls)
  communication: {
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    channel: {
      type: String,
      enum: ['email', 'phone', 'whatsapp', 'sms', 'social-media']
    },
    subject: { type: String },
    messageId: { type: String }, // For email threading
    threadId: { type: String },
    callDuration: { type: Number }, // in seconds
    recordingUrl: { type: String }
  },
  
  // External integrations
  externalId: { type: String }, // ID from external calendar/CRM
  syncedWith: {
    type: String,
    enum: ['google', 'outlook', 'apple', 'other']
  },
  lastSyncedAt: { type: Date },
  
  // Tags & Labels
  tags: [{ type: String }],
  labels: [{
    name: { type: String },
    color: { type: String }
  }],
  
  // Visibility & Privacy
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'team'
  },
  
  // Metadata
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
activitySchema.index({ lead: 1, type: 1, status: 1 });
activitySchema.index({ assignedTo: 1, dueDate: 1, status: 1 });
activitySchema.index({ dueDate: 1, reminder: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ 'outcome.result': 1, type: 1 });

// Virtuals

// Check if overdue
activitySchema.virtual('isOverdue').get(function() {
  return !this.completed && 
         this.dueDate && 
         this.dueDate < new Date() &&
         this.status !== 'cancelled';
});

// Days until due
activitySchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate || this.completed) return null;
  const days = Math.ceil((this.dueDate - new Date()) / (1000 * 60 * 60 * 24));
  return days;
});

// Activity duration in hours
activitySchema.virtual('durationHours').get(function() {
  if (this.duration) return this.duration / 60;
  if (this.startTime && this.endTime) {
    return (this.endTime - this.startTime) / (1000 * 60 * 60);
  }
  return null;
});

// Methods

// Complete activity
activitySchema.methods.complete = function(userId, notes = '') {
  this.completed = true;
  this.completedDate = new Date();
  this.completedBy = userId;
  this.status = 'completed';
  if (notes) this.completionNotes = notes;
  return this.save();
};

// Cancel activity
activitySchema.methods.cancel = function(userId, reason = '') {
  this.status = 'cancelled';
  this.completed = false;
  if (reason) {
    this.outcome = this.outcome || {};
    this.outcome.notes = reason;
    this.outcome.result = 'cancelled';
  }
  return this.save();
};

// Reschedule activity
activitySchema.methods.reschedule = function(newDate, reason = '') {
  this.dueDate = newDate;
  if (this.startTime) {
    const diff = newDate - this.dueDate;
    this.startTime = new Date(this.startTime.getTime() + diff);
    if (this.endTime) {
      this.endTime = new Date(this.endTime.getTime() + diff);
    }
  }
  
  // Update reminder
  if (this.reminder && this.reminder.enabled) {
    this.reminder.reminderTime = new Date(newDate.getTime() - (15 * 60 * 1000)); // 15 min before
    this.reminder.reminderSent = false;
  }
  
  // Add to outcome
  this.outcome = this.outcome || {};
  this.outcome.result = 'rescheduled';
  if (reason) this.outcome.notes = reason;
  
  return this.save();
};

// Add attachment
activitySchema.methods.addAttachment = function(fileData, userId) {
  this.attachments.push({
    ...fileData,
    uploadedBy: userId,
    uploadedAt: new Date()
  });
  return this.save();
};

// Set outcome
activitySchema.methods.setOutcome = function(result, notes, sentiment = 'neutral') {
  this.outcome = {
    result,
    notes,
    sentiment,
    recordedAt: new Date()
  };
  
  // Auto-complete if outcome is final
  const finalOutcomes = ['successful', 'not-interested', 'deal-closed', 'cancelled'];
  if (finalOutcomes.includes(result)) {
    this.completed = true;
    this.completedDate = new Date();
    this.status = 'completed';
  }
  
  return this.save();
};

// Soft delete
activitySchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Pre-save middleware
activitySchema.pre('save', async function(next) {
  // Auto-update status based on dates
  if (!this.completed && this.dueDate) {
    const now = new Date();
    if (this.dueDate < now) {
      this.status = 'overdue';
    } else if (this.status === 'overdue' && this.dueDate >= now) {
      this.status = 'pending';
    }
  }
  
  // Set reminder time if not set
  if (this.dueDate && this.reminder && this.reminder.enabled && !this.reminder.reminderTime) {
    // Default: 15 minutes before
    this.reminder.reminderTime = new Date(this.dueDate.getTime() - (15 * 60 * 1000));
  }
  
  // Update lead's total activities count
  if (this.isNew && this.lead) {
    const Lead = mongoose.model('Lead');
    await Lead.findByIdAndUpdate(this.lead, {
      $inc: { totalActivities: 1 },
      lastContactDate: new Date()
    });
  }
  
  next();
});

// Post-save middleware for follow-ups
activitySchema.post('save', async function(doc) {
  // Create follow-up activity if needed
  if (doc.requiresFollowUp && doc.followUpDate && !doc.followUpCreated) {
    const followUpActivity = new this.constructor({
      title: `Follow-up: ${doc.title}`,
      titleAr: doc.titleAr ? `متابعة: ${doc.titleAr}` : undefined,
      description: `Follow-up activity for: ${doc.title}`,
      type: 'follow-up',
      category: doc.category,
      lead: doc.lead,
      assignedTo: doc.assignedTo,
      assignedBy: doc.assignedBy,
      dueDate: doc.followUpDate,
      priority: doc.priority,
      isFollowUp: true,
      followUpFrom: doc._id
    });
    
    await followUpActivity.save();
    
    // Mark follow-up as created
    doc.followUpCreated = true;
    await doc.save();
  }
});

// Static methods

// Get overdue activities
activitySchema.statics.getOverdueActivities = function(assignedTo = null) {
  const query = {
    isDeleted: false,
    completed: false,
    dueDate: { $lt: new Date() },
    status: { $ne: 'cancelled' }
  };
  
  if (assignedTo) query.assignedTo = assignedTo;
  
  return this.find(query)
    .populate('lead', 'firstName lastName company.nameEn')
    .populate('assignedTo', 'name email')
    .sort('dueDate');
};

// Get upcoming activities
activitySchema.statics.getUpcomingActivities = function(days = 7, assignedTo = null) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const query = {
    isDeleted: false,
    completed: false,
    dueDate: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled', 'completed'] }
  };
  
  if (assignedTo) query.assignedTo = assignedTo;
  
  return this.find(query)
    .populate('lead', 'firstName lastName company.nameEn')
    .populate('assignedTo', 'name email')
    .sort('dueDate');
};

// Get activities needing reminders
activitySchema.statics.getActivitiesForReminders = function() {
  const now = new Date();
  
  return this.find({
    isDeleted: false,
    completed: false,
    'reminder.enabled': true,
    'reminder.reminderSent': false,
    'reminder.reminderTime': { $lte: now },
    status: { $nin: ['cancelled', 'completed'] }
  })
  .populate('lead', 'firstName lastName email')
  .populate('assignedTo', 'name email');
};

// Get activity statistics
activitySchema.statics.getStatistics = async function(filters = {}) {
  const match = { isDeleted: false };
  
  if (filters.assignedTo) match.assignedTo = filters.assignedTo;
  if (filters.startDate) match.createdAt = { $gte: filters.startDate };
  if (filters.endDate) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = filters.endDate;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$completed', false] },
                  { $lt: ['$dueDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        byType: {
          $push: '$type'
        },
        byStatus: {
          $push: '$status'
        },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $eq: ['$completed', true] },
              { $subtract: ['$completedDate', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    completed: 0,
    overdue: 0,
    byType: [],
    byStatus: [],
    avgCompletionTime: 0
  };
};

module.exports = mongoose.model('Activity', activitySchema);