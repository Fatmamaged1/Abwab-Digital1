const mongoose = require('mongoose');

const payrollAutomationSchema = new mongoose.Schema({
  payrollNumber: {
    type: String,
    unique: true,
    // Auto-generated: PAY2025000001
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
    index: true,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    index: true,
  },
  hijriMonth: {
    type: String,
    description: 'Hijri month name',
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'processed', 'paid', 'cancelled'],
    default: 'draft',
    index: true,
  },
  employees: [
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeModel',
        required: true,
      },
      // Basic Salary Components
      basicSalary: {
        type: Number,
        required: true,
        min: 0,
      },
      allowances: {
        housing: {
          type: Number,
          default: 0,
          min: 0,
        },
        transport: {
          type: Number,
          default: 0,
          min: 0,
        },
        food: {
          type: Number,
          default: 0,
          min: 0,
        },
        mobile: {
          type: Number,
          default: 0,
          min: 0,
        },
        other: {
          type: Number,
          default: 0,
          min: 0,
        },
        total: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Earnings
      earnings: {
        overtime: {
          hours: {
            type: Number,
            default: 0,
            min: 0,
          },
          rate: {
            type: Number,
            default: 0,
            min: 0,
          },
          amount: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
        bonus: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Performance bonus, project bonus, etc.',
        },
        commission: {
          type: Number,
          default: 0,
          min: 0,
        },
        backpay: {
          type: Number,
          default: 0,
          description: 'Arrears or salary adjustments',
        },
        other: {
          type: Number,
          default: 0,
          min: 0,
        },
        total: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Deductions
      deductions: {
        // GOSI (Saudi Social Security)
        gosi: {
          employeeContribution: {
            type: Number,
            default: 0,
            min: 0,
            description: '9.75% of basic salary',
          },
          employerContribution: {
            type: Number,
            default: 0,
            min: 0,
            description: '12.00% of basic salary',
          },
        },
        absence: {
          days: {
            type: Number,
            default: 0,
            min: 0,
          },
          amount: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
        loans: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Loan deduction installments',
        },
        advances: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Salary advances',
        },
        penalties: {
          type: Number,
          default: 0,
          min: 0,
        },
        other: {
          type: Number,
          default: 0,
          min: 0,
        },
        total: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Attendance
      attendance: {
        workingDays: {
          type: Number,
          required: true,
          min: 0,
        },
        presentDays: {
          type: Number,
          required: true,
          min: 0,
        },
        absentDays: {
          type: Number,
          default: 0,
          min: 0,
        },
        leaveDays: {
          paid: {
            type: Number,
            default: 0,
            min: 0,
          },
          unpaid: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
        overtimeHours: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Totals
      grossSalary: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Basic + Allowances + Earnings',
      },
      totalDeductions: {
        type: Number,
        default: 0,
        min: 0,
      },
      netSalary: {
        type: Number,
        default: 0,
        description: 'Gross - Deductions',
      },
      // Payment Details
      paymentMethod: {
        type: String,
        enum: ['bank-transfer', 'cash', 'cheque'],
        default: 'bank-transfer',
      },
      bankAccount: {
        bankName: String,
        accountNumber: String,
        iban: String,
      },
      paymentDate: Date,
      paymentReference: String,
      // Status
      paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'on-hold'],
        default: 'pending',
      },
      notes: String,
    },
  ],
  // Summary
  summary: {
    totalEmployees: {
      type: Number,
      default: 0,
    },
    totalGrossSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalNetSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGOSIEmployee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGOSIEmployer: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOvertimePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  // Accounting Integration
  journalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    description: 'Linked journal entry for accounting',
  },
  accountingEntries: [
    {
      account: String,
      debit: {
        type: Number,
        default: 0,
        min: 0,
      },
      credit: {
        type: Number,
        default: 0,
        min: 0,
      },
      description: String,
    },
  ],
  // Approval Workflow
  approvals: [
    {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['hr-manager', 'finance-manager', 'ceo'],
      },
      approvedAt: Date,
      comments: String,
    },
  ],
  // Metadata
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paidAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-generate payroll number
payrollAutomationSchema.pre('save', async function (next) {
  if (!this.payrollNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      payrollNumber: new RegExp(`^PAY${year}`),
    });
    this.payrollNumber = `PAY${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate for each employee
  this.employees.forEach((emp) => {
    // Calculate total allowances
    emp.allowances.total =
      emp.allowances.housing +
      emp.allowances.transport +
      emp.allowances.food +
      emp.allowances.mobile +
      emp.allowances.other;

    // Calculate overtime amount
    if (emp.earnings.overtime.hours > 0 && emp.earnings.overtime.rate > 0) {
      emp.earnings.overtime.amount = emp.earnings.overtime.hours * emp.earnings.overtime.rate;
    }

    // Calculate total earnings
    emp.earnings.total =
      emp.earnings.overtime.amount +
      emp.earnings.bonus +
      emp.earnings.commission +
      emp.earnings.backpay +
      emp.earnings.other;

    // Calculate GOSI (Saudi Social Security)
    // Employee contribution: 9.75% of basic salary
    // Employer contribution: 12.00% of basic salary
    emp.deductions.gosi.employeeContribution = Math.round(emp.basicSalary * 0.0975);
    emp.deductions.gosi.employerContribution = Math.round(emp.basicSalary * 0.12);

    // Calculate absence deduction
    if (emp.attendance.absentDays > 0 && emp.attendance.workingDays > 0) {
      const dailyRate = emp.basicSalary / emp.attendance.workingDays;
      emp.deductions.absence.amount = Math.round(dailyRate * emp.attendance.absentDays);
    }

    // Calculate total deductions
    emp.deductions.total =
      emp.deductions.gosi.employeeContribution +
      emp.deductions.absence.amount +
      emp.deductions.loans +
      emp.deductions.advances +
      emp.deductions.penalties +
      emp.deductions.other;

    // Calculate gross salary
    emp.grossSalary = emp.basicSalary + emp.allowances.total + emp.earnings.total;

    // Calculate net salary
    emp.netSalary = emp.grossSalary - emp.deductions.total;
  });

  // Calculate summary
  this.summary.totalEmployees = this.employees.length;

  this.summary.totalGrossSalary = this.employees.reduce((sum, emp) => sum + emp.grossSalary, 0);

  this.summary.totalDeductions = this.employees.reduce((sum, emp) => sum + emp.deductions.total, 0);

  this.summary.totalNetSalary = this.employees.reduce((sum, emp) => sum + emp.netSalary, 0);

  this.summary.totalGOSIEmployee = this.employees.reduce(
    (sum, emp) => sum + emp.deductions.gosi.employeeContribution,
    0
  );

  this.summary.totalGOSIEmployer = this.employees.reduce(
    (sum, emp) => sum + emp.deductions.gosi.employerContribution,
    0
  );

  this.summary.totalOvertimePaid = this.employees.reduce(
    (sum, emp) => sum + emp.earnings.overtime.amount,
    0
  );

  this.summary.totalBonuses = this.employees.reduce((sum, emp) => sum + emp.earnings.bonus, 0);

  // Generate accounting entries
  if (this.status === 'approved' || this.status === 'processed') {
    this.accountingEntries = [
      // Debit: Salary Expense
      {
        account: 'Salary Expense',
        debit: this.summary.totalGrossSalary,
        credit: 0,
        description: `Payroll for ${this.month}/${this.year}`,
      },
      // Debit: GOSI Expense (Employer Contribution)
      {
        account: 'GOSI Expense',
        debit: this.summary.totalGOSIEmployer,
        credit: 0,
        description: `Employer GOSI contribution for ${this.month}/${this.year}`,
      },
      // Credit: GOSI Payable
      {
        account: 'GOSI Payable',
        debit: 0,
        credit: this.summary.totalGOSIEmployee + this.summary.totalGOSIEmployer,
        description: `Total GOSI payable for ${this.month}/${this.year}`,
      },
      // Credit: Salaries Payable
      {
        account: 'Salaries Payable',
        debit: 0,
        credit: this.summary.totalNetSalary,
        description: `Net salaries payable for ${this.month}/${this.year}`,
      },
    ];
  }

  next();
});

// Compound index for month/year
payrollAutomationSchema.index({ month: 1, year: 1 }, { unique: true });
payrollAutomationSchema.index({ status: 1 });
payrollAutomationSchema.index({ 'employees.employee': 1 });

// Virtual for is approved
payrollAutomationSchema.virtual('isApproved').get(function () {
  return ['approved', 'processed', 'paid'].includes(this.status);
});

// Virtual for approval count
payrollAutomationSchema.virtual('approvalCount').get(function () {
  return this.approvals ? this.approvals.length : 0;
});

// Method to add approval
payrollAutomationSchema.methods.addApproval = function (userId, role, comments) {
  this.approvals.push({
    approvedBy: userId,
    role,
    approvedAt: new Date(),
    comments,
  });

  // Auto-approve if all required approvals received (hr-manager, finance-manager, ceo)
  const requiredRoles = ['hr-manager', 'finance-manager', 'ceo'];
  const approvedRoles = this.approvals.map((a) => a.role);
  const allApproved = requiredRoles.every((role) => approvedRoles.includes(role));

  if (allApproved && this.status === 'calculated') {
    this.status = 'approved';
  }
};

// Method to process payroll
payrollAutomationSchema.methods.processPayroll = function (userId) {
  if (this.status !== 'approved') {
    throw new Error('Payroll must be approved before processing');
  }

  this.status = 'processed';
  this.processedAt = new Date();
  this.processedBy = userId;

  // Set all employees to processing
  this.employees.forEach((emp) => {
    emp.paymentStatus = 'processing';
  });
};

// Method to mark as paid
payrollAutomationSchema.methods.markAsPaid = function () {
  this.status = 'paid';
  this.paidAt = new Date();

  // Set all employees to paid
  this.employees.forEach((emp) => {
    emp.paymentStatus = 'paid';
    emp.paymentDate = new Date();
  });
};

// Method to get employee payslip
payrollAutomationSchema.methods.getEmployeePayslip = function (employeeId) {
  const employeeData = this.employees.find((e) => e.employee.toString() === employeeId.toString());

  if (!employeeData) return null;

  return {
    payrollNumber: this.payrollNumber,
    month: this.month,
    year: this.year,
    employee: employeeData,
    companyInfo: {
      name: 'Abwab Digital',
      // Add company details
    },
  };
};

// Static method to get payroll summary
payrollAutomationSchema.statics.getPayrollSummary = async function (year) {
  const payrolls = await this.find({ year, status: { $in: ['processed', 'paid'] } }).sort({
    month: 1,
  });

  return {
    year,
    totalMonths: payrolls.length,
    totalSalariesPaid: payrolls.reduce((sum, p) => sum + p.summary.totalNetSalary, 0),
    totalGOSI: payrolls.reduce(
      (sum, p) => sum + p.summary.totalGOSIEmployee + p.summary.totalGOSIEmployer,
      0
    ),
    totalBonuses: payrolls.reduce((sum, p) => sum + p.summary.totalBonuses, 0),
    totalOvertime: payrolls.reduce((sum, p) => sum + p.summary.totalOvertimePaid, 0),
    monthlyBreakdown: payrolls.map((p) => ({
      month: p.month,
      employees: p.summary.totalEmployees,
      grossSalary: p.summary.totalGrossSalary,
      netSalary: p.summary.totalNetSalary,
      gosi: p.summary.totalGOSIEmployee + p.summary.totalGOSIEmployer,
    })),
  };
};

// Static method to get employee earnings history
payrollAutomationSchema.statics.getEmployeeEarningsHistory = async function (
  employeeId,
  months = 12
) {
  const payrolls = await this.find({
    'employees.employee': employeeId,
    status: { $in: ['processed', 'paid'] },
  })
    .sort({ year: -1, month: -1 })
    .limit(months);

  return payrolls.map((payroll) => {
    const empData = payroll.employees.find((e) => e.employee.toString() === employeeId.toString());
    return {
      month: payroll.month,
      year: payroll.year,
      basicSalary: empData.basicSalary,
      allowances: empData.allowances.total,
      earnings: empData.earnings.total,
      deductions: empData.deductions.total,
      grossSalary: empData.grossSalary,
      netSalary: empData.netSalary,
    };
  });
};

module.exports = mongoose.model('PayrollAutomation', payrollAutomationSchema);
