const CapacityPlanner = require('../../models/hr/capacityPlannerModel');
const AIService = require('../../services/aiService');

const aiService = new AIService();

/**
 * @desc    Get all capacity plans
 * @route   GET /api/hr/capacity-planner
 * @access  Private
 */
exports.getAllCapacityPlans = async (req, res) => {
  try {
    const { page = 1, limit = 20, year, week } = req.query;

    const query = {};
    if (year) query.year = parseInt(year);
    if (week) query.week = parseInt(week);

    const plans = await CapacityPlanner.find(query)
      .populate('employees.employee', 'name email role department')
      .populate('employees.projects.project', 'name status')
      .populate('createdBy', 'name email')
      .sort({ year: -1, week: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await CapacityPlanner.countDocuments(query);

    res.status(200).json({
      success: true,
      data: plans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching capacity plans',
      error: error.message,
    });
  }
};

/**
 * @desc    Get capacity plan by ID
 * @route   GET /api/hr/capacity-planner/:id
 * @access  Private
 */
exports.getCapacityPlanById = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findById(req.params.id)
      .populate('employees.employee', 'name email role department')
      .populate('employees.projects.project', 'name status deadline')
      .populate('aiRecommendations.employee', 'name')
      .populate('aiRecommendations.fromProject', 'name')
      .populate('aiRecommendations.toProject', 'name')
      .populate('createdBy', 'name email');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching capacity plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Create capacity plan
 * @route   POST /api/hr/capacity-planner
 * @access  Private
 */
exports.createCapacityPlan = async (req, res) => {
  try {
    const plan = await CapacityPlanner.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Capacity plan created successfully',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating capacity plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Update capacity plan
 * @route   PUT /api/hr/capacity-planner/:id
 * @access  Private
 */
exports.updateCapacityPlan = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    Object.keys(req.body).forEach((key) => {
      plan[key] = req.body[key];
    });

    plan.lastUpdatedBy = req.user._id;
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Capacity plan updated successfully',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating capacity plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Allocate hours to employee
 * @route   POST /api/hr/capacity-planner/:id/allocate
 * @access  Private
 */
exports.allocateHours = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    const { employeeId, projectId, hours, role } = req.body;
    plan.allocateHours(employeeId, projectId, hours, role);
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Hours allocated successfully',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error allocating hours',
      error: error.message,
    });
  }
};

/**
 * @desc    Get employee capacity
 * @route   GET /api/hr/capacity-planner/:id/employee/:employeeId
 * @access  Private
 */
exports.getEmployeeCapacity = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    const employeeCapacity = plan.getEmployeeCapacity(req.params.employeeId);

    if (!employeeCapacity) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in this capacity plan',
      });
    }

    res.status(200).json({
      success: true,
      data: employeeCapacity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee capacity',
      error: error.message,
    });
  }
};

/**
 * @desc    Get capacity trends
 * @route   GET /api/hr/capacity-planner/trends
 * @access  Private
 */
exports.getCapacityTrends = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;

    const trends = await CapacityPlanner.getCapacityTrends(parseInt(weeks));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching capacity trends',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current week capacity
 * @route   GET /api/hr/capacity-planner/current
 * @access  Private
 */
exports.getCurrentWeekCapacity = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    const plan = await CapacityPlanner.findOne({
      year: currentYear,
      week: currentWeek,
    })
      .populate('employees.employee', 'name email role')
      .populate('employees.projects.project', 'name');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No capacity plan found for current week',
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching current week capacity',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate AI recommendations
 * @route   POST /api/hr/capacity-planner/:id/ai-recommendations
 * @access  Private
 */
exports.generateAIRecommendations = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findById(req.params.id)
      .populate('employees.employee')
      .populate('employees.projects.project');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    // Analyze capacity and generate recommendations
    const recommendations = [];

    // Find overloaded employees
    const overloaded = plan.employees.filter((emp) => emp.status === 'overloaded');

    // Find underutilized employees
    const underutilized = plan.employees.filter(
      (emp) => emp.utilizationRate < 60 && emp.status !== 'on-leave'
    );

    // Generate reallocation recommendations
    for (const overloadedEmp of overloaded) {
      for (const underutilizedEmp of underutilized) {
        const hoursToReallocate = Math.min(
          overloadedEmp.allocated - overloadedEmp.totalCapacity,
          underutilizedEmp.available
        );

        if (hoursToReallocate > 0 && overloadedEmp.projects.length > 0) {
          recommendations.push({
            type: 'reallocation',
            employee: underutilizedEmp.employee,
            fromProject: overloadedEmp.projects[0].project,
            hours: hoursToReallocate,
            reason: `Reallocate ${hoursToReallocate}h to balance workload`,
            impact: `Reduce ${overloadedEmp.employee} overload and improve ${underutilizedEmp.employee} utilization`,
            priority: 8,
            status: 'pending',
          });
        }
      }
    }

    plan.aiRecommendations = recommendations;
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'AI recommendations generated successfully',
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating AI recommendations',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete capacity plan
 * @route   DELETE /api/hr/capacity-planner/:id
 * @access  Private
 */
exports.deleteCapacityPlan = async (req, res) => {
  try {
    const plan = await CapacityPlanner.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Capacity plan not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Capacity plan deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting capacity plan',
      error: error.message,
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

module.exports = exports;
