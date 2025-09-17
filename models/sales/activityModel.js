const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead reference is required']
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'task', 'document'],
    required: [true, 'Activity type is required']
  },
  subject: { type: String, trim: true, maxLength: 200 },
  description: { type: String, maxLength: 2000 },

  // 🟢 Call fields
  duration: { type: Number, min: 0 }, // minutes
  notes: String,

  // 🟢 Email fields
  to: String,
  cc: [String],
  bcc: [String],
  content: String,

  // 🟢 Meeting fields
  location: String,
  participants: [String],
  meetingLink: String,

  // 🟢 Reminder
  reminder: {
    type: {
      type: String,
      enum: ['task', 'email', 'call']
    },
    date: Date,
    isSent: { type: Boolean, default: false }
  },

  outcome: {
    type: String,
    enum: ['success', 'failed', 'rescheduled', 'pending', 'not_applicable', 'document_viewed'],
    default: 'pending'
  },

  scheduledDate: Date,
  completedDate: Date,
  nextFollowUp: Date,

  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isCompleted: { type: Boolean, default: false },

  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],

  // Integration fields
  externalId: String,
}, { timestamps: true });

// Indexes
activitySchema.index({ lead: 1 });
activitySchema.index({ assignedTo: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ outcome: 1 });
activitySchema.index({ nextFollowUp: 1 });
activitySchema.index({ createdAt: -1 });

// Pre-save middleware
activitySchema.pre('save', function(next) {
  if (this.isCompleted && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
