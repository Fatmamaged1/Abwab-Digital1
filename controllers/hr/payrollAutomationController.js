const PayrollAutomation = require('../../models/hr/payrollAutomationModel');
const AIService = require('../../services/aiService');

// @desc    Get all payroll records
// @route   GET /api/v1/hr/payroll
// @access  Private
exports.getAllPayroll = async (req, res) => {
  try {
    const { employee, status, year, month, page = 1, limit = 20 } = req.query;
    const query = {};

    if (employee) query.employee = employee;
    if (status) query.status = status;
    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);

    const payrolls = await PayrollAutomation.find(query)
      .populate('employee', 'name email department position employeeId')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PayrollAutomation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll records',
      error: error.message
    });
  }
};

// @desc    Get single payroll record
// @route   GET /api/v1/hr/payroll/:id
// @access  Private
exports.getPayroll = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id)
      .populate('employee', 'name email department position employeeId avatar')
      .populate('processedBy', 'name email avatar')
      .populate('approvedBy', 'name email avatar');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll record',
      error: error.message
    });
  }
};

// @desc    Get payroll by employee and period
// @route   GET /api/v1/hr/payroll/employee/:employeeId/period/:year/:month
// @access  Private
exports.getPayrollByEmployeeAndPeriod = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;

    const payroll = await PayrollAutomation.findOne({
      employee: employeeId,
      'period.year': parseInt(year),
      'period.month': parseInt(month)
    })
      .populate('employee', 'name email department position')
      .populate('processedBy', 'name email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found for this period'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll record',
      error: error.message
    });
  }
};

// @desc    Create payroll record
// @route   POST /api/v1/hr/payroll
// @access  Private
exports.createPayroll = async (req, res) => {
  try {
    const payrollData = {
      ...req.body,
      processedBy: req.user._id
    };

    const payroll = await PayrollAutomation.create(payrollData);

    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll record created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payroll record',
      error: error.message
    });
  }
};

// @desc    Auto-calculate payroll for employee
// @route   POST /api/v1/hr/payroll/auto-calculate
// @access  Private
exports.autoCalculatePayroll = async (req, res) => {
  try {
    const { employeeId, year, month } = req.body;

    if (!employeeId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, year, and month are required'
      });
    }

    // Check if payroll already exists for this period
    const existingPayroll = await PayrollAutomation.findOne({
      employee: employeeId,
      'period.year': parseInt(year),
      'period.month': parseInt(month)
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this period'
      });
    }

    // Get employee data
    const Employee = require('../../models/hr/employeeModel');
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get attendance/timesheet data for working days
    const Attendance = require('../../models/hr/attendanceModel');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate working days and hours
    const totalWorkingDays = attendanceRecords.filter(a => a.status === 'present').length;
    const totalHoursWorked = attendanceRecords.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const absences = attendanceRecords.filter(a => a.status === 'absent').length;

    // Get base salary from employee record
    const baseSalary = employee.salary || 0;

    // Calculate allowances (example structure)
    const allowances = [
      { type: 'housing', amount: baseSalary * 0.25 },
      { type: 'transportation', amount: 500 },
      { type: 'phone', amount: 200 }
    ];

    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);

    // Calculate overtime pay (1.5x hourly rate)
    const hourlyRate = baseSalary / 160; // Assuming 160 working hours per month
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    // Calculate bonuses (can be fetched from performance or other sources)
    const bonuses = [];
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

    // Calculate deductions
    const deductions = [];

    // GOSI (Saudi Social Insurance) - 10% employee share
    const gosiDeduction = baseSalary * 0.10;
    deductions.push({ type: 'GOSI', amount: gosiDeduction });

    // Absence deduction
    if (absences > 0) {
      const absenceDeduction = (baseSalary / 30) * absences;
      deductions.push({ type: 'absence', amount: absenceDeduction });
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Calculate gross and net salary
    const grossSalary = baseSalary + totalAllowances + overtimePay + totalBonuses;
    const netSalary = grossSalary - totalDeductions;

    // Create payroll record
    const payroll = await PayrollAutomation.create({
      employee: employeeId,
      period: {
        month: parseInt(month),
        year: parseInt(year)
      },
      baseSalary,
      allowances,
      totalAllowances,
      overtime: {
        hours: overtimeHours,
        rate: hourlyRate * 1.5,
        amount: overtimePay
      },
      bonuses,
      totalBonuses,
      deductions,
      totalDeductions,
      grossSalary,
      netSalary,
      workingDays: {
        scheduled: endDate.getDate(),
        worked: totalWorkingDays,
        absent: absences
      },
      status: 'pending',
      processedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll auto-calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error auto-calculating payroll',
      error: error.message
    });
  }
};

