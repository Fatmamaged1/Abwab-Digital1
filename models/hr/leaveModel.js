const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'compensatory', 'bereavement', 'other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    halfDay: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },

    // Approval workflow
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
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

    // Supporting documents
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Additional information
    emergencyContact: {
      name: String,
      phone: String,
    },
    workHandover: {
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      notes: String,
    },
    notes: {
      type: String,
    },
    adminNotes: {
      type: String,
    },

    // Cancellation
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
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
leaveSchema.index({ employee: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ leaveType: 1 });
leaveSchema.index({ isDeleted: 1 });

// Pre-save middleware to calculate number of days
leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    if (this.halfDay) {
      diffDays = 0.5;
    }

    this.numberOfDays = diffDays;
  }
  next();
});

// Query middleware to exclude soft-deleted documents
leaveSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
leaveSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save();
};

leaveSchema.methods.approve = async function (approvedBy, notes) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (notes) {
    this.adminNotes = notes;
  }
  return this.save();
};

leaveSchema.methods.reject = async function (rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

leaveSchema.methods.cancel = async function (cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Static methods
leaveSchema.statics.getEmployeeLeaveBalance = async function (employeeId, leaveType, year) {
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(employeeId);

  if (!employee) throw new Error('Employee not found');

  // Get total allocated for the year
  const allocated = employee.leaveBalances[leaveType] || 0;

  // Calculate used leaves for this year
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);

  const usedLeaves = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        leaveType,
        status: 'approved',
        startDate: { $gte: startOfYear, $lte: endOfYear },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: '$numberOfDays' },
      },
    },
  ]);

  const used = usedLeaves.length > 0 ? usedLeaves[0].totalDays : 0;
  const remaining = allocated - used;

  return {
    allocated,
    used,
    remaining,
  };
};

leaveSchema.statics.checkLeaveOverlap = async function (employeeId, startDate, endDate, excludeLeaveId = null) {
  const query = {
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      // Leave starts during the period
      {
        startDate: { $gte: startDate, $lte: endDate },
      },
      // Leave ends during the period
      {
        endDate: { $gte: startDate, $lte: endDate },
      },
      // Leave encompasses the entire period
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate },
      },
    ],
  };

  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  const overlappingLeaves = await this.find(query);
  return overlappingLeaves;
};

leaveSchema.statics.getTeamLeaveCalendar = async function (departmentId, startDate, endDate) {
  const Employee = mongoose.model('Employee');

  // Get all employees in department
  const employees = await Employee.find({ department: departmentId });
  const employeeIds = employees.map((emp) => emp._id);

  // Get all leaves for these employees
  const leaves = await this.find({
    employee: { $in: employeeIds },
    status: 'approved',
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
    ],
  }).populate('employee', 'firstName lastName position');

  return leaves;
};

leaveSchema.statics.getLeaveStats = async function (employeeId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);

  const stats = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        status: 'approved',
        startDate: { $gte: startOfYear, $lte: endOfYear },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$numberOfDays' },
        count: { $sum: 1 },
      },
    },
  ]);

  return stats;
};

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
