const asyncHandler = require('express-async-handler');
const TimeLog = require('../../models/hr/timeLogModel');
const Employee = require('../../models/hr/employeeModel');
const ApiError = require('../../utils/ApiError');

// @desc    Get all time logs
// @route   GET /api/v1/hr/timelogs
// @access  Private
exports.getTimeLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.employee) {
    query.employee = req.query.employee;
  }

  if (req.query.project) {
    query.project = req.query.project;
  }

  if (req.query.sprint) {
    query.sprint = req.query.sprint;
  }

  if (req.query.story) {
    query.story = req.query.story;
  }

  if (req.query.activityType) {
    query.activityType = req.query.activityType;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.billable !== undefined) {
    query.billable = req.query.billable === 'true';
  }

  if (req.query.startDate && req.query.endDate) {
    query.date = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const timeLogs = await TimeLog.find(query)
    .populate('employee', 'firstName lastName employeeId')
    .populate('project', 'name code')
    .populate('sprint', 'name')
    .populate('story', 'storyNumber title')
    .populate('task', 'title')
    .sort({ date: -1, startTime: -1 })
    .limit(limit)
    .skip(skip);

  const total = await TimeLog.countDocuments(query);

  res.status(200).json({
    success: true,
    count: timeLogs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: timeLogs,
  });
});

// @desc    Get single time log
// @route   GET /api/v1/hr/timelogs/:id
// @access  Private
exports.getTimeLog = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId position')
    .populate('project', 'name code')
    .populate('sprint', 'name')
    .populate('story', 'storyNumber title')
    .populate('task', 'title');

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Create time log
// @route   POST /api/v1/hr/timelogs
// @access  Private
exports.createTimeLog = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  req.body.employee = employee._id;
  req.body.createdBy = req.user._id;

  const timeLog = await TimeLog.create(req.body);

  res.status(201).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Update time log
// @route   PUT /api/v1/hr/timelogs/:id
// @access  Private
exports.updateTimeLog = asyncHandler(async (req, res, next) => {
  let timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  // Can't update approved or invoiced logs
  if (timeLog.status === 'approved' || timeLog.status === 'invoiced') {
    return next(
      new ApiError('Cannot update approved or invoiced time logs', 400)
    );
  }

  req.body.updatedBy = req.user._id;

  timeLog = await TimeLog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Delete time log
// @route   DELETE /api/v1/hr/timelogs/:id
// @access  Private
exports.deleteTimeLog = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  // Can't delete approved or invoiced logs
  if (timeLog.status === 'approved' || timeLog.status === 'invoiced') {
    return next(
      new ApiError('Cannot delete approved or invoiced time logs', 400)
    );
  }

  await timeLog.softDelete();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Start timer
// @route   POST /api/v1/hr/timelogs/start
// @access  Private
exports.startTimer = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  // Check if there's an active timer
  const activeTimer = await TimeLog.findOne({
    employee: employee._id,
    endTime: null,
    status: 'draft',
  });

  if (activeTimer) {
    return next(
      new ApiError('You have an active timer running. Please stop it first.', 400)
    );
  }

  const timeLog = await TimeLog.create({
    employee: employee._id,
    startTime: new Date(),
    date: new Date(),
    description: req.body.description || 'Work in progress',
    activityType: req.body.activityType || 'development',
    project: req.body.project,
    sprint: req.body.sprint,
    story: req.body.story,
    task: req.body.task,
    billable: req.body.billable !== false,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Stop timer
// @route   PUT /api/v1/hr/timelogs/:id/stop
// @access  Private
exports.stopTimer = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  if (timeLog.endTime) {
    return next(new ApiError('Timer is already stopped', 400));
  }

  await timeLog.stopTimer();

  // Update description if provided
  if (req.body.description) {
    timeLog.description = req.body.description;
    await timeLog.save();
  }

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Submit time log for approval
// @route   PUT /api/v1/hr/timelogs/:id/submit
// @access  Private
exports.submitTimeLog = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  if (timeLog.status !== 'draft') {
    return next(new ApiError('Only draft time logs can be submitted', 400));
  }

  if (!timeLog.endTime) {
    return next(new ApiError('Please stop the timer before submitting', 400));
  }

  await timeLog.submit();

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Approve time log
// @route   PUT /api/v1/hr/timelogs/:id/approve
// @access  Private (Manager/Admin)
exports.approveTimeLog = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  if (timeLog.status !== 'submitted') {
    return next(new ApiError('Only submitted time logs can be approved', 400));
  }

  await timeLog.approve(req.user._id);

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Reject time log
// @route   PUT /api/v1/hr/timelogs/:id/reject
// @access  Private (Manager/Admin)
exports.rejectTimeLog = asyncHandler(async (req, res, next) => {
  const timeLog = await TimeLog.findById(req.params.id);

  if (!timeLog) {
    return next(new ApiError('Time log not found', 404));
  }

  if (timeLog.status !== 'submitted') {
    return next(new ApiError('Only submitted time logs can be rejected', 400));
  }

  await timeLog.reject(req.user._id, req.body.reason);

  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

// @desc    Get my time logs
// @route   GET /api/v1/hr/timelogs/my/logs
// @access  Private
exports.getMyTimeLogs = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ApiError('Please provide startDate and endDate', 400));
  }

  const timeLogs = await TimeLog.getEmployeeTimeLogsForPeriod(
    employee._id,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    count: timeLogs.length,
    data: timeLogs,
  });
});

// @desc    Get active timer
// @route   GET /api/v1/hr/timelogs/my/active
// @access  Private
exports.getActiveTimer = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const activeTimer = await TimeLog.findOne({
    employee: employee._id,
    endTime: null,
    status: 'draft',
  })
    .populate('project', 'name code')
    .populate('sprint', 'name')
    .populate('story', 'storyNumber title');

  res.status(200).json({
    success: true,
    data: activeTimer,
  });
});

// @desc    Get project time stats
// @route   GET /api/v1/hr/timelogs/project/:projectId/stats
// @access  Private
exports.getProjectTimeStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ApiError('Please provide startDate and endDate', 400));
  }

  const stats = await TimeLog.getProjectTimeStats(
    req.params.projectId,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get employee time stats
// @route   GET /api/v1/hr/timelogs/employee/:employeeId/stats
// @access  Private
exports.getEmployeeTimeStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ApiError('Please provide startDate and endDate', 400));
  }

  const stats = await TimeLog.getEmployeeTimeStats(
    req.params.employeeId,
    new Date(startDate),
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get weekly time report
// @route   GET /api/v1/hr/timelogs/my/weekly
// @access  Private
exports.getMyWeeklyReport = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ApiError('Employee profile not found', 404));
  }

  const { weekStartDate } = req.query;

  if (!weekStartDate) {
    return next(new ApiError('Please provide weekStartDate', 400));
  }

  const report = await TimeLog.getWeeklyTimeReport(
    employee._id,
    new Date(weekStartDate)
  );

  res.status(200).json({
    success: true,
    data: report,
  });
});
