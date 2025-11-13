const mongoose = require('mongoose');

const capacityPlannerSchema = new mongoose.Schema({
  week: {
    type: Number,
    required: [true, 'Week number is required'],
    min: 1,
    max: 53,
    index: true,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  employees: [
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeModel',
        required: true,
      },
      totalCapacity: {
        type: Number,
        min: 0,
        description: 'Total available hours for the week',
      },
      allocated: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Hours already allocated to projects',
      },
      available: {
        type: Number,
        min: 0,
        description: 'Remaining available hours',
      },
      utilizationRate: {
        type: Number,
        min: 0,
        max: 100,
        description: 'Percentage of capacity utilized',
      },
      projects: [
        {
          project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AgileProject',
          },
          allocatedHours: {
            type: Number,
            min: 0,
          },
          role: String,
          tasks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
          }],
        },
      ],
      leaves: [
        {
          type: {
            type: String,
            enum: ['vacation', 'sick', 'personal', 'public-holiday', 'other'],
          },
          startDate: Date,
          endDate: Date,
          hours: {
            type: Number,
            min: 0,
          },
        },
      ],
      overtime: {
        planned: {
          type: Number,
          default: 0,
          min: 0,
        },
        actual: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      status: {
        type: String,
        enum: ['available', 'fully-booked', 'overloaded', 'on-leave'],
        description: 'Employee capacity status',
      },
      notes: String,
    },
  ],
  departmentSummary: {
    totalCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAllocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAvailable: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageUtilization: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    employeesOverloaded: {
      type: Number,
      default: 0,
    },
    employeesUnderutilized: {
      type: Number,
      default: 0,
    },
  },
  aiRecommendations: [
    {
      type: {
        type: String,
        enum: ['reallocation', 'hiring', 'training', 'overtime', 'deadline-extension'],
        required: true,
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeModel',
      },
      fromProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgileProject',
      },
      toProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgileProject',
      },
      hours: Number,
      reason: {
        type: String,
        required: true,
      },
      impact: {
        type: String,
        description: 'Expected impact of this action',
      },
      priority: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'implemented'],
        default: 'pending',
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save calculations
capacityPlannerSchema.pre('save', function (next) {
  // Calculate employee-level metrics
  this.employees.forEach((emp) => {
    // Calculate allocated hours from projects
    emp.allocated = emp.projects.reduce((sum, proj) => sum + (proj.allocatedHours || 0), 0);

    // Subtract leave hours from capacity
    const leaveHours = emp.leaves.reduce((sum, leave) => sum + (leave.hours || 0), 0);
    const adjustedCapacity = emp.totalCapacity - leaveHours;

    // Calculate available hours
    emp.available = adjustedCapacity - emp.allocated;

    // Calculate utilization rate
    emp.utilizationRate = adjustedCapacity > 0
      ? Math.round((emp.allocated / adjustedCapacity) * 100)
      : 0;

    // Determine status
    if (leaveHours > 0) {
      emp.status = 'on-leave';
    } else if (emp.utilizationRate >= 100) {
      emp.status = 'overloaded';
    } else if (emp.utilizationRate >= 80) {
      emp.status = 'fully-booked';
    } else {
      emp.status = 'available';
    }
  });

  // Calculate department summary
  this.departmentSummary.totalCapacity = this.employees.reduce(
    (sum, emp) => sum + (emp.totalCapacity || 0),
    0
  );

  this.departmentSummary.totalAllocated = this.employees.reduce(
    (sum, emp) => sum + (emp.allocated || 0),
    0
  );

  this.departmentSummary.totalAvailable = this.employees.reduce(
    (sum, emp) => sum + (emp.available || 0),
    0
  );

  this.departmentSummary.averageUtilization = this.employees.length > 0
    ? Math.round(
        this.employees.reduce((sum, emp) => sum + (emp.utilizationRate || 0), 0) /
          this.employees.length
      )
    : 0;

  this.departmentSummary.employeesOverloaded = this.employees.filter(
    (emp) => emp.status === 'overloaded'
  ).length;

  this.departmentSummary.employeesUnderutilized = this.employees.filter(
    (emp) => emp.utilizationRate < 50
  ).length;

  next();
});

// Compound index for week/year
capacityPlannerSchema.index({ week: 1, year: 1 }, { unique: true });
capacityPlannerSchema.index({ 'employees.employee': 1 });

// Virtual for health status
capacityPlannerSchema.virtual('healthStatus').get(function () {
  if (this.departmentSummary.employeesOverloaded > this.employees.length * 0.2) {
    return 'critical'; // More than 20% overloaded
  }
  if (this.departmentSummary.employeesOverloaded > 0) {
    return 'warning';
  }
  if (this.departmentSummary.averageUtilization < 60) {
    return 'underutilized';
  }
  return 'healthy';
});

// Method to get employee capacity
capacityPlannerSchema.methods.getEmployeeCapacity = function (employeeId) {
  return this.employees.find((e) => e.employee.toString() === employeeId.toString());
};

// Method to allocate hours
capacityPlannerSchema.methods.allocateHours = function (employeeId, projectId, hours, role) {
  const employee = this.employees.find((e) => e.employee.toString() === employeeId.toString());

  if (employee) {
    const existingProject = employee.projects.find(
      (p) => p.project.toString() === projectId.toString()
    );

    if (existingProject) {
      existingProject.allocatedHours += hours;
    } else {
      employee.projects.push({
        project: projectId,
        allocatedHours: hours,
        role: role,
      });
    }
  }
};

// Static method to get capacity trends
capacityPlannerSchema.statics.getCapacityTrends = async function (weeks = 4) {
  const plans = await this.find()
    .sort({ year: -1, week: -1 })
    .limit(weeks);

  return {
    weeks: plans.length,
    averageUtilization: plans.length > 0
      ? Math.round(
          plans.reduce((sum, p) => sum + p.departmentSummary.averageUtilization, 0) / plans.length
        )
      : 0,
    trend: this.calculateTrend(plans),
    overloadedTrend: plans.map((p) => ({
      week: p.week,
      year: p.year,
      count: p.departmentSummary.employeesOverloaded,
    })),
  };
};

// Helper method to calculate trend
capacityPlannerSchema.statics.calculateTrend = function (plans) {
  if (plans.length < 2) return 'stable';

  const recent = plans.slice(0, Math.ceil(plans.length / 2));
  const older = plans.slice(Math.ceil(plans.length / 2));

  const recentAvg = recent.reduce((sum, p) => sum + p.departmentSummary.averageUtilization, 0) / recent.length;
  const olderAvg = older.reduce((sum, p) => sum + p.departmentSummary.averageUtilization, 0) / older.length;

  if (recentAvg > olderAvg + 5) return 'increasing';
  if (recentAvg < olderAvg - 5) return 'decreasing';
  return 'stable';
};

module.exports = mongoose.model('CapacityPlanner', capacityPlannerSchema);
