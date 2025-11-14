const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // Basic Information
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    profileImage: {
      type: String,
    },

    // Employment Details
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    position: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'],
      required: true,
      default: 'full_time',
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_leave', 'terminated', 'resigned', 'suspended'],
      default: 'active',
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    probationEndDate: {
      type: Date,
    },
    confirmationDate: {
      type: Date,
    },
    terminationDate: {
      type: Date,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },

    // Compensation
    salary: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      paymentFrequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'monthly',
      },
    },

    // Work Schedule
    workSchedule: {
      type: {
        type: String,
        enum: ['fixed', 'flexible', 'shift', 'remote'],
        default: 'fixed',
      },
      hoursPerDay: {
        type: Number,
        default: 8,
      },
      daysPerWeek: {
        type: Number,
        default: 5,
      },
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      startTime: {
        type: String, // e.g., "09:00"
      },
      endTime: {
        type: String, // e.g., "17:00"
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },

    // Leave Balances
    leaveBalances: {
      annual: {
        type: Number,
        default: 0,
      },
      sick: {
        type: Number,
        default: 0,
      },
      casual: {
        type: Number,
        default: 0,
      },
      unpaid: {
        type: Number,
        default: 0,
      },
      carryForward: {
        type: Number,
        default: 0,
      },
    },

    // Contact Information
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },

    // Documents
    documents: [
      {
        type: {
          type: String,
          enum: ['resume', 'id_proof', 'address_proof', 'education', 'experience', 'contract', 'other'],
        },
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Skills and Qualifications
    skills: [
      {
        name: String,
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        field: String,
        startDate: Date,
        endDate: Date,
        current: {
          type: Boolean,
          default: false,
        },
      },
    ],
    certifications: [
      {
        name: String,
        issuingOrganization: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
      },
    ],

    // Performance & Notes
    performanceRatings: [
      {
        period: String,
        rating: Number,
        reviewDate: Date,
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        comments: String,
      },
    ],
    notes: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        private: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // System Fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ manager: 1 });
employeeSchema.index({ isDeleted: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  const now = new Date();
  const joining = new Date(this.joiningDate);
  return Math.floor((now - joining) / (1000 * 60 * 60 * 24 * 365));
});

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Query middleware to exclude soft-deleted documents
employeeSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
employeeSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.employmentStatus = 'terminated';
  this.terminationDate = new Date();
  return this.save();
};

employeeSchema.methods.addNote = function (content, createdBy, isPrivate = true) {
  this.notes.push({
    content,
    createdBy,
    private: isPrivate,
    createdAt: new Date(),
  });
  return this.save();
};

employeeSchema.methods.updateLeaveBalance = function (leaveType, amount) {
  if (this.leaveBalances[leaveType] !== undefined) {
    this.leaveBalances[leaveType] += amount;
  }
  return this.save();
};

employeeSchema.methods.addPerformanceRating = function (rating, reviewer, comments, period) {
  this.performanceRatings.push({
    rating,
    reviewer,
    comments,
    period,
    reviewDate: new Date(),
  });
  return this.save();
};

// Ensure virtual fields are included when converting to JSON
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
