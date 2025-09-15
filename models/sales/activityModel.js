const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead reference is required']
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'task'],
    required: [true, 'Activity type is required']
  },
  subject: {
    type: String,
    required: [true, 'Activity subject is required'],
    trim: true,
    maxLength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  outcome: {
    type: String,
    enum: ['success', 'failed', 'rescheduled', 'pending', 'not_applicable'],
    default: 'pending'
  },
  duration: {
    type: Number, // Duration in minutes
    min: [0, 'Duration cannot be negative']
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  nextFollowUp: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Activity must be assigned to a user']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  // Integration fields
  externalId: String, // For calendar/email integration
  meetingLink: String, // Zoom, Teams, etc.
  
}, {
  timestamps: true
});

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
