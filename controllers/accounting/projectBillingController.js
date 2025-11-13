const ProjectBilling = require('../../models/accounting/projectBillingModel');
const Invoice = require('../../models/accounting/invoiceModel');

// @desc    Get all project billing records
// @route   GET /api/v1/accounting/project-billing
// @access  Private
exports.getAllProjectBilling = async (req, res) => {
  try {
    const { project, billingType, page = 1, limit = 20 } = req.query;
    const query = {};

    if (project) query.project = project;
    if (billingType) query.billingType = billingType;

    const billings = await ProjectBilling.find(query)
      .populate('project', 'name status budget')
      .populate('milestones.invoice', 'invoiceNumber total status')
      .populate('expenses.expense', 'amount category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ProjectBilling.countDocuments(query);

    res.status(200).json({
      success: true,
      data: billings,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project billing records',
      error: error.message
    });
  }
};

// @desc    Get project billing by project ID
// @route   GET /api/v1/accounting/project-billing/project/:projectId
// @access  Private
exports.getProjectBillingByProject = async (req, res) => {
  try {
    const billing = await ProjectBilling.findOne({ project: req.params.projectId })
      .populate('project', 'name status budget startDate endDate')
      .populate('milestones.invoice', 'invoiceNumber total status paidAmount')
      .populate('expenses.expense', 'amount category description');

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    res.status(200).json({
      success: true,
      data: billing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project billing',
      error: error.message
    });
  }
};

// @desc    Create project billing
// @route   POST /api/v1/accounting/project-billing
// @access  Private
exports.createProjectBilling = async (req, res) => {
  try {
    const billing = await ProjectBilling.create(req.body);

    res.status(201).json({
      success: true,
      data: billing,
      message: 'Project billing created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project billing',
      error: error.message
    });
  }
};

// @desc    Update project billing
// @route   PUT /api/v1/accounting/project-billing/:id
// @access  Private
exports.updateProjectBilling = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        billing[key] = req.body[key];
      }
    });

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Project billing updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project billing',
      error: error.message
    });
  }
};

// @desc    Add milestone to project billing
// @route   POST /api/v1/accounting/project-billing/:id/milestones
// @access  Private
exports.addMilestone = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    const milestone = {
      name: req.body.name,
      percentage: req.body.percentage,
      amount: req.body.amount,
      dueDate: req.body.dueDate,
      status: 'pending'
    };

    billing.milestones.push(milestone);
    await billing.save();

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding milestone',
      error: error.message
    });
  }
};

// @desc    Create invoice for milestone
// @route   POST /api/v1/accounting/project-billing/:id/milestones/:milestoneId/invoice
// @access  Private
exports.createMilestoneInvoice = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id)
      .populate('project');

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    const milestone = billing.milestones.id(req.params.milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (milestone.invoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already created for this milestone'
      });
    }

    // Create invoice
    const invoice = await Invoice.create({
      customer: req.body.customer,
      lineItems: [{
        description: {
          ar: `${milestone.name} - ${billing.project.name}`,
          en: `${milestone.name} - ${billing.project.name}`
        },
        quantity: 1,
        unitPrice: milestone.amount,
        taxRate: 15,
        taxable: true
      }],
      dueDate: milestone.dueDate,
      createdBy: req.user._id
    });

    milestone.invoice = invoice._id;
    milestone.status = 'invoiced';

    billing.totalBilled += milestone.amount;
    billing.outstanding = billing.totalBilled - billing.totalPaid;

    await billing.save();

    res.status(201).json({
      success: true,
      data: { billing, invoice },
      message: 'Invoice created for milestone successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating milestone invoice',
      error: error.message
    });
  }
};

// @desc    Update milestone status
// @route   PUT /api/v1/accounting/project-billing/:id/milestones/:milestoneId/status
// @access  Private
exports.updateMilestoneStatus = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    const milestone = billing.milestones.id(req.params.milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    milestone.status = req.body.status;

    if (req.body.status === 'paid' && req.body.paidAmount) {
      billing.totalPaid += req.body.paidAmount;
      billing.outstanding = billing.totalBilled - billing.totalPaid;
    }

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Milestone status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating milestone status',
      error: error.message
    });
  }
};

// @desc    Update time tracking
// @route   PUT /api/v1/accounting/project-billing/:id/time-tracking
// @access  Private
exports.updateTimeTracking = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    if (billing.billingType !== 'time-and-material') {
      return res.status(400).json({
        success: false,
        message: 'Time tracking only available for time-and-material billing'
      });
    }

    billing.timeTracking = {
      ...billing.timeTracking,
      ...req.body
    };

    // Recalculate total billable
    if (billing.timeTracking.billableHours && billing.timeTracking.hourlyRate) {
      billing.timeTracking.totalBillable =
        billing.timeTracking.billableHours * billing.timeTracking.hourlyRate;
    }

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Time tracking updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating time tracking',
      error: error.message
    });
  }
};

// @desc    Add expense to project billing
// @route   POST /api/v1/accounting/project-billing/:id/expenses
// @access  Private
exports.addExpense = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    const expense = {
      expense: req.body.expenseId,
      billable: req.body.billable,
      amount: req.body.amount
    };

    billing.expenses.push(expense);

    if (expense.billable) {
      billing.totalBilled += expense.amount;
      billing.outstanding = billing.totalBilled - billing.totalPaid;
    }

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Expense added to project billing successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding expense',
      error: error.message
    });
  }
};

// @desc    Get project billing summary
// @route   GET /api/v1/accounting/project-billing/:id/summary
// @access  Private
exports.getProjectBillingSummary = async (req, res) => {
  try {
    const billing = await ProjectBilling.findById(req.params.id)
      .populate('project', 'name budget');

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    const summary = {
      billingType: billing.billingType,
      totalBilled: billing.totalBilled,
      totalPaid: billing.totalPaid,
      outstanding: billing.outstanding,
      milestones: {
        total: billing.milestones.length,
        pending: billing.milestones.filter(m => m.status === 'pending').length,
        invoiced: billing.milestones.filter(m => m.status === 'invoiced').length,
        paid: billing.milestones.filter(m => m.status === 'paid').length
      },
      timeTracking: billing.timeTracking,
      expenses: {
        total: billing.expenses.length,
        billable: billing.expenses.filter(e => e.billable).length,
        totalBillableAmount: billing.expenses
          .filter(e => e.billable)
          .reduce((sum, e) => sum + e.amount, 0)
      },
      nextInvoiceDate: billing.nextInvoiceDate
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project billing summary',
      error: error.message
    });
  }
};

// @desc    Delete project billing
// @route   DELETE /api/v1/accounting/project-billing/:id
// @access  Private
exports.deleteProjectBilling = async (req, res) => {
  try {
    const billing = await ProjectBilling.findByIdAndDelete(req.params.id);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Project billing not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project billing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project billing',
      error: error.message
    });
  }
};
