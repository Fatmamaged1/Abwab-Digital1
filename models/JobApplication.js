const mongoose = require('mongoose');

const path = require('path');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');

const jobApplicationSchema = new mongoose.Schema({
  // Reference to the job posting
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career',
    required: true
  },
  
  // Applicant information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Application documents
  resume: {
    type: String,
    required: [true, 'Resume is required']
  },
  coverLetter: {
    type: String
  },
  
  // Professional links
  portfolioUrl: String,
  linkedinUrl: String,
  githubUrl: String,
  
  // Additional info
  availableStartDate: Date,
  salaryExpectations: String,
  
  // Custom fields for additional questions
  customFields: [{
    fieldId: String,
    label: String,
    value: mongoose.Schema.Types.Mixed
  }],
  
  // Application status
  status: {
    type: String,
    enum: Object.values(APPLICATION_STATUS),
    default: APPLICATION_STATUS.SUBMITTED
  },
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Application score and matching
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  matchingPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Application source tracking
  source: {
    type: String,
    enum: ['career_portal', 'linkedin', 'indeed', 'referral', 'agency', 'other'],
    default: 'career_portal'
  },
  referral: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  
  // Application review
  reviewerNotes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Interview tracking
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'final'],
      required: true
    },
    scheduledAt: Date,
    completedAt: Date,
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  }],
  
  // Internal notes
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit fields
  ipAddress: String,
  userAgent: String
}, { 
  discriminatorKey: 'contentType',
  timestamps: true 
});
jobApplicationSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = `${this.fullName}-${Date.now()}`;
  }
  next();
});

// Create a compound index for job and email to prevent duplicate applications
jobApplicationSchema.index({ job: 1, email: 1 }, { unique: true });
jobApplicationSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Create the JobApplication model by extending BaseModel
const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;
