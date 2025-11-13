const express = require('express');
const router = express.Router();
const {
  getAllPayroll,
  getPayroll,
  getPayrollByEmployeeAndPeriod,
  createPayroll,
  autoCalculatePayroll,
  bulkCalculatePayroll,
  updatePayroll,
  approvePayroll,
  processPayment,
  generatePayslip,
  getPayrollStatistics,
  getPayrollTrends,
  deletePayroll
} = require('../../controllers/hr/payrollAutomationController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/hr/payroll
// @desc    Get all payroll records
// @access  Private
router.get('/', getAllPayroll);

// @route   GET /api/v1/hr/payroll/stats
// @desc    Get payroll statistics
// @access  Private
router.get('/stats', getPayrollStatistics);

// @route   GET /api/v1/hr/payroll/trends
// @desc    Get payroll cost trends
// @access  Private
router.get('/trends', getPayrollTrends);

// @route   POST /api/v1/hr/payroll/auto-calculate
// @desc    Auto-calculate payroll for employee
// @access  Private
router.post('/auto-calculate', autoCalculatePayroll);

// @route   POST /api/v1/hr/payroll/bulk-calculate
// @desc    Bulk calculate payroll for department/all employees
// @access  Private
router.post('/bulk-calculate', bulkCalculatePayroll);

// @route   GET /api/v1/hr/payroll/employee/:employeeId/period/:year/:month
// @desc    Get payroll by employee and period
// @access  Private
router.get('/employee/:employeeId/period/:year/:month', getPayrollByEmployeeAndPeriod);

// @route   GET /api/v1/hr/payroll/:id
// @desc    Get single payroll record
// @access  Private
router.get('/:id', getPayroll);

// @route   GET /api/v1/hr/payroll/:id/payslip
// @desc    Generate payslip
// @access  Private
router.get('/:id/payslip', generatePayslip);

// @route   POST /api/v1/hr/payroll
// @desc    Create payroll record
// @access  Private
router.post('/', createPayroll);

// @route   PUT /api/v1/hr/payroll/:id
// @desc    Update payroll record
// @access  Private
router.put('/:id', updatePayroll);

// @route   PUT /api/v1/hr/payroll/:id/approve
// @desc    Approve payroll
// @access  Private
router.put('/:id/approve', approvePayroll);

// @route   PUT /api/v1/hr/payroll/:id/process-payment
// @desc    Process payment
// @access  Private
router.put('/:id/process-payment', processPayment);

// @route   DELETE /api/v1/hr/payroll/:id
// @desc    Delete payroll record
// @access  Private
router.delete('/:id', deletePayroll);

module.exports = router;
