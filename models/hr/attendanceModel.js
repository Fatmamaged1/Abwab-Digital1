const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'],
      required: true,
      default: 'absent',
    },

    // Clock In/Out Times
    clockIn: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      ipAddress: String,
      device: String,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'web', 'mobile', 'rfid'],
        default: 'web',
      },
    },
    clockOut: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      ipAddress: String,
      device: String,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'web', 'mobile', 'rfid'],
        default: 'web',
      },
    },

    // Break Times
    breaks: [
      {
        breakIn: Date,
        breakOut: Date,
        duration: Number, // in minutes
        type: {
          type: String,
          enum: ['lunch', 'tea', 'other'],
          default: 'other',
        },
        notes: String,
      },
    ],

    // Calculated Fields
    totalHours: {
      type: Number, // in hours
      default: 0,
    },
    breakHours: {
      type: Number, // in hours
      default: 0,
    },
    workHours: {
      type: Number, // in hours (totalHours - breakHours)
      default: 0,
    },
    overtime: {
      hours: {
        type: Number,
        default: 0,
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    // Late/Early indicators
    lateBy: {
      type: Number, // in minutes
      default: 0,
    },
    earlyLeave: {
      type: Number, // in minutes
      default: 0,
    },

    // Notes and Remarks
    notes: {
      type: String,
    },
    remarks: {
      type: String,
    },

    // Leave reference if on leave
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave',
    },

    // Approval workflow
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
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
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ employee: 1 });
attendanceSchema.index({ isDeleted: 1 });

// Pre-save middleware to calculate hours
attendanceSchema.pre('save', function (next) {
  // Calculate total hours
  if (this.clockIn?.time && this.clockOut?.time) {
    const diff = this.clockOut.time - this.clockIn.time;
    this.totalHours = diff / (1000 * 60 * 60); // Convert to hours

    // Calculate break hours
    this.breakHours = this.breaks.reduce((total, brk) => {
      if (brk.breakIn && brk.breakOut) {
        const breakDiff = (brk.breakOut - brk.breakIn) / (1000 * 60 * 60);
        return total + breakDiff;
      }
      return total;
    }, 0);

    // Calculate work hours
    this.workHours = this.totalHours - this.breakHours;
  }

  // Calculate late by (if clock in is after expected start time)
  // This would require employee's work schedule - simplified here
  if (this.clockIn?.time) {
    const clockInHour = this.clockIn.time.getHours();
    const clockInMinute = this.clockIn.time.getMinutes();
    const expectedStartHour = 9; // Assuming 9 AM start
    const expectedStartMinute = 0;

    if (clockInHour > expectedStartHour || (clockInHour === expectedStartHour && clockInMinute > expectedStartMinute)) {
      this.lateBy = (clockInHour - expectedStartHour) * 60 + (clockInMinute - expectedStartMinute);
    }
  }

  // Update status based on clock in/out
  if (this.clockIn?.time && !this.clockOut?.time) {
    this.status = 'present';
  } else if (this.clockIn?.time && this.clockOut?.time) {
    if (this.workHours >= 4 && this.workHours < 8) {
      this.status = 'half_day';
    } else if (this.workHours >= 8) {
      this.status = this.lateBy > 0 ? 'late' : 'present';
    }
  }

  next();
});

// Query middleware to exclude soft-deleted documents
attendanceSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
attendanceSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save();
};

attendanceSchema.methods.clockInEmployee = function (location, ipAddress, device, method = 'web') {
  this.clockIn = {
    time: new Date(),
    location,
    ipAddress,
    device,
    method,
  };
  this.status = 'present';
  return this.save();
};

attendanceSchema.methods.clockOutEmployee = function (location, ipAddress, device, method = 'web') {
  this.clockOut = {
    time: new Date(),
    location,
    ipAddress,
    device,
    method,
  };
  return this.save();
};

attendanceSchema.methods.addBreak = function (type = 'other', notes = '') {
  this.breaks.push({
    breakIn: new Date(),
    type,
    notes,
  });
  return this.save();
};

attendanceSchema.methods.endBreak = async function () {
  const lastBreak = this.breaks[this.breaks.length - 1];
  if (lastBreak && !lastBreak.breakOut) {
    lastBreak.breakOut = new Date();
    const diff = (lastBreak.breakOut - lastBreak.breakIn) / (1000 * 60);
    lastBreak.duration = diff;
    return this.save();
  }
  throw new Error('No active break found');
};

// Static methods
attendanceSchema.statics.getEmployeeAttendanceForMonth = async function (employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

attendanceSchema.statics.getAttendanceStats = async function (employeeId, startDate, endDate) {
  const attendance = await this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  const stats = {
    total: attendance.length,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
    totalWorkHours: 0,
    averageWorkHours: 0,
  };

  attendance.forEach((record) => {
    stats.totalWorkHours += record.workHours || 0;
    switch (record.status) {
      case 'present':
        stats.present++;
        break;
      case 'absent':
        stats.absent++;
        break;
      case 'late':
        stats.late++;
        stats.present++;
        break;
      case 'half_day':
        stats.halfDay++;
        break;
      case 'on_leave':
        stats.onLeave++;
        break;
    }
  });

  stats.averageWorkHours = stats.total > 0 ? stats.totalWorkHours / stats.total : 0;

  return stats;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
