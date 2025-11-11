const asyncHandler = require('express-async-handler');
const Department = require('../../models/hr/departmentModel');
const Employee = require('../../models/hr/employeeModel');
const ApiError = require('../../utils/ApiError');

// @desc    Get all departments
// @route   GET /api/v1/hr/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const departments = await Department.find(query)
    .populate('head', 'firstName lastName employeeId position')
    .populate('parentDepartment', 'name code')
    .populate('employeeCount')
    .sort({ name: 1 })
    .limit(limit)
    .skip(skip);

  const total = await Department.countDocuments(query);

  res.status(200).json({
    success: true,
    count: departments.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: departments,
  });
});

// @desc    Get single department
// @route   GET /api/v1/hr/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('head', 'firstName lastName employeeId position email')
    .populate('parentDepartment', 'name code')
    .populate('employeeCount');

  if (!department) {
    return next(new ApiError('Department not found', 404));
  }

  // Get employees in this department
  const employees = await Employee.find({ department: department._id })
    .select('firstName lastName employeeId position employmentStatus')
    .sort({ firstName: 1 });

  res.status(200).json({
    success: true,
    data: {
      ...department.toObject(),
      employees,
    },
  });
});

// @desc    Create department
// @route   POST /api/v1/hr/departments
// @access  Private (Admin/HR)
exports.createDepartment = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  const department = await Department.create(req.body);

  res.status(201).json({
    success: true,
    data: department,
  });
});

// @desc    Update department
// @route   PUT /api/v1/hr/departments/:id
// @access  Private (Admin/HR)
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user._id;

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!department) {
    return next(new ApiError('Department not found', 404));
  }

  res.status(200).json({
    success: true,
    data: department,
  });
});

// @desc    Delete department
// @route   DELETE /api/v1/hr/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ApiError('Department not found', 404));
  }

  // Check if department has employees
  const employeeCount = await Employee.countDocuments({
    department: department._id,
    employmentStatus: 'active',
  });

  if (employeeCount > 0) {
    return next(
      new ApiError(
        'Cannot delete department with active employees. Please reassign them first.',
        400
      )
    );
  }

  await department.softDelete();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get department statistics
// @route   GET /api/v1/hr/departments/stats
// @access  Private
exports.getDepartmentStats = asyncHandler(async (req, res) => {
  const stats = await Department.aggregate([
    {
      $match: { isDeleted: { $ne: true } },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: 'department',
        as: 'employees',
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        employeeCount: { $size: '$employees' },
        activeEmployees: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'emp',
              cond: {
                $and: [
                  { $eq: ['$$emp.employmentStatus', 'active'] },
                  { $ne: ['$$emp.isDeleted', true] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $sort: { employeeCount: -1 },
    },
  ]);

  const total = await Department.countDocuments({ isDeleted: { $ne: true } });

  res.status(200).json({
    success: true,
    data: {
      total,
      departments: stats,
    },
  });
});
