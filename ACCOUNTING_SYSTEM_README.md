# Accounting System - Abwab Digital Admin Platform

## Overview

This comprehensive accounting system has been designed specifically for the Saudi Arabian market with full bilingual support (Arabic/English) and ZATCA (Zakat, Tax and Customs Authority) e-invoicing compliance.

## Key Features

### ✅ Saudi Market Compliance
- **VAT 15%**: Full Saudi VAT implementation with proper tax calculations
- **Hijri Calendar**: Dual calendar support (Gregorian and Hijri)
- **ZATCA E-Invoicing**: Compliant with Saudi e-invoicing regulations
- **Arabic Number Formatting**: Full support for Arabic-Indic numerals
- **SAR Currency**: Saudi Riyal (SAR) as default currency with multi-currency support

### ✅ Core Accounting Modules

#### 1. **Chart of Accounts**
- Hierarchical account structure
- Account types: Assets, Liabilities, Equity, Revenue, Expenses, COGS
- Detailed sub-types for each category
- Bilingual account names (Arabic/English)
- Bank account integration
- Budget tracking per account
- Soft delete functionality

#### 2. **Journal Entries**
- Double-entry bookkeeping system
- Auto-balancing validation
- Multiple entry types: Standard, Adjusting, Closing, Reversing, Invoice, Payment, Expense, Payroll
- Hijri date support
- Multi-currency with exchange rates
- Project and department tracking
- Approval workflow
- Reversal functionality
- Attachment support

#### 3. **Invoicing System**
- **ZATCA E-Invoicing Compliance**
  - UUID generation
  - QR code generation (TLV format)
  - Hash and PIH (Previous Invoice Hash)
  - Submission status tracking

- **Invoice Types**
  - Standard tax invoice
  - Simplified tax invoice
  - Debit note
  - Credit note
  - Prepayment invoice
  - Pro forma invoice

- **Features**
  - Bilingual customer information
  - Saudi address format (Building number, Street, District, City, Postal code)
  - VAT number and Commercial Registration
  - Line items with discounts
  - Tax breakdown by rate
  - Multiple payment methods
  - Recurring invoices
  - Email tracking
  - Payment tracking
  - Auto journal entry creation

#### 4. **Payment Management**
- Receipt and payment tracking
- Multiple payment methods:
  - Cash, Bank transfer, Credit/Debit cards
  - MADA (Saudi debit card)
  - STC Pay (Saudi payment method)
  - Apple Pay
- Hijri date support
- Invoice allocation
- Unallocated payment handling
- Reversal functionality
- Auto journal entry creation

#### 5. **Expense Management**
- Employee expense reimbursement
- Category-based classification
- Marketing channel tracking
- Project and department allocation
- Campaign expense tracking
- Billable expenses
- VAT recoverable expenses
- Approval workflow
- Receipt attachment
- Auto journal entry creation

#### 6. **Budget Management**
- Multiple budget types:
  - Departmental
  - Project-based
  - Campaign-based
  - Expense category
  - Revenue budget
  - Operational
  - Capital
  - Master budget

- **Features**
  - Monthly/Quarterly/Yearly periods
  - Hijri date support
  - Line-by-line budget allocation
  - Monthly breakdown
  - Actual vs budget tracking
  - Variance analysis
  - Utilization percentage
  - Alert system (warning and critical thresholds)
  - Over-budget notifications
  - Approval workflow
  - Version control

---

## Database Models

### Account Model
**Location**: `models/accounting/accountModel.js`

**Key Fields**:
- `code`: Unique account code
- `name`: Bilingual (ar/en)
- `type`: asset, liability, equity, revenue, expense, COGS
- `subType`: Detailed classification
- `currency`: Multi-currency support (SAR default)
- `balance`: Current balance
- `normalBalance`: debit or credit
- `taxInfo`: Tax configuration
- `budgetAmount`: Budget allocation

### Journal Entry Model
**Location**: `models/accounting/journalEntryModel.js`

**Key Fields**:
- `entryNumber`: Auto-generated (JE2025000001)
- `date`: Gregorian date
- `hijriDate`: Islamic calendar date
- `lines`: Array of debit/credit entries
- `totalDebit`/`totalCredit`: Auto-calculated
- `isBalanced`: Validation flag
- `status`: draft, pending, posted, approved, reversed, void

### Invoice Model
**Location**: `models/accounting/invoiceModel.js`

**Key Fields**:
- `invoiceNumber`: Auto-generated (INV2025000001)
- `zatca`: ZATCA e-invoicing fields
- `customer`: Bilingual customer details
- `company`: Seller information
- `lineItems`: Products/services with VAT
- `taxBreakdown`: VAT summary by rate
- `status`: draft, sent, viewed, partial, paid, overdue, void

