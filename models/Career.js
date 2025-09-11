const mongoose = require('mongoose');
const slugify = require('slugify');
const BaseModel = require('./BaseModel');


const careerSchema = new mongoose.Schema({
  // Job details
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    enum: ['engineering', 'design', 'marketing', 'sales', 'support', 'hr', 'operations', 'other']
  },
  
  // Job type and location
  jobType: {
    type: String,
    required: true,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance']
  },
  workType: {
    type: String,
    required: true,
    enum: ['on-site', 'hybrid', 'remote']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  
  // Experience level
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    required: true
  },
  
  // Skills and qualifications
  requiredSkills: [{
    type: String,
    trim: true
  }],
  preferredSkills: [{
    type: String,
    trim: true
  }],
  
  // Salary information
  salary: {
    min: {
      type: Number,
      required: false,
      min: 0
    },
    max: {
      type: Number,
      required: false,
      validate: {
        validator: function(v) {
          return v >= this.salary.min;
        },
        message: 'Max salary must be greater than or equal to min salary'
      }
    },
    currency: {
      type: String,
      default: 'SAR',
      uppercase: true,
      enum: ['USD', 'AED', 'EGP', 'SAR']
    },
    period: {
      type: String,
      enum: ['hour', 'day', 'week', 'month', 'year'],
      default: 'month'
    },
    isNegotiable: {
      type: Boolean,
      default: false
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  
  // Job description and requirements
  description: String,
  requirements: String,
  responsibilities: String,
  benefits: String,
  
  // Application details
  applicationDeadline: {
    type: Date,
    required: true
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft'
  },
  
  // Metadata
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication'
  }],
  
  // Hiring manager
  hiringManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // SEO fields
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  }
}, { 
  discriminatorKey: 'contentType',
  timestamps: true 
});

// Create a compound index for slug and language
careerSchema.index({ slug: 1, language: 1 ,required: false}, { unique: true });

// Index for status and application deadline
careerSchema.index({ status: 1, applicationDeadline: 1 });

// Text index for search
careerSchema.index({
  title: 'text',
  description: 'text',
  requirements: 'text',
  responsibilities: 'text',
  location: 'text',
  department: 'text',
  'seo.metaTitle': 'text',
  'seo.metaDescription': 'text'
});

// Virtual for checking if job is active
careerSchema.virtual('isActive').get(function() {
  return this.status === 'published' && 
         (!this.applicationDeadline || this.applicationDeadline >= new Date());
});

// Create the Career model by extending BaseModel
const Career = BaseModel.discriminator('Career', careerSchema);

module.exports = Career;
