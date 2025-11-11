const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    isAdmin: { type: Boolean, default: true },
    phone: String,
    profileImg: String,

    password: {
      type: String,
      required: [true, 'password required'],
      minlength: [6, 'Too short password'],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'manager', 'admin', 'accountant', 'finance_manager', 'sales_manager', 'hr_manager', 'project_manager'],
      default: 'user',
    },
    // Permissions for accounting module
    accountingPermissions: {
      canViewAccounts: { type: Boolean, default: false },
      canCreateAccounts: { type: Boolean, default: false },
      canEditAccounts: { type: Boolean, default: false },
      canDeleteAccounts: { type: Boolean, default: false },
      canViewJournalEntries: { type: Boolean, default: false },
      canCreateJournalEntries: { type: Boolean, default: false },
      canPostJournalEntries: { type: Boolean, default: false },
      canReverseJournalEntries: { type: Boolean, default: false },
      canViewInvoices: { type: Boolean, default: false },
      canCreateInvoices: { type: Boolean, default: false },
      canEditInvoices: { type: Boolean, default: false },
      canDeleteInvoices: { type: Boolean, default: false },
      canApproveInvoices: { type: Boolean, default: false },
      canViewPayments: { type: Boolean, default: false },
      canCreatePayments: { type: Boolean, default: false },
      canApprovePayments: { type: Boolean, default: false },
      canViewExpenses: { type: Boolean, default: false },
      canCreateExpenses: { type: Boolean, default: false },
      canApproveExpenses: { type: Boolean, default: false },
      canViewBudgets: { type: Boolean, default: false },
      canCreateBudgets: { type: Boolean, default: false },
      canEditBudgets: { type: Boolean, default: false },
      canViewFinancialReports: { type: Boolean, default: false },
      canExportReports: { type: Boolean, default: false },
      canViewVATReturns: { type: Boolean, default: false },
      canSubmitVATReturns: { type: Boolean, default: false },
    },
    active: {
      type: Boolean,
      default: true,
    },
    
    
  },
  { timestamps: true }
);


userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Auto-assign accounting permissions based on role
  if (this.isModified('role')) {
    if (this.role === 'admin' || this.role === 'finance_manager') {
      // Full accounting permissions for admin and finance manager
      this.accountingPermissions = {
        canViewAccounts: true,
        canCreateAccounts: true,
        canEditAccounts: true,
        canDeleteAccounts: true,
        canViewJournalEntries: true,
        canCreateJournalEntries: true,
        canPostJournalEntries: true,
        canReverseJournalEntries: true,
        canViewInvoices: true,
        canCreateInvoices: true,
        canEditInvoices: true,
        canDeleteInvoices: true,
        canApproveInvoices: true,
        canViewPayments: true,
        canCreatePayments: true,
        canApprovePayments: true,
        canViewExpenses: true,
        canCreateExpenses: true,
        canApproveExpenses: true,
        canViewBudgets: true,
        canCreateBudgets: true,
        canEditBudgets: true,
        canViewFinancialReports: true,
        canExportReports: true,
        canViewVATReturns: true,
        canSubmitVATReturns: true,
      };
    } else if (this.role === 'accountant') {
      // Accountant permissions
      this.accountingPermissions = {
        canViewAccounts: true,
        canCreateAccounts: true,
        canEditAccounts: true,
        canDeleteAccounts: false,
        canViewJournalEntries: true,
        canCreateJournalEntries: true,
        canPostJournalEntries: true,
        canReverseJournalEntries: false,
        canViewInvoices: true,
        canCreateInvoices: true,
        canEditInvoices: true,
        canDeleteInvoices: false,
        canApproveInvoices: false,
        canViewPayments: true,
        canCreatePayments: true,
        canApprovePayments: false,
        canViewExpenses: true,
        canCreateExpenses: true,
        canApproveExpenses: false,
        canViewBudgets: true,
        canCreateBudgets: false,
        canEditBudgets: false,
        canViewFinancialReports: true,
        canExportReports: true,
        canViewVATReturns: true,
        canSubmitVATReturns: false,
      };
    } else if (this.role === 'sales_manager') {
      // Sales manager permissions (limited to invoices and payments)
      this.accountingPermissions = {
        canViewAccounts: false,
        canCreateAccounts: false,
        canEditAccounts: false,
        canDeleteAccounts: false,
        canViewJournalEntries: false,
        canCreateJournalEntries: false,
        canPostJournalEntries: false,
        canReverseJournalEntries: false,
        canViewInvoices: true,
        canCreateInvoices: true,
        canEditInvoices: true,
        canDeleteInvoices: false,
        canApproveInvoices: false,
        canViewPayments: true,
        canCreatePayments: false,
        canApprovePayments: false,
        canViewExpenses: false,
        canCreateExpenses: false,
        canApproveExpenses: false,
        canViewBudgets: true,
        canCreateBudgets: false,
        canEditBudgets: false,
        canViewFinancialReports: false,
        canExportReports: false,
        canViewVATReturns: false,
        canSubmitVATReturns: false,
      };
    } else if (this.role === 'manager' || this.role === 'project_manager') {
      // Manager permissions (expenses and budgets)
      this.accountingPermissions = {
        canViewAccounts: false,
        canCreateAccounts: false,
        canEditAccounts: false,
        canDeleteAccounts: false,
        canViewJournalEntries: false,
        canCreateJournalEntries: false,
        canPostJournalEntries: false,
        canReverseJournalEntries: false,
        canViewInvoices: true,
        canCreateInvoices: false,
        canEditInvoices: false,
        canDeleteInvoices: false,
        canApproveInvoices: false,
        canViewPayments: false,
        canCreatePayments: false,
        canApprovePayments: false,
        canViewExpenses: true,
        canCreateExpenses: true,
        canApproveExpenses: true,
        canViewBudgets: true,
        canCreateBudgets: true,
        canEditBudgets: true,
        canViewFinancialReports: true,
        canExportReports: false,
        canViewVATReturns: false,
        canSubmitVATReturns: false,
      };
    }
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;