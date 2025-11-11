const asyncHandler = require('express-async-handler');
const Leave = require('../../models/hr/leaveModel');
const Employee = require('../../models/hr/employeeModel');
const ApiError = require('../../utils/ApiError');

// @desc    Get all leaves
// @route   GET /api/v1/hr/leaves
// @access  Private
exports.getLeaves = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.employee) {
    query.employee = req.query.employee;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.leaveType) {
    query.leaveType = req.query.leaveType;
  }

  if (req.query.startDate && req.query.endDate) {
    query.$or = [
      { startDate: { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) } },
      { endDate: { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) } },
      {
        startDate: { $lte: new Date(req.query.startDate) },
        endDate: { $gte: new Date(req.query.endDate) },
      },
    ];
  }

  const leaves = await Leave.find(query)
    .populate('employee', 'firstName lastName employeeId department position')
    .populate('approvedBy', 'firstName lastName')
    .populate('rejectedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Leave.countDocuments(query);

  res.status(200).json({
    success: true,
    count: leaves.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: leaves,
  });
});

// @desc    Get single leave
// @route   GET /api/v1/hr/leaves/:id
// @access  Private
exports.getLeave = asyncHandler(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId department position email')
    .populate('approvedBy', 'firstName lastName email')
    .populate('rejectedBy', 'firstName lastName email')
    .populate('workHandover.assignedTo', 'firstName lastName employeeId');

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Create leave request
// @route   POST /api/v1/hr/leaves
// @access  Private
exports.createLeave = asyncHandler(async (req, res, next) => {
  // Get employee from logged-in user
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  req.body.employee = employee._id;
  req.body.createdBy = req.user._id;

  // Check for overlapping leaves
  const overlaps = await Leave.checkLeaveOverlap(
    employee._id,
    req.body.startDate,
    req.body.endDate
  );

  if (overlaps.length > 0) {
    return next(
      new ApiError('You have already applied for leave during this period', 400)
    );
  }

  // Check leave balance
  const year = new Date(req.body.startDate).getFullYear();
  const balance = await Leave.getEmployeeLeaveBalance(
    employee._id,
    req.body.leaveType,
    year
  );

  const requestedDays = req.body.halfDay ? 0.5 : req.body.numberOfDays;

  if (balance.remaining < requestedDays && req.body.leaveType !== 'unpaid') {
    return next(
      new ApiError(
        `Insufficient leave balance. Available: ${balance.remaining} days, Requested: ${requestedDays} days`,
        400
      )
    );
  }

  // Set approver to manager
  if (employee.manager) {
    req.body.approver = employee.manager;
  }

  const leave = await Leave.create(req.body);

  res.status(201).json({
    success: true,
    data: leave,
  });
});

// @desc    Update leave
// @route   PUT /api/v1/hr/leaves/:id
// @access  Private
exports.updateLeave = asyncHandler(async (req, res, next) => {
  let leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  // Only pending leaves can be updated
  if (leave.status !== 'pending') {
    return next(
      new ApiError('Only pending leave requests can be updated', 400)
    );
  }

  req.body.updatedBy = req.user._id;

  leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Delete leave
// @route   DELETE /api/v1/hr/leaves/:id
// @access  Private
exports.deleteLeave = asyncHandler(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  await leave.softDelete();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Approve leave
// @route   PUT /api/v1/hr/leaves/:id/approve
// @access  Private (Manager/Admin/HR)
exports.approveLeave = asyncHandler(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id).populate('employee');

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  if (leave.status !== 'pending') {
    return next(new ApiError('Leave request is not pending', 400));
  }

  await leave.approve(req.user._id, req.body.notes);

  // Update employee leave balance
  if (leave.leaveType !== 'unpaid') {
    await leave.employee.updateLeaveBalance(leave.leaveType, -leave.numberOfDays);
  }

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Reject leave
// @route   PUT /api/v1/hr/leaves/:id/reject
// @access  Private (Manager/Admin/HR)
exports.rejectLeave = asyncHandler(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  if (leave.status !== 'pending') {
    return next(new ApiError('Leave request is not pending', 400));
  }

  await leave.reject(req.user._id, req.body.reason);

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Cancel leave
// @route   PUT /api/v1/hr/leaves/:id/cancel
// @access  Private
exports.cancelLeave = asyncHandler(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id).populate('employee');

  if (!leave) {
    return next(new ApiError('Leave request not found', 404));
  }

  if (leave.status === 'cancelled') {
    return next(new ApiError('Leave is already cancelled', 400));
  }

  const wasApproved = leave.status === 'approved';

  await leave.cancel(req.user._id, req.body.reason);

  // Restore leave balance if it was approved
  if (wasApproved && leave.leaveType !== 'unpaid') {
    await leave.employee.updateLeaveBalance(leave.leaveType, leave.numberOfDays);
  }

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Get my leaves
// @route   GET /api/v1/hr/leaves/my/leaves
// @access  Private
exports.getMyLeaves = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const leaves = await Leave.find({ employee: employee._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
});

// @desc    Get leave balance
// @route   GET /api/v1/hr/leaves/balance/:employeeId/:leaveType/:year
// @access  Private
exports.getLeaveBalance = asyncHandler(async (req, res) => {
  const balance = await Leave.getEmployeeLeaveBalance(
    req.params.employeeId,
    req.params.leaveType,
    parseInt(req.params.year)
  );

  res.status(200).json({
    success: true,
    data: balance,
  });
});

// @desc    Get my leave balance
// @route   GET /api/v1/hr/leaves/my/balance
// @access  Private
exports.getMyLeaveBalance = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const year = parseInt(req.query.year) || new Date().getFullYear();

  const balances = {};
  const leaveTypes = ['annual', 'sick', 'casual'];

  for (const type of leaveTypes) {
    balances[type] = await Leave.getEmployeeLeaveBalance(
      employee._id,
      type,
      year
    );
  }

  res.status(200).json({
    success: true,
    data: balances,
  });
});

// @desc    Get team leave calendar
// @route   GET /api/v1/hr/leaves/team/calendar
// @access  Private
exports.getTeamLeaveCalendar = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee || !employee.department) {
    return next(new ApiError('Employee or department not found', 404));
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ApiError('Please provide startDate and endDate', 400));
  }

  const leaves = await Leave.getTeamLeaveCalendar(
    employee.department,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
});

// @desc    Get leave statistics
// @route   GET /api/v1/hr/leaves/stats/:employeeId/:year
// @access  Private
exports.getLeaveStats = asyncHandler(async (req, res) => {
  const stats = await Leave.getLeaveStats(
    req.params.employeeId,
    parseInt(req.params.year)
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get pending leave requests (for managers)
// @route   GET /api/v1/hr/leaves/pending/requests
// @access  Private
exports.getPendingLeaveRequests = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  // Get team members
  const teamMembers = await Employee.find({
    manager: employee._id,
  });

  const teamMemberIds = teamMembers.map((member) => member._id);

  const leaves = await Leave.find({
    employee: { $in: teamMemberIds },
    status: 'pending',
  })
    .populate('employee', 'firstName lastName employeeId position')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
});