// @desc    Bulk calculate payroll for department/all employees
// @route   POST /api/v1/hr/payroll/bulk-calculate
// @access  Private
exports.bulkCalculatePayroll = async (req, res) => {
  try {
    const { department, year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    // Get employees
    const Employee = require('../../models/hr/employeeModel');
    const query = { status: 'active' };
    if (department) query.department = department;

    const employees = await Employee.find(query);

    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await PayrollAutomation.findOne({
          employee: employee._id,
          'period.year': parseInt(year),
          'period.month': parseInt(month)
        });

        if (existingPayroll) {
          errors.push({
            employeeId: employee._id,
            name: employee.name,
            error: 'Payroll already exists for this period'
          });
          continue;
        }

        // Auto-calculate (simplified version - you can call the full auto-calculate logic)
        const baseSalary = employee.salary || 0;
        const allowances = [
          { type: 'housing', amount: baseSalary * 0.25 },
          { type: 'transportation', amount: 500 }
        ];
        const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
        const gosiDeduction = baseSalary * 0.10;
        const deductions = [{ type: 'GOSI', amount: gosiDeduction }];
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        const grossSalary = baseSalary + totalAllowances;
        const netSalary = grossSalary - totalDeductions;

        const payroll = await PayrollAutomation.create({
          employee: employee._id,
          period: { month: parseInt(month), year: parseInt(year) },
          baseSalary,
          allowances,
          totalAllowances,
          deductions,
          totalDeductions,
          grossSalary,
          netSalary,
          status: 'pending',
          processedBy: req.user._id
        });

        results.push({
          employeeId: employee._id,
          name: employee.name,
          netSalary,
          success: true
        });
      } catch (error) {
        errors.push({
          employeeId: employee._id,
          name: employee.name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors
      },
      message: `Bulk payroll calculation completed. ${results.length} processed, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk calculating payroll',
      error: error.message
    });
  }
};

// @desc    Update payroll record
// @route   PUT /api/v1/hr/payroll/:id
// @access  Private
exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        payroll[key] = req.body[key];
      }
    });

    await payroll.save();

    res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payroll record updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payroll record',
      error: error.message
    });
  }
};

// @desc    Approve payroll
// @route   PUT /api/v1/hr/payroll/:id/approve
// @access  Private
exports.approvePayroll = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payroll can be approved'
      });
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();

    await payroll.save();

    res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving payroll',
      error: error.message
    });
  }
};

// @desc    Process payment
// @route   PUT /api/v1/hr/payroll/:id/process-payment
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved payroll can be processed'
      });
    }

    const { paymentMethod, transactionReference } = req.body;

    payroll.status = 'paid';
    payroll.paymentDetails = {
      method: paymentMethod || 'bank_transfer',
      paidDate: new Date(),
      transactionReference: transactionReference || `TXN${Date.now()}`
    };

    await payroll.save();

    res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// @desc    Generate payslip
// @route   GET /api/v1/hr/payroll/:id/payslip
// @access  Private
exports.generatePayslip = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id)
      .populate('employee', 'name email employeeId department position')
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const payslip = {
      payslipNumber: `PS-${payroll.period.year}-${payroll.period.month}-${payroll.employee.employeeId}`,
      employee: {
        name: payroll.employee.name,
        employeeId: payroll.employee.employeeId,
        department: payroll.employee.department,
        position: payroll.employee.position
      },
      period: `${payroll.period.month}/${payroll.period.year}`,
      earnings: {
        baseSalary: payroll.baseSalary,
        allowances: payroll.allowances,
        totalAllowances: payroll.totalAllowances,
        overtime: payroll.overtime,
        bonuses: payroll.bonuses,
        totalBonuses: payroll.totalBonuses,
        grossSalary: payroll.grossSalary
      },
      deductions: {
        items: payroll.deductions,
        total: payroll.totalDeductions
      },
      netSalary: payroll.netSalary,
      workingDays: payroll.workingDays,
      paymentDetails: payroll.paymentDetails,
      generatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: payslip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating payslip',
      error: error.message
    });
  }
};

// @desc    Get payroll statistics
// @route   GET /api/v1/hr/payroll/stats
// @access  Private
exports.getPayrollStatistics = async (req, res) => {
  try {
    const { year, month, department } = req.query;
    const query = {};

    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);

    const stats = await PayrollAutomation.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } },
      ...(department
        ? [{ $match: { 'employeeData.department': department } }]
        : []),
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalEmployees: { $sum: 1 },
                totalGrossSalary: { $sum: '$grossSalary' },
                totalNetSalary: { $sum: '$netSalary' },
                totalDeductions: { $sum: '$totalDeductions' },
                totalAllowances: { $sum: '$totalAllowances' },
                avgSalary: { $avg: '$netSalary' }
              }
            }
          ],
          byDepartment: [
            {
              $group: {
                _id: '$employeeData.department',
                count: { $sum: 1 },
                totalCost: { $sum: '$netSalary' },
                avgSalary: { $avg: '$netSalary' }
              }
            },
            { $sort: { totalCost: -1 } }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$netSalary' }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll statistics',
      error: error.message
    });
  }
};

// @desc    Get payroll cost trends
// @route   GET /api/v1/hr/payroll/trends
// @access  Private
exports.getPayrollTrends = async (req, res) => {
  try {
    const { startYear, endYear } = req.query;
    const query = {};

    if (startYear && endYear) {
      query['period.year'] = {
        $gte: parseInt(startYear),
        $lte: parseInt(endYear)
      };
    }

    const trends = await PayrollAutomation.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: '$period.year',
            month: '$period.month'
          },
          totalEmployees: { $sum: 1 },
          totalCost: { $sum: '$netSalary' },
          avgSalary: { $avg: '$netSalary' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll trends',
      error: error.message
    });
  }
};

// @desc    Delete payroll record
// @route   DELETE /api/v1/hr/payroll/:id
// @access  Private
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await PayrollAutomation.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid payroll records'
      });
    }

    await payroll.remove();

    res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting payroll record',
      error: error.message
    });
  }
};
