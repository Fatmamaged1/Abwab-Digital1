const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      ar: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },
    type: {
      type: String,
      enum: [
        'asset',
        'liability',
        'equity',
        'revenue',
        'expense',
        'cost_of_goods_sold',
      ],
      required: true,
    },
    subType: {
      type: String,
      enum: [
        // Assets
        'current_asset',
        'fixed_asset',
        'cash',
        'bank',
        'accounts_receivable',
        'inventory',
        'prepaid_expense',
        'other_current_asset',
        'property_plant_equipment',
        'accumulated_depreciation',
        'intangible_asset',
        'other_asset',
        // Liabilities
        'current_liability',
        'long_term_liability',
        'accounts_payable',
        'credit_card',
        'loan',
        'tax_payable',
        'accrued_expense',
        'other_current_liability',
        'other_liability',
        // Equity
        'equity',
        'retained_earnings',
        'owner_equity',
        // Revenue
        'sales_revenue',
        'service_revenue',
        'other_revenue',
        // Expense
        'operating_expense',
        'payroll_expense',
        'rent_expense',
        'utilities_expense',
        'marketing_expense',
        'travel_expense',
        'professional_fees',
        'depreciation_expense',
        'interest_expense',
        'tax_expense',
        'other_expense',
        // COGS
        'cost_of_goods_sold',
      ],
    },
    parentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    currency: {
      type: String,
      enum: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP'],
      default: 'SAR',
    },
    balance: {
      type: Number,
      default: 0,
    },
    // Normal balance side
    normalBalance: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    isBankAccount: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      swiftCode: String,
    },
    taxInfo: {
      isTaxable: {
        type: Boolean,
        default: false,
      },
      taxRate: Number,
      taxCode: String,
    },
    budgetAmount: {
      type: Number,
      default: 0,
    },
    // System fields
    isSystemAccount: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
accountSchema.index({ code: 1 });
accountSchema.index({ type: 1 });
accountSchema.index({ subType: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ isDeleted: 1 });

// Set normal balance based on account type
accountSchema.pre('save', function (next) {
  if (this.isNew && !this.normalBalance) {
    switch (this.type) {
      case 'asset':
      case 'expense':
      case 'cost_of_goods_sold':
        this.normalBalance = 'debit';
        break;
      case 'liability':
      case 'equity':
      case 'revenue':
        this.normalBalance = 'credit';
        break;
    }
  }
  next();
});

// Query middleware to exclude soft-deleted documents
accountSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
accountSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'archived';
  return this.save();
};

accountSchema.methods.updateBalance = function (amount, type = 'debit') {
  if (this.normalBalance === type) {
    this.balance += amount;
  } else {
    this.balance -= amount;
  }
  return this.save();
};

// Virtual for account hierarchy
accountSchema.virtual('fullName').get(function () {
  return {
    ar: `${this.code} - ${this.name.ar}`,
    en: `${this.code} - ${this.name.en}`,
  };
});

accountSchema.virtual('displayName').get(function () {
  // Returns bilingual display name
  return this.name;
});

// Ensure virtual fields are included when converting to JSON
accountSchema.set('toJSON', { virtuals: true });
accountSchema.set('toObject', { virtuals: true });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
