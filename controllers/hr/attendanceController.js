const asyncHandler = require('express-async-handler');
const Attendance = require('../../models/hr/attendanceModel');
const Employee = require('../../models/hr/employeeModel');
const ApiError = require('../../utils/ApiError');

// @desc    Get all attendance records
// @route   GET /api/v1/hr/attendance
// @access  Private
exports.getAttendances = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.employee) {
    query.employee = req.query.employee;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    };
  }

  if (req.query.startDate && req.query.endDate) {
    query.date = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const attendances = await Attendance.find(query)
    .populate('employee', 'firstName lastName employeeId department')
    .populate('leave', 'leaveType startDate endDate')
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Attendance.countDocuments(query);

  res.status(200).json({
    success: true,
    count: attendances.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: attendances,
  });
});

// @desc    Get single attendance record
// @route   GET /api/v1/hr/attendance/:id
// @access  Private
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId department position')
    .populate('leave', 'leaveType startDate endDate');

  if (!attendance) {
    return next(new ApiError('Attendance record not found', 404));
  }

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Create attendance record
// @route   POST /api/v1/hr/attendance
// @access  Private
exports.createAttendance = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  const attendance = await Attendance.create(req.body);

  res.status(201).json({
    success: true,
    data: attendance,
  });
});

// @desc    Update attendance
// @route   PUT /api/v1/hr/attendance/:id
// @access  Private
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user._id;

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!attendance) {
    return next(new ApiError('Attendance record not found', 404));
  }

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Delete attendance
// @route   DELETE /api/v1/hr/attendance/:id
// @access  Private
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new ApiError('Attendance record not found', 404));
  }

  await attendance.softDelete();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Clock in
// @route   POST /api/v1/hr/attendance/clock-in
// @access  Private
exports.clockIn = asyncHandler(async (req, res, next) => {
  // Get employee from logged-in user
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  // Check if already clocked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAttendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (existingAttendance && existingAttendance.clockIn?.time) {
    return next(new ApiError('Already clocked in today', 400));
  }

  // Create or update attendance
  let attendance;
  if (existingAttendance) {
    attendance = existingAttendance;
  } else {
    attendance = new Attendance({
      employee: employee._id,
      date: new Date(),
      createdBy: req.user._id,
    });
  }

  await attendance.clockInEmployee(
    req.body.location,
    req.ip,
    req.headers['user-agent'],
    req.body.method || 'web'
  );

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Clock out
// @route   POST /api/v1/hr/attendance/clock-out
// @access  Private
exports.clockOut = asyncHandler(async (req, res, next) => {
  // Get employee from logged-in user
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  // Find today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance || !attendance.clockIn?.time) {
    return next(new ApiError('No clock-in record found for today', 400));
  }

  if (attendance.clockOut?.time) {
    return next(new ApiError('Already clocked out today', 400));
  }

  await attendance.clockOutEmployee(
    req.body.location,
    req.ip,
    req.headers['user-agent'],
    req.body.method || 'web'
  );

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Start break
// @route   POST /api/v1/hr/attendance/break-start
// @access  Private
exports.startBreak = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance || !attendance.clockIn?.time) {
    return next(new ApiError('Please clock in first', 400));
  }

  await attendance.addBreak(req.body.type, req.body.notes);

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    End break
// @route   POST /api/v1/hr/attendance/break-end
// @access  Private
exports.endBreak = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return next(new ApiError('No attendance record found', 404));
  }

  await attendance.endBreak();

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Get my attendance for month
// @route   GET /api/v1/hr/attendance/my/month/:year/:month
// @access  Private
exports.getMyMonthlyAttendance = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const month = parseInt(req.params.month);
  const year = parseInt(req.params.year);

  const attendance = await Attendance.getEmployeeAttendanceForMonth(
    employee._id,
    month,
    year
  );

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
});

// @desc    Get attendance statistics
// @route   GET /api/v1/hr/attendance/stats/:employeeId
// @access  Private
exports.getAttendanceStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ApiError('Please provide startDate and endDate', 400));
  }

  const stats = await Attendance.getAttendanceStats(
    req.params.employeeId,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get today's attendance status
// @route   GET /api/v1/hr/attendance/my/today
// @access  Private
exports.getMyTodayAttendance = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  res.status(200).json({
    success: true,
    data: attendance || null,
  });
});

// @desc    Get team attendance (for managers)
// @route   GET /api/v1/hr/attendance/team/today
// @access  Private
exports.getTeamAttendanceToday = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  // Get team members
  const teamMembers = await Employee.find({
    manager: employee._id,
    employmentStatus: 'active',
  });

  const teamMemberIds = teamMembers.map((member) => member._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.find({
    employee: { $in: teamMemberIds },
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  }).populate('employee', 'firstName lastName employeeId position');

  res.status(200).json({
    success: true,
    count: attendance.length,
    total: teamMembers.length,
    data: attendance,
  });
});
