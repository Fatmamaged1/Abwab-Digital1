const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Payment Number - Auto-generated
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    // Payment Type
    type: {
      type: String,
      enum: ['receipt', 'payment', 'refund', 'advance'],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'pending', 'completed', 'failed', 'cancelled', 'reversed'],
      default: 'draft',
    },

    // Date Information
    paymentDate: {
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

    // Customer/Vendor Information
    party: {
      type: {
        type: String,
        enum: ['customer', 'vendor', 'employee', 'other'],
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        ar: String,
        en: String,
      },
      email: String,
      phone: String,
    },

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

    // Payment Method
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'bank_transfer',
        'credit_card',
        'debit_card',
        'cheque',
        'online_payment',
        'mada', // Saudi debit card system
        'stc_pay', // Saudi payment method
        'apple_pay',
        'other',
      ],
      required: true,
    },

    // Payment Details
    paymentDetails: {
      // For bank transfers
      bankName: String,
      accountNumber: String,
      iban: String,
      swiftCode: String,
      transferReference: String,

      // For cards
      cardType: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'mada', 'other'],
      },
      last4Digits: String,
      cardHolderName: String,

      // For cheques
      chequeNumber: String,
      chequeDate: Date,
      chequeBank: String,

      // For online payments
      transactionId: String,
      gatewayName: String,
      gatewayFee: Number,

      // General
      referenceNumber: String,
    },

    // Related Invoices/Bills
    invoices: [
      {
        invoice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Invoice',
        },
        invoiceNumber: String,
        invoiceAmount: Number,
        amountPaid: Number,
        allocatedAmount: Number,
      },
    ],

    // Unallocated Amount
    unallocatedAmount: {
      type: Number,
      default: 0,
    },

    // Bank Account (where money is received/paid)
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },

    // Description and Notes
    description: {
      ar: String,
      en: String,
    },
    notes: String,
    internalNotes: String,

    // Receipt Information
    receiptNumber: String,
    receiptUrl: String, // PDF URL
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptSentAt: Date,

    // Journal Entry
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
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
    reversedAt: Date,
    reversalPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    originalPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

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
      },
    ],

    // Approval Workflow
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,

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
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ 'party.id': 1 });
paymentSchema.index({ isDeleted: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware
paymentSchema.pre('save', async function (next) {
  // Auto-generate payment number
  if (!this.paymentNumber) {
    const year = new Date().getFullYear();
    const prefix = this.type === 'receipt' ? 'RCP' : 'PAY';
    const count = await this.constructor.countDocuments({
      paymentNumber: new RegExp(`^${prefix}${year}`),
    });
    this.paymentNumber = `${prefix}${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate amount in base currency
  if (this.currency !== 'SAR') {
    this.amountInBaseCurrency = this.amount * this.exchangeRate;
  } else {
    this.amountInBaseCurrency = this.amount;
  }

  // Calculate unallocated amount
  let totalAllocated = 0;
  this.invoices.forEach((inv) => {
    totalAllocated += inv.allocatedAmount || 0;
  });
  this.unallocatedAmount = this.amount - totalAllocated;

  next();
});

// Query middleware to exclude soft-deleted documents
paymentSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
paymentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'cancelled';
  return this.save();
};

paymentSchema.methods.complete = async function (userId) {
  if (this.status !== 'draft' && this.status !== 'pending') {
    throw new Error('Only draft or pending payments can be completed');
  }

  this.status = 'completed';

  // Create journal entry
  await this.createJournalEntry(userId);

  // Update related invoices
  const Invoice = mongoose.model('Invoice');
  for (const invItem of this.invoices) {
    if (invItem.invoice && invItem.allocatedAmount > 0) {
      const invoice = await Invoice.findById(invItem.invoice);
      if (invoice) {
        await invoice.recordPayment(this._id, invItem.allocatedAmount);
      }
    }
  }

  return this.save();
};

paymentSchema.methods.createJournalEntry = async function (userId) {
  const JournalEntry = mongoose.model('JournalEntry');

  const lines = [];

  if (this.type === 'receipt') {
    // Receipt: Money coming in
    // Debit: Bank/Cash Account
    lines.push({
      account: this.bankAccount,
      description: {
        ar: `استلام دفعة ${this.paymentNumber}`,
        en: `Payment received ${this.paymentNumber}`,
      },
      type: 'debit',
      amount: this.amountInBaseCurrency,
      currency: this.currency,
    });

    // Credit: Accounts Receivable (if allocated to invoices)
    if (this.invoices && this.invoices.length > 0) {
      const totalAllocated = this.invoices.reduce((sum, inv) => sum + (inv.allocatedAmount || 0), 0);
      if (totalAllocated > 0) {
        lines.push({
          account: await this.getAccountsReceivableAccount(),
          description: {
            ar: `سداد فواتير ${this.paymentNumber}`,
            en: `Invoice payment ${this.paymentNumber}`,
          },
          type: 'credit',
          amount: totalAllocated,
          currency: this.currency,
        });
      }
    }

    // Credit: Unallocated Revenue (if any unallocated amount)
    if (this.unallocatedAmount > 0) {
      lines.push({
        account: await this.getUnallocatedRevenueAccount(),
        description: {
          ar: `دفعة مقدمة ${this.paymentNumber}`,
          en: `Advance payment ${this.paymentNumber}`,
        },
        type: 'credit',
        amount: this.unallocatedAmount,
        currency: this.currency,
      });
    }
  } else if (this.type === 'payment') {
    // Payment: Money going out
    // Credit: Bank/Cash Account
    lines.push({
      account: this.bankAccount,
      description: {
        ar: `دفع ${this.paymentNumber}`,
        en: `Payment made ${this.paymentNumber}`,
      },
      type: 'credit',
      amount: this.amountInBaseCurrency,
      currency: this.currency,
    });

    // Debit: Accounts Payable or Expense
    lines.push({
      account: await this.getAccountsPayableAccount(),
      description: {
        ar: `سداد مدفوعات ${this.paymentNumber}`,
        en: `Payment ${this.paymentNumber}`,
      },
      type: 'debit',
      amount: this.amountInBaseCurrency,
      currency: this.currency,
    });
  }

  const journalEntry = new JournalEntry({
    type: 'payment',
    date: this.paymentDate,
    reference: this.paymentNumber,
    description: {
      ar: `قيد دفعة ${this.paymentNumber}`,
      en: `Payment ${this.paymentNumber} entry`,
    },
    lines,
    relatedDocuments: [
      {
        documentType: 'payment',
        documentId: this._id,
        documentNumber: this.paymentNumber,
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

paymentSchema.methods.reverse = async function (userId, reason) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be reversed');
  }

  // Create reversal payment
  const reversalPayment = new this.constructor({
    type: this.type,
    paymentDate: new Date(),
    party: this.party,
    amount: -this.amount,
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    description: {
      ar: `عكس دفعة ${this.paymentNumber} - ${reason || ''}`,
      en: `Reversal of ${this.paymentNumber} - ${reason || ''}`,
    },
    originalPayment: this._id,
    createdBy: userId,
  });

  await reversalPayment.save();
  await reversalPayment.complete(userId);

  // Mark this payment as reversed
  this.isReversed = true;
  this.reversedBy = userId;
  this.reversedAt = new Date();
  this.reversalPayment = reversalPayment._id;
  this.status = 'reversed';

  // Reverse journal entry
  if (this.journalEntry) {
    const JournalEntry = mongoose.model('JournalEntry');
    const journalEntry = await JournalEntry.findById(this.journalEntry);
    if (journalEntry) {
      await journalEntry.reverse(userId, reason);
    }
  }

  return this.save();
};

// Helper methods
paymentSchema.methods.getAccountsReceivableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '1200', type: 'asset' });
  return account?._id;
};

paymentSchema.methods.getAccountsPayableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '2100', type: 'liability' });
  return account?._id;
};

paymentSchema.methods.getUnallocatedRevenueAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '2300', subType: 'other_current_liability' });
  return account?._id;
};

// Ensure virtual fields are included when converting to JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
