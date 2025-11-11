const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    // Entry Number - Auto-generated
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    // Entry Type
    type: {
      type: String,
      enum: [
        'standard',
        'adjusting',
        'closing',
        'reversing',
        'invoice',
        'payment',
        'expense',
        'payroll',
        'depreciation',
        'tax',
      ],
      required: true,
      default: 'standard',
    },

    // Date Information
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    postingDate: {
      type: Date,
    },
    // Hijri Date for Saudi Market
    hijriDate: {
      year: Number,
      month: Number,
      day: Number,
      formatted: String, // e.g., "15 رمضان 1445"
    },

    // Reference Information
    reference: {
      type: String,
      trim: true,
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    memo: {
      type: String,
      maxLength: [1000, 'Memo cannot exceed 1000 characters'],
    },

    // Journal Lines (Debits and Credits)
    lines: [
      {
        lineNumber: {
          type: Number,
          required: true,
        },
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Account',
          required: true,
        },
        description: {
          ar: { type: String },
          en: { type: String },
        },
        // Debit/Credit Type
        type: {
          type: String,
          enum: ['debit', 'credit'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, 'Amount must be positive'],
        },
        // Multi-currency support
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
        // Tracking
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Project',
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
        },
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        // Tax Information
        taxable: {
          type: Boolean,
          default: false,
        },
        taxRate: {
          type: Number,
          default: 0,
        },
        taxAmount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Totals
    totalDebit: {
      type: Number,
      default: 0,
    },
    totalCredit: {
      type: Number,
      default: 0,
    },
    isBalanced: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'pending', 'posted', 'approved', 'reversed', 'void'],
      default: 'draft',
    },

    // Posting Information
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    postedAt: {
      type: Date,
    },

    // Approval Workflow
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    approvalNotes: {
      type: String,
    },

    // Reversal Information
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reversedAt: {
      type: Date,
    },
    reversalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    originalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },

    // Related Documents
    relatedDocuments: [
      {
        documentType: {
          type: String,
          enum: ['invoice', 'payment', 'receipt', 'expense', 'other'],
        },
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        documentNumber: String,
      },
    ],

    // Attachments
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
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // System Fields
    fiscalYear: {
      type: Number,
    },
    fiscalPeriod: {
      type: Number,
    },
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
journalEntrySchema.index({ entryNumber: 1 });
journalEntrySchema.index({ date: -1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ type: 1 });
journalEntrySchema.index({ fiscalYear: 1, fiscalPeriod: 1 });
journalEntrySchema.index({ 'lines.account': 1 });
journalEntrySchema.index({ isDeleted: 1 });
journalEntrySchema.index({ createdAt: -1 });

// Virtual for balance check
journalEntrySchema.virtual('balanceDifference').get(function () {
  return Math.abs(this.totalDebit - this.totalCredit);
});

// Pre-save middleware
journalEntrySchema.pre('save', async function (next) {
  // Auto-generate entry number
  if (!this.entryNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      entryNumber: new RegExp(`^JE${year}`),
    });
    this.entryNumber = `JE${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate totals
  let totalDebit = 0;
  let totalCredit = 0;

  this.lines.forEach((line, index) => {
    // Set line number
    line.lineNumber = index + 1;

    // Calculate amount in base currency (SAR)
    if (line.currency !== 'SAR') {
      line.amountInBaseCurrency = line.amount * line.exchangeRate;
    } else {
      line.amountInBaseCurrency = line.amount;
    }

    // Add to totals
    if (line.type === 'debit') {
      totalDebit += line.amountInBaseCurrency;
    } else {
      totalCredit += line.amountInBaseCurrency;
    }
  });

  this.totalDebit = Math.round(totalDebit * 100) / 100;
  this.totalCredit = Math.round(totalCredit * 100) / 100;

  // Check if balanced (allow 0.01 difference for rounding)
  this.isBalanced = Math.abs(this.totalDebit - this.totalCredit) < 0.01;

  // Set fiscal year and period
  if (!this.fiscalYear) {
    this.fiscalYear = this.date.getFullYear();
  }
  if (!this.fiscalPeriod) {
    this.fiscalPeriod = this.date.getMonth() + 1;
  }

  next();
});

// Query middleware to exclude soft-deleted documents
journalEntrySchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
journalEntrySchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'void';
  return this.save();
};

journalEntrySchema.methods.post = async function (userId) {
  if (this.status !== 'draft' && this.status !== 'pending') {
    throw new Error('Only draft or pending entries can be posted');
  }
  if (!this.isBalanced) {
    throw new Error('Entry must be balanced before posting');
  }

  this.status = 'posted';
  this.postedBy = userId;
  this.postedAt = new Date();
  this.postingDate = this.postingDate || new Date();

  // Update account balances
  const Account = mongoose.model('Account');
  for (const line of this.lines) {
    const account = await Account.findById(line.account);
    if (account) {
      await account.updateBalance(line.amountInBaseCurrency, line.type);
    }
  }

  return this.save();
};

journalEntrySchema.methods.approve = async function (userId, notes) {
  if (this.status !== 'pending') {
    throw new Error('Only pending entries can be approved');
  }

  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.approvalNotes = notes;

  return this.save();
};

journalEntrySchema.methods.reverse = async function (userId, reason) {
  if (this.status !== 'posted') {
    throw new Error('Only posted entries can be reversed');
  }

  // Create reversal entry
  const reversalLines = this.lines.map((line) => ({
    ...line.toObject(),
    type: line.type === 'debit' ? 'credit' : 'debit',
  }));

  const reversalEntry = new this.constructor({
    type: 'reversing',
    date: new Date(),
    reference: `Reversal of ${this.entryNumber}`,
    description: {
      ar: `عكس قيد ${this.entryNumber} - ${reason || ''}`,
      en: `Reversal of ${this.entryNumber} - ${reason || ''}`,
    },
    lines: reversalLines,
    originalEntry: this._id,
    createdBy: userId,
  });

  await reversalEntry.save();
  await reversalEntry.post(userId);

  // Mark this entry as reversed
  this.isReversed = true;
  this.reversedBy = userId;
  this.reversedAt = new Date();
  this.reversalEntry = reversalEntry._id;
  this.status = 'reversed';

  return this.save();
};

// Ensure virtual fields are included when converting to JSON
journalEntrySchema.set('toJSON', { virtuals: true });
journalEntrySchema.set('toObject', { virtuals: true });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry;