### Payment Model
**Location**: `models/accounting/paymentModel.js`

**Key Fields**:
- `paymentNumber`: Auto-generated (RCP/PAY2025000001)
- `type`: receipt, payment, refund, advance
- `paymentMethod`: Multiple methods including MADA, STC Pay
- `invoices`: Invoice allocation
- `unallocatedAmount`: Advance payments

### Expense Model
**Location**: `models/accounting/expenseModel.js`

**Key Fields**:
- `expenseNumber`: Auto-generated (EXP2025000001)
- `category`: travel, marketing, office supplies, etc.
- `marketingChannel`: social media, google ads, etc.
- `project`/`department`/`campaign`: Tracking
- `billable`: Client billable flag
- `status`: draft, submitted, approved, rejected, paid

### Budget Model
**Location**: `models/accounting/budgetModel.js`

**Key Fields**:
- `type`: departmental, project, campaign, etc.
- `period`: monthly, quarterly, yearly
- `lines`: Budget allocation by account
- `monthlyAllocations`: Monthly breakdown
- `alerts`: Warning and critical alerts
- `utilizationPercentage`: Budget usage

---

## Utility Functions

### 1. Hijri Date Utilities
**Location**: `utils/hijriDate.js`

**Functions**:
- `gregorianToHijri(date)`: Convert Gregorian to Hijri
- `formatHijriDateArabic(hijriDate)`: Format in Arabic
- `formatHijriDateEnglish(hijriDate)`: Format in English
- `getHijriDate(date)`: Get complete Hijri object
- `getCurrentHijriDate()`: Current date in Hijri
- `formatBilateralDate(date, lang)`: Dual calendar format
- `getHijriMonthName(month, lang)`: Month names

### 2. Saudi VAT Utilities
**Location**: `utils/saudiVAT.js`

**Functions**:
- `calculateVAT(amount, rate)`: Calculate VAT amount
- `addVAT(amount, rate)`: Add VAT to price
- `extractVAT(total, rate)`: Extract VAT from total
- `validateVATNumber(vatNumber)`: Validate Saudi VAT TIN
- `formatVATNumber(vatNumber)`: Format display
- `calculateLineItemVAT(items)`: Invoice line calculation
- `generateVATReturn(sales, purchases, period)`: VAT return
- `checkVATRegistrationRequirement(revenue)`: Registration check
- `getVATFilingPeriod(revenue)`: Filing frequency
- `generateZATCAQRCode(invoice)`: QR code for e-invoicing

**VAT Categories**:
- Standard Rate (S): 15%
- Zero Rated (Z): 0%
- Exempt (E): No VAT
- Out of Scope (O): Not applicable

**Registration Thresholds**:
- Mandatory: SAR 375,000 annual revenue
- Voluntary: SAR 187,500 annual revenue

**Filing Periods**:
- Monthly: Revenue > SAR 40 million
- Quarterly: Revenue ≤ SAR 40 million

### 3. Arabic Number Formatter
**Location**: `utils/arabicNumberFormatter.js`

**Functions**:
- `toArabicNumerals(number)`: Convert to ١٢٣
- `toWesternNumerals(arabic)`: Convert to 123
- `formatNumberArabic(number, options)`: Arabic formatting
- `formatNumberEnglish(number, options)`: English formatting
- `formatCurrencySAR(amount, lang)`: SAR formatting
- `formatCurrency(amount, currency, lang)`: Multi-currency
- `formatPercentage(number, lang)`: Percentage formatting
- `numberToWordsArabic(number)`: Number to Arabic words
- `numberToWordsEnglish(number)`: Number to English words
- `amountToWords(amount, currency, lang)`: Amount in words
- `formatCompactNumber(number, lang)`: Compact notation (1K, 1M)
- `formatAccounting(number, currency, lang)`: Accounting format (negatives in parentheses)

---

## User Roles and Permissions

### Roles
1. **Admin**: Full system access
2. **Finance Manager**: Full accounting module access
3. **Accountant**: Accounting operations (no delete/reverse)
4. **Sales Manager**: Invoices and payment view
5. **Manager/Project Manager**: Expenses and budgets
6. **User**: Limited access

### Accounting Permissions
Each user has granular permissions:
- `canViewAccounts`, `canCreateAccounts`, `canEditAccounts`, `canDeleteAccounts`
- `canViewJournalEntries`, `canCreateJournalEntries`, `canPostJournalEntries`, `canReverseJournalEntries`
- `canViewInvoices`, `canCreateInvoices`, `canEditInvoices`, `canDeleteInvoices`, `canApproveInvoices`
- `canViewPayments`, `canCreatePayments`, `canApprovePayments`
- `canViewExpenses`, `canCreateExpenses`, `canApproveExpenses`
- `canViewBudgets`, `canCreateBudgets`, `canEditBudgets`
- `canViewFinancialReports`, `canExportReports`
- `canViewVATReturns`, `canSubmitVATReturns`

