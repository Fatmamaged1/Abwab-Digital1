const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    // Expense Number - Auto-generated
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'paid', 'cancelled'],
      default: 'draft',
    },

    // Date Information
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    hijriDate: {
      year: Number,
      month: Number,
      day: Number,
      formatted: String,
    },

    // Employee/Submitter
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Category
    category: {
      type: String,
      enum: [
        'travel',
        'accommodation',
        'meals',
        'transportation',
        'office_supplies',
        'software_licenses',
        'marketing',
        'advertising',
        'client_entertainment',
        'training',
        'equipment',
        'utilities',
        'professional_fees',
        'subscriptions',
        'other',
      ],
      required: true,
    },

    // Expense Type
    type: {
      type: String,
      enum: ['employee_reimbursement', 'company_card', 'direct_payment', 'petty_cash'],
      default: 'employee_reimbursement',
    },

    // Description
    description: {
      ar: String,
      en: String,
    },
    notes: String,

    // Amount
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      enum: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP'],
      default: 'SAR',
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    amountInBaseCurrency: {
      type: Number,
    },

    // Tax Information (VAT)
    taxable: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 15,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // Vendor/Merchant
    merchant: {
      name: String,
      location: String,
      vatNumber: String,
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'company_card', 'other'],
    },

    // Receipt Information
    receiptNumber: String,
    hasReceipt: {
      type: Boolean,
      default: false,
    },

    // Project/Department/Campaign Tracking
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    // For marketing expenses
    marketingChannel: {
      type: String,
      enum: [
        'social_media',
        'google_ads',
        'facebook_ads',
        'linkedin_ads',
        'twitter_ads',
        'snapchat_ads',
        'tiktok_ads',
        'seo',
        'content_marketing',
        'email_marketing',
        'influencer_marketing',
        'events',
        'print_media',
        'other',
      ],
    },

    // Billability (for client projects)
    billable: {
      type: Boolean,
      default: false,
    },
    billedToClient: {
      type: Boolean,
      default: false,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    markupPercentage: {
      type: Number,
      default: 0,
    },

    // Approval Workflow
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    rejectionReason: String,

    // Reimbursement
    reimbursementAmount: {
      type: Number,
    },
    reimbursementDate: Date,
    reimbursementPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

    // Expense Account
    expenseAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },

    // Journal Entry
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },

    // Attachments (receipts, invoices)
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // System Fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ employee: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ project: 1 });
expenseSchema.index({ department: 1 });
expenseSchema.index({ campaign: 1 });
expenseSchema.index({ isDeleted: 1 });
expenseSchema.index({ createdAt: -1 });

// Virtuals
expenseSchema.virtual('isPaid').get(function () {
  return this.status === 'paid';
});

expenseSchema.virtual('isReimbursed').get(function () {
  return this.reimbursementDate != null;
});

// Pre-save middleware
expenseSchema.pre('save', async function (next) {
  // Auto-generate expense number
  if (!this.expenseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      expenseNumber: new RegExp(`^EXP${year}`),
    });
    this.expenseNumber = `EXP${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate tax amount
  if (this.taxable && this.taxRate > 0) {
    this.taxAmount = (this.amount * this.taxRate) / 100;
  } else {
    this.taxAmount = 0;
  }

  // Calculate total amount
  this.totalAmount = this.amount + this.taxAmount;

  // Calculate amount in base currency
  if (this.currency !== 'SAR') {
    this.amountInBaseCurrency = this.totalAmount * this.exchangeRate;
  } else {
    this.amountInBaseCurrency = this.totalAmount;
  }

  // Set reimbursement amount (if employee reimbursement)
  if (this.type === 'employee_reimbursement' && !this.reimbursementAmount) {
    this.reimbursementAmount = this.totalAmount;
  }

  next();
});

// Query middleware to exclude soft-deleted documents
expenseSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
expenseSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'cancelled';
  return this.save();
};

expenseSchema.methods.submit = async function () {
  if (this.status !== 'draft') {
    throw new Error('Only draft expenses can be submitted');
  }
  this.status = 'submitted';
  return this.save();
};

expenseSchema.methods.approve = async function (userId, notes) {
  if (this.status !== 'submitted') {
    throw new Error('Only submitted expenses can be approved');
  }

  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();

  // Create journal entry
  await this.createJournalEntry(userId);

  return this.save();
};

expenseSchema.methods.reject = async function (userId, reason) {
  if (this.status !== 'submitted') {
    throw new Error('Only submitted expenses can be rejected');
  }

  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  return this.save();
};

expenseSchema.methods.createJournalEntry = async function (userId) {
  const JournalEntry = mongoose.model('JournalEntry');

  const lines = [];

  // Debit: Expense Account
  lines.push({
    account: this.expenseAccount || (await this.getDefaultExpenseAccount()),
    description: {
      ar: `مصروف ${this.expenseNumber}`,
      en: `Expense ${this.expenseNumber}`,
    },
    type: 'debit',
    amount: this.amount,
    currency: this.currency,
    project: this.project,
    department: this.department,
  });

  // Debit: Tax Account (if taxable)
  if (this.taxAmount > 0) {
    lines.push({
      account: await this.getTaxReceivableAccount(),
      description: {
        ar: `ضريبة قابلة للاسترداد ${this.expenseNumber}`,
        en: `Recoverable VAT ${this.expenseNumber}`,
      },
      type: 'debit',
      amount: this.taxAmount,
      currency: this.currency,
    });
  }

  // Credit: Bank/Cash or Employee Payable
  if (this.type === 'employee_reimbursement') {
    lines.push({
      account: await this.getEmployeePayableAccount(),
      description: {
        ar: `مستحق للموظف ${this.expenseNumber}`,
        en: `Employee reimbursement ${this.expenseNumber}`,
      },
      type: 'credit',
      amount: this.totalAmount,
      currency: this.currency,
      employee: this.employee,
    });
  } else {
    lines.push({
      account: await this.getCashAccount(),
      description: {
        ar: `دفع مصروف ${this.expenseNumber}`,
        en: `Expense payment ${this.expenseNumber}`,
      },
      type: 'credit',
      amount: this.totalAmount,
      currency: this.currency,
    });
  }

  const journalEntry = new JournalEntry({
    type: 'expense',
    date: this.expenseDate,
    reference: this.expenseNumber,
    description: {
      ar: `قيد مصروف ${this.expenseNumber}`,
      en: `Expense ${this.expenseNumber} entry`,
    },
    lines,
    relatedDocuments: [
      {
        documentType: 'expense',
        documentId: this._id,
        documentNumber: this.expenseNumber,
      },
    ],
    createdBy: userId,
  });

  await journalEntry.save();
  await journalEntry.post(userId);

  this.journalEntry = journalEntry._id;
  await this.save();

  return journalEntry;
};

// Helper methods
expenseSchema.methods.getDefaultExpenseAccount = async function () {
  const Account = mongoose.model('Account');
  // Get account based on category
  const categoryAccountMap = {
    marketing: '6100',
    advertising: '6110',
    travel: '6200',
    office_supplies: '6300',
    software_licenses: '6400',
  };
  const code = categoryAccountMap[this.category] || '6000';
  const account = await Account.findOne({ code, type: 'expense' });
  return account?._id;
};

expenseSchema.methods.getTaxReceivableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '1300', subType: 'other_current_asset' });
  return account?._id;
};

expenseSchema.methods.getEmployeePayableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '2150', subType: 'other_current_liability' });
  return account?._id;
};

expenseSchema.methods.getCashAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '1010', subType: 'cash' });
  return account?._id;
};

// Ensure virtual fields are included when converting to JSON
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
