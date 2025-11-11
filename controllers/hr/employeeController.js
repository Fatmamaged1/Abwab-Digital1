const asyncHandler = require('express-async-handler');
const Employee = require('../../models/hr/employeeModel');
const Department = require('../../models/hr/departmentModel');
const ApiError = require('../../utils/ApiError');

// @desc    Get all employees
// @route   GET /api/v1/hr/employees
// @access  Private
exports.getEmployees = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { employeeId: { $regex: req.query.search, $options: 'i' } },
      { position: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.department) {
    query.department = req.query.department;
  }

  if (req.query.employmentStatus) {
    query.employmentStatus = req.query.employmentStatus;
  }

  if (req.query.employmentType) {
    query.employmentType = req.query.employmentType;
  }

  if (req.query.manager) {
    query.manager = req.query.manager;
  }

  const employees = await Employee.find(query)
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName employeeId')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Employee.countDocuments(query);

  res.status(200).json({
    success: true,
    count: employees.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: employees,
  });
});

// @desc    Get single employee
// @route   GET /api/v1/hr/employees/:id
// @access  Private
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code head')
    .populate('manager', 'firstName lastName employeeId position email')
    .populate('user', 'firstName lastName email role');

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Create new employee
// @route   POST /api/v1/hr/employees
// @access  Private (Admin/HR)
exports.createEmployee = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  const employee = await Employee.create(req.body);

  res.status(201).json({
    success: true,
    data: employee,
  });
});

// @desc    Update employee
// @route   PUT /api/v1/hr/employees/:id
// @access  Private (Admin/HR)
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user._id;

  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Delete employee (soft delete)
// @route   DELETE /api/v1/hr/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  await employee.softDelete();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get employee statistics
// @route   GET /api/v1/hr/employees/stats
// @access  Private
exports.getEmployeeStats = asyncHandler(async (req, res) => {
  const stats = await Employee.aggregate([
    {
      $match: { isDeleted: { $ne: true } },
    },
    {
      $group: {
        _id: '$employmentStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const departmentStats = await Employee.aggregate([
    {
      $match: { isDeleted: { $ne: true } },
    },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department',
      },
    },
    {
      $unwind: '$department',
    },
    {
      $project: {
        departmentName: '$department.name',
        count: 1,
      },
    },
  ]);

  const total = await Employee.countDocuments({ isDeleted: { $ne: true } });

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: stats,
      byDepartment: departmentStats,
    },
  });
});

// @desc    Add employee note
// @route   POST /api/v1/hr/employees/:id/notes
// @access  Private
exports.addEmployeeNote = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  await employee.addNote(req.body.content, req.user._id, req.body.private);

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Update leave balance
// @route   PUT /api/v1/hr/employees/:id/leave-balance
// @access  Private (Admin/HR)
exports.updateLeaveBalance = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  const { leaveType, amount } = req.body;

  await employee.updateLeaveBalance(leaveType, amount);

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Add performance rating
// @route   POST /api/v1/hr/employees/:id/performance
// @access  Private (Admin/HR/Manager)
exports.addPerformanceRating = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ApiError('Employee not found', 404));
  }

  const { rating, comments, period } = req.body;

  await employee.addPerformanceRating(rating, req.user._id, comments, period);

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Get my profile
// @route   GET /api/v1/hr/employees/me/profile
// @access  Private
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id })
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName employeeId position email');

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

// @desc    Get employees by department
// @route   GET /api/v1/hr/employees/department/:departmentId
// @access  Private
exports.getEmployeesByDepartment = asyncHandler(async (req, res) => {
  const employees = await Employee.find({
    department: req.params.departmentId,
    employmentStatus: 'active',
  })
    .populate('manager', 'firstName lastName employeeId')
    .sort({ firstName: 1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  });
});

// @desc    Get team members (employees under a manager)
// @route   GET /api/v1/hr/employees/team/:managerId
// @access  Private
exports.getTeamMembers = asyncHandler(async (req, res) => {
  const employees = await Employee.find({
    manager: req.params.managerId,
    employmentStatus: 'active',
  })
    .populate('department', 'name code')
    .sort({ firstName: 1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  });
});
