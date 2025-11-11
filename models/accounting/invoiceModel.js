const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    // Invoice Number - Auto-generated
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    // ZATCA E-Invoicing Fields (Saudi Arabia)
    zatca: {
      uuid: {
        type: String,
        unique: true,
        sparse: true,
      },
      hash: String,
      qrCode: String, // Base64 encoded QR code
      submissionStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected', 'cleared'],
        default: 'not_submitted',
      },
      submittedAt: Date,
      clearedAt: Date,
      rejectionReason: String,
      pihHash: String, // Previous Invoice Hash
    },

    // Invoice Type
    type: {
      type: String,
      enum: [
        'standard', // Standard tax invoice
        'simplified', // Simplified tax invoice (retail)
        'debit_note', // Debit note
        'credit_note', // Credit note
        'prepayment', // Advance payment
        'proforma', // Pro forma invoice
      ],
      required: true,
      default: 'standard',
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled'],
      default: 'draft',
    },

    // Date Information
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    hijriDate: {
      year: Number,
      month: Number,
      day: Number,
      formatted: String,
    },

    // Customer Information
    customer: {
      type: {
        type: String,
        enum: ['lead', 'opportunity', 'customer'],
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'customer.type',
      },
      // Stored customer details for historical record
      name: {
        ar: String,
        en: String,
      },
      email: String,
      phone: String,
      // Saudi-specific fields
      vatNumber: String, // الرقم الضريبي
      commercialRegistration: String, // السجل التجاري
      buildingNumber: String,
      streetName: {
        ar: String,
        en: String,
      },
      district: {
        ar: String,
        en: String,
      },
      city: {
        ar: String,
        en: String,
      },
      country: {
        ar: String,
        en: String,
      },
      postalCode: String,
      additionalNumber: String,
    },

    // Company Information (Seller)
    company: {
      name: {
        ar: String,
        en: String,
      },
      vatNumber: String,
      commercialRegistration: String,
      buildingNumber: String,
      streetName: {
        ar: String,
        en: String,
      },
      district: {
        ar: String,
        en: String,
      },
      city: {
        ar: String,
        en: String,
      },
      country: {
        ar: String,
        en: String,
      },
      postalCode: String,
      additionalNumber: String,
    },

    // Invoice Lines
    lineItems: [
      {
        lineNumber: {
          type: Number,
          required: true,
        },
        description: {
          ar: {
            type: String,
            required: true,
          },
          en: {
            type: String,
            required: true,
          },
        },
        // Product/Service Code
        itemCode: String,
        // ZATCA Item Classification
        itemClassification: {
          code: String, // e.g., "44111501" (UNSPSC code)
          name: {
            ar: String,
            en: String,
          },
        },
        quantity: {
          type: Number,
          required: true,
          min: [0, 'Quantity must be positive'],
          default: 1,
        },
        unit: {
          type: String,
          default: 'unit',
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, 'Unit price must be positive'],
        },
        discount: {
          type: Number,
          min: [0, 'Discount cannot be negative'],
          max: [100, 'Discount cannot exceed 100%'],
          default: 0,
        },
        discountAmount: {
          type: Number,
          default: 0,
        },
        // Tax Information (VAT 15% for Saudi)
        taxable: {
          type: Boolean,
          default: true,
        },
        taxRate: {
          type: Number,
          default: 15, // Saudi VAT rate
        },
        taxAmount: {
          type: Number,
          default: 0,
        },
        taxCategory: {
          type: String,
          enum: ['standard', 'zero_rated', 'exempt', 'outside_scope'],
          default: 'standard',
        },
        taxCategoryCode: String, // e.g., "S" for standard rate
        // Subtotal and Total
        subtotal: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
        // Project/Department tracking
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Project',
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
        },
        // Revenue account
        revenueAccount: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Account',
        },
      },
    ],

    // Financial Totals
    subtotal: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalBeforeTax: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    // Tax Breakdown by Rate
    taxBreakdown: [
      {
        taxRate: Number,
        taxableAmount: Number,
        taxAmount: Number,
      },
    ],
    total: {
      type: Number,
      required: true,
    },

    // Currency
    currency: {
      type: String,
      enum: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP'],
      default: 'SAR',
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },

    // Payment Information
    paymentTerms: {
      ar: String,
      en: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'credit_card', 'cheque', 'other'],
    },
    bankDetails: {
      bankName: String,
      accountName: String,
      accountNumber: String,
      iban: String,
      swiftCode: String,
    },

    // Payment Tracking
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
    },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
      },
    ],

    // Notes and Terms
    notes: {
      ar: String,
      en: String,
    },
    termsAndConditions: {
      ar: String,
      en: String,
    },
    internalNotes: String, // Not visible to customer

    // Related Documents
    relatedOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
    },
    relatedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    parentInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice', // For credit notes
    },

    // Journal Entry
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
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

    // Email Tracking
    emailHistory: [
      {
        sentTo: String,
        sentAt: Date,
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewed: Boolean,
        viewedAt: Date,
      },
    ],

    // System Fields
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      },
      startDate: Date,
      endDate: Date,
      nextInvoiceDate: Date,
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
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ 'customer.id': 1 });
invoiceSchema.index({ 'zatca.uuid': 1 });
invoiceSchema.index({ isDeleted: 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtuals
invoiceSchema.virtual('isPaid').get(function () {
  return this.status === 'paid';
});

invoiceSchema.virtual('isOverdue').get(function () {
  return this.status !== 'paid' && this.dueDate < new Date();
});

invoiceSchema.virtual('daysPastDue').get(function () {
  if (!this.isOverdue) return 0;
  return Math.floor((Date.now() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
invoiceSchema.pre('save', async function (next) {
  // Auto-generate invoice number
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      invoiceNumber: new RegExp(`^INV${year}`),
    });
    this.invoiceNumber = `INV${year}${String(count + 1).padStart(6, '0')}`;
  }

  // Generate ZATCA UUID for e-invoicing
  if (!this.zatca.uuid && this.status !== 'draft') {
    const { v4: uuidv4 } = require('uuid');
    this.zatca.uuid = uuidv4();
  }

  // Calculate line items
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  const taxBreakdown = {};

  this.lineItems.forEach((line, index) => {
    line.lineNumber = index + 1;

    // Calculate discount amount
    line.discountAmount = (line.unitPrice * line.quantity * line.discount) / 100;

    // Calculate subtotal (before tax)
    line.subtotal = line.unitPrice * line.quantity - line.discountAmount;

    // Calculate tax
    if (line.taxable && line.taxRate > 0) {
      line.taxAmount = (line.subtotal * line.taxRate) / 100;

      // Track tax by rate
      if (!taxBreakdown[line.taxRate]) {
        taxBreakdown[line.taxRate] = {
          taxRate: line.taxRate,
          taxableAmount: 0,
          taxAmount: 0,
        };
      }
      taxBreakdown[line.taxRate].taxableAmount += line.subtotal;
      taxBreakdown[line.taxRate].taxAmount += line.taxAmount;
    } else {
      line.taxAmount = 0;
    }

    // Calculate total for line
    line.total = line.subtotal + line.taxAmount;

    // Add to invoice totals
    subtotal += line.unitPrice * line.quantity;
    totalDiscount += line.discountAmount;
    totalTax += line.taxAmount;
  });

  // Round to 2 decimal places
  this.subtotal = Math.round(subtotal * 100) / 100;
  this.totalDiscount = Math.round(totalDiscount * 100) / 100;
  this.totalBeforeTax = Math.round((subtotal - totalDiscount) * 100) / 100;
  this.totalTax = Math.round(totalTax * 100) / 100;
  this.total = Math.round((this.totalBeforeTax + this.totalTax) * 100) / 100;

  // Set tax breakdown
  this.taxBreakdown = Object.values(taxBreakdown);

  // Calculate amount due
  this.amountDue = this.total - (this.amountPaid || 0);

  // Update status based on payment
  if (this.amountPaid >= this.total && this.status !== 'void' && this.status !== 'cancelled') {
    this.status = 'paid';
  } else if (this.amountPaid > 0 && this.amountPaid < this.total) {
    this.status = 'partial';
  } else if (this.dueDate < new Date() && this.amountPaid < this.total && this.status !== 'draft') {
    this.status = 'overdue';
  }

  next();
});

// Query middleware to exclude soft-deleted documents
invoiceSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
invoiceSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'void';
  return this.save();
};

invoiceSchema.methods.send = async function (userId, recipientEmail) {
  this.status = 'sent';
  this.emailHistory.push({
    sentTo: recipientEmail,
    sentAt: new Date(),
    sentBy: userId,
    viewed: false,
  });
  return this.save();
};

invoiceSchema.methods.recordPayment = async function (paymentId, amount) {
  this.payments.push(paymentId);
  this.amountPaid += amount;
  return this.save();
};

invoiceSchema.methods.createJournalEntry = async function (userId) {
  const JournalEntry = mongoose.model('JournalEntry');

  // Create journal entry lines
  const lines = [];

  // Debit: Accounts Receivable
  lines.push({
    account: await this.getAccountsReceivableAccount(),
    description: {
      ar: `فاتورة ${this.invoiceNumber}`,
      en: `Invoice ${this.invoiceNumber}`,
    },
    type: 'debit',
    amount: this.total,
    currency: this.currency,
  });

  // Credit: Revenue accounts by line item
  const revenueByAccount = {};
  this.lineItems.forEach((line) => {
    const accountId = line.revenueAccount?.toString() || 'default';
    if (!revenueByAccount[accountId]) {
      revenueByAccount[accountId] = 0;
    }
    revenueByAccount[accountId] += line.subtotal;
  });

  for (const [accountId, amount] of Object.entries(revenueByAccount)) {
    lines.push({
      account: accountId === 'default' ? await this.getDefaultRevenueAccount() : accountId,
      description: {
        ar: `إيراد من فاتورة ${this.invoiceNumber}`,
        en: `Revenue from invoice ${this.invoiceNumber}`,
      },
      type: 'credit',
      amount,
      currency: this.currency,
    });
  }

  // Credit: Tax Payable (if any tax)
  if (this.totalTax > 0) {
    lines.push({
      account: await this.getTaxPayableAccount(),
      description: {
        ar: `ضريبة القيمة المضافة ${this.invoiceNumber}`,
        en: `VAT from invoice ${this.invoiceNumber}`,
      },
      type: 'credit',
      amount: this.totalTax,
      currency: this.currency,
    });
  }

  const journalEntry = new JournalEntry({
    type: 'invoice',
    date: this.issueDate,
    reference: this.invoiceNumber,
    description: {
      ar: `قيد فاتورة ${this.invoiceNumber}`,
      en: `Invoice ${this.invoiceNumber} entry`,
    },
    lines,
    relatedDocuments: [
      {
        documentType: 'invoice',
        documentId: this._id,
        documentNumber: this.invoiceNumber,
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

// Helper methods to get default accounts (should be configured in settings)
invoiceSchema.methods.getAccountsReceivableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '1200', type: 'asset' });
  return account?._id;
};

invoiceSchema.methods.getDefaultRevenueAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '4000', type: 'revenue' });
  return account?._id;
};

invoiceSchema.methods.getTaxPayableAccount = async function () {
  const Account = mongoose.model('Account');
  const account = await Account.findOne({ code: '2200', subType: 'tax_payable' });
  return account?._id;
};

// Ensure virtual fields are included when converting to JSON
invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