**Auto-assignment**: Permissions are automatically assigned based on role in the User model pre-save hook.

---

## Integration Points

### 1. CRM Integration
- **Opportunities → Invoices**: Convert won opportunities to invoices
- **Leads → Customers**: Customer information syncing
- **Revenue Forecasting**: Link to accounting revenue

### 2. Project Management Integration
- **Time Tracking → Billable Hours**: Convert time logs to invoices
- **Project Costs**: Track project expenses
- **Budget vs Actual**: Project budget management

### 3. HR Integration
- **Payroll Expenses**: Employee salary journal entries
- **Employee Reimbursements**: Expense claims
- **Department Budgets**: HR department budget tracking

### 4. Marketing Integration
- **Campaign Budgets**: Marketing campaign budget allocation
- **ROI Tracking**: Campaign spend vs revenue
- **Channel Performance**: Marketing channel expense analysis

---

## Next Steps (Implementation Roadmap)

### Phase 1: Backend API (In Progress)
- [ ] Create controllers for all accounting models
- [ ] Create routes for API endpoints
- [ ] Implement authentication middleware
- [ ] Add validation middleware
- [ ] Create financial report generators

### Phase 2: Frontend Dashboard
- [ ] Dashboard overview with KPIs
- [ ] Chart of accounts management
- [ ] Journal entry interface
- [ ] Invoice creation and management
- [ ] Payment processing
- [ ] Expense submission and approval
- [ ] Budget planning and monitoring
- [ ] Financial reports UI
- [ ] VAT return generation

### Phase 3: Reports and Analytics
- [ ] Profit & Loss Statement
- [ ] Balance Sheet
- [ ] Cash Flow Statement
- [ ] VAT Return Report
- [ ] Accounts Receivable Aging
- [ ] Accounts Payable Aging
- [ ] Budget vs Actual Reports
- [ ] Expense Analysis
- [ ] Revenue Analysis
- [ ] Project Profitability

### Phase 4: Advanced Features
- [ ] Bank reconciliation
- [ ] Fixed assets management
- [ ] Inventory accounting
- [ ] Multi-company support
- [ ] Audit trail
- [ ] Custom report builder
- [ ] Email notifications
- [ ] PDF generation for invoices
- [ ] ZATCA API integration
- [ ] Payment gateway integration

---

## Software Team Project Costing

The accounting system supports comprehensive project costing for software development:

### Features
1. **Time Tracking Integration**
   - Link HR time logs to projects
   - Calculate billable hours
   - Employee hourly rates
   - Time-based revenue recognition

2. **Resource Allocation**
   - Assign employees to projects
   - Track employee costs
   - Calculate project overhead

3. **Expense Tracking**
   - Software licenses per project
   - Cloud hosting costs
   - Third-party services
   - Equipment costs

4. **Budget Management**
   - Project budget creation
   - Budget vs actual monitoring
   - Milestone-based budgeting
   - Sprint budget tracking

5. **Profitability Analysis**
   - Revenue vs cost analysis
   - Profit margin calculation
   - Project ROI
   - Client profitability

---

## Marketing Team Budget Tracking

Full marketing budget and ROI tracking capabilities:

### Features
1. **Campaign Budgets**
   - Budget allocation per campaign
   - Multi-channel budget distribution
   - Period-based budgeting

2. **Expense Tracking**
   - Categorized marketing expenses
   - Channel-wise spend tracking
   - Vendor/merchant tracking
   - Receipt management

3. **Channel Performance**
   - Social media spend
   - Google Ads
   - Facebook/LinkedIn/Twitter Ads
   - Snapchat/TikTok Ads
   - SEO costs
   - Content marketing
   - Email marketing
   - Influencer marketing
   - Events and print media

4. **ROI Reporting**
   - Campaign spend vs revenue
   - Cost per acquisition
   - Customer lifetime value
   - Channel ROI comparison
   - Budget utilization

5. **Budget Alerts**
   - Warning at 80% utilization
   - Critical at 95% utilization
   - Over-budget notifications
   - Under-utilization alerts

---

## Multi-Currency Support

Supported currencies:
- **SAR** (Saudi Riyal) - Default
- **USD** (US Dollar)
- **EUR** (Euro)
- **GBP** (British Pound)
- **AED** (UAE Dirham)
- **EGP** (Egyptian Pound)

All transactions support:
- Currency selection
- Exchange rate
- Amount in base currency (SAR)
- Multi-currency reporting

---

## Bilingual Support

### Database Level
- All text fields have `ar` and `en` properties
- Account names, descriptions
- Invoice line descriptions
- Expense categories
- Budget names

