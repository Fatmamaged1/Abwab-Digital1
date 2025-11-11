const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Project/Task association (links to Agile module)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserStory',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },

    // Time tracking
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in hours
      default: 0,
    },

    // Activity details
    activityType: {
      type: String,
      enum: [
        'development',
        'testing',
        'review',
        'meeting',
        'documentation',
        'bug_fixing',
        'deployment',
        'support',
        'research',
        'planning',
        'other',
      ],
      default: 'development',
    },
    description: {
      type: String,
      required: true,
    },

    // Billing
    billable: {
      type: Boolean,
      default: true,
    },
    billingRate: {
      type: Number,
      default: 0,
    },
    billingAmount: {
      type: Number,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'invoiced'],
      default: 'draft',
    },

    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },

    // Tags for categorization
    tags: [String],

    // Notes
    notes: {
      type: String,
    },

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
timeLogSchema.index({ employee: 1, date: 1 });
timeLogSchema.index({ project: 1 });
timeLogSchema.index({ sprint: 1 });
timeLogSchema.index({ story: 1 });
timeLogSchema.index({ status: 1 });
timeLogSchema.index({ billable: 1 });
timeLogSchema.index({ isDeleted: 1 });

// Pre-save middleware to calculate duration and billing
timeLogSchema.pre('save', function (next) {
  // Calculate duration if endTime is set
  if (this.startTime && this.endTime) {
    const diff = this.endTime - this.startTime;
    this.duration = diff / (1000 * 60 * 60); // Convert to hours
  }

  // Calculate billing amount
  if (this.billable && this.duration && this.billingRate) {
    this.billingAmount = this.duration * this.billingRate;
  }

  next();
});

// Query middleware to exclude soft-deleted documents
timeLogSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
timeLogSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save();
};

timeLogSchema.methods.stopTimer = function () {
  this.endTime = new Date();
  return this.save();
};

timeLogSchema.methods.submit = function () {
  this.status = 'submitted';
  return this.save();
};

timeLogSchema.methods.approve = async function (approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

timeLogSchema.methods.reject = async function (rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Static methods
timeLogSchema.statics.getEmployeeTimeLogsForPeriod = async function (employeeId, startDate, endDate) {
  return this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate('project', 'name code')
    .populate('sprint', 'name')
    .populate('story', 'storyNumber title')
    .sort({ date: -1, startTime: -1 });
};

timeLogSchema.statics.getProjectTimeStats = async function (projectId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId(projectId),
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['approved', 'invoiced'] },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$duration' },
        billableHours: {
          $sum: {
            $cond: ['$billable', '$duration', 0],
          },
        },
        totalAmount: { $sum: '$billingAmount' },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : { totalHours: 0, billableHours: 0, totalAmount: 0 };
};

timeLogSchema.statics.getEmployeeTimeStats = async function (employeeId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$activityType',
        totalHours: { $sum: '$duration' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate total
  const total = stats.reduce((acc, item) => acc + item.totalHours, 0);

  return {
    byActivity: stats,
    totalHours: total,
  };
};

timeLogSchema.statics.getTeamUtilization = async function (employeeIds, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        employee: { $in: employeeIds.map((id) => mongoose.Types.ObjectId(id)) },
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['approved', 'invoiced'] },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$employee',
        totalHours: { $sum: '$duration' },
        billableHours: {
          $sum: {
            $cond: ['$billable', '$duration', 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employee',
      },
    },
    {
      $unwind: '$employee',
    },
    {
      $project: {
        employeeId: '$_id',
        employeeName: {
          $concat: ['$employee.firstName', ' ', '$employee.lastName'],
        },
        totalHours: 1,
        billableHours: 1,
        utilizationRate: {
          $multiply: [
            { $divide: ['$billableHours', '$totalHours'] },
            100,
          ],
        },
      },
    },
  ]);

  return stats;
};

timeLogSchema.statics.getWeeklyTimeReport = async function (employeeId, weekStartDate) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const timeLogs = await this.find({
    employee: employeeId,
    date: { $gte: weekStartDate, $lte: weekEndDate },
  })
    .populate('project', 'name code')
    .sort({ date: 1, startTime: 1 });

  // Group by day
  const dailyHours = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyHours[dateStr] = 0;
  }

  timeLogs.forEach((log) => {
    const dateStr = log.date.toISOString().split('T')[0];
    if (dailyHours[dateStr] !== undefined) {
      dailyHours[dateStr] += log.duration;
    }
  });

  const totalHours = Object.values(dailyHours).reduce((acc, hours) => acc + hours, 0);

  return {
    weekStartDate,
    weekEndDate,
    dailyHours,
    totalHours,
    timeLogs,
  };
};

const TimeLog = mongoose.model('TimeLog', timeLogSchema);

module.exports = TimeLog;