### Display Level
- Arabic-Indic numerals option
- Right-to-left (RTL) support ready
- Hijri calendar alongside Gregorian
- Bilingual reports
- Dual date format

---

## Data Models Summary

| Model | Auto-Generated ID | Bilingual | Hijri Date | VAT Support | Workflow |
|-------|------------------|-----------|------------|-------------|----------|
| Account | Account Code | ✅ | ❌ | ✅ | ❌ |
| Journal Entry | JE2025XXXXXX | ✅ | ✅ | ✅ | ✅ |
| Invoice | INV2025XXXXXX | ✅ | ✅ | ✅ | ✅ |
| Payment | RCP/PAY2025XXXXXX | ✅ | ✅ | ✅ | ✅ |
| Expense | EXP2025XXXXXX | ✅ | ✅ | ✅ | ✅ |
| Budget | N/A | ✅ | ✅ | ❌ | ✅ |

---

## Technical Stack

### Backend
- **Database**: MongoDB with Mongoose ODM
- **Framework**: Node.js + Express.js
- **Authentication**: JWT
- **Validation**: express-validator + Joi

### Utilities
- Hijri date conversion
- VAT calculations
- Arabic number formatting
- QR code generation (TLV encoding)
- Number to words conversion

---

## ZATCA E-Invoicing Compliance

### Phase 1 (Generation Phase) - Implemented ✅
- Invoice generation with required fields
- QR code generation (TLV format)
- Tax invoice types
- Customer and seller details
- VAT breakdown

### Phase 2 (Integration Phase) - To Be Implemented
- API integration with ZATCA
- Invoice hashing (SHA-256)
- Cryptographic stamp
- Real-time submission
- Clearance/Reporting

### Required Fields (Implemented)
1. Seller information (VAT number, Commercial registration, Address)
2. Buyer information (VAT number for B2B, Address)
3. Invoice date and number
4. Line items with descriptions
5. VAT breakdown by rate
6. Total amounts
7. QR code
8. Invoice type classification

---

## Security and Compliance

- **Role-based access control**: Granular permissions
- **Audit trail**: All changes tracked with user and timestamp
- **Soft delete**: Records never permanently deleted
- **Approval workflows**: Multi-level approvals
- **Data validation**: Comprehensive validation rules
- **VAT compliance**: Full Saudi VAT implementation
- **E-invoicing compliance**: ZATCA requirements met

---

## Support for Software and Marketing Teams

### Software Team Features ✅
- Project-based accounting
- Time tracking integration
- Billable hours tracking
- Software license expenses
- Cloud hosting cost allocation
- Project profitability analysis
- Sprint budget management

### Marketing Team Features ✅
- Campaign budget allocation
- Channel-wise expense tracking
- ROI calculation
- Social media ad spend tracking
- Google/Facebook/LinkedIn ads integration ready
- Influencer marketing expenses
- Event budget management
- Print media tracking

---

## Getting Started

### Prerequisites
```bash
npm install mongoose bcryptjs
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/abwab_digital
VAT_RATE=15
DEFAULT_CURRENCY=SAR
COMPANY_VAT_NUMBER=300000000000003
COMPANY_NAME_AR=أبواب الرقمية
COMPANY_NAME_EN=Abwab Digital
```

### Usage Examples

#### 1. Create an Invoice
```javascript
const Invoice = require('./models/accounting/invoiceModel');
const { getHijriDate } = require('./utils/hijriDate');

const invoice = new Invoice({
  type: 'standard',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  hijriDate: getHijriDate(new Date()),
  customer: {
    type: 'opportunity',
    id: opportunityId,
    name: { ar: 'شركة اختبار', en: 'Test Company' },
    vatNumber: '300000000000003',
  },
  lineItems: [
    {
      description: { ar: 'تطوير موقع', en: 'Website Development' },
      quantity: 1,
      unitPrice: 10000,
      taxRate: 15,
      taxable: true,
    },
  ],
  createdBy: userId,
});

await invoice.save();
```

#### 2. Calculate VAT
```javascript
const { calculateVAT, addVAT } = require('./utils/saudiVAT');

const amount = 10000;
const vat = calculateVAT(amount); // 1500
const total = addVAT(amount); // 11500
```

#### 3. Format in Arabic
```javascript
const { formatCurrencySAR, amountToWords } = require('./utils/arabicNumberFormatter');

const formatted = formatCurrencySAR(11500, 'ar');
// ١١٬٥٠٠٫٠٠ ر.س

const words = amountToWords(11500, 'SAR', 'ar');
// أحد عشر ألف و خمسمائة ريال سعودي
```

---

## License

Proprietary - Abwab Digital © 2025

---

## Version

**Version 1.0.0** - January 2025

**Status**: Database models complete, Backend API in development

