/**
 * Saudi Arabia VAT (Value Added Tax) Utilities
 * VAT Rate: 15% (as of July 1, 2020)
 * ZATCA (Zakat, Tax and Customs Authority) Compliance
 */

const SAUDI_VAT_RATE = 15; // 15% standard rate
const SAUDI_VAT_ZERO_RATE = 0; // Zero-rated supplies
const SAUDI_VAT_EXEMPT_RATE = null; // Exempt supplies (no VAT)

/**
 * VAT Categories according to ZATCA
 */
const VAT_CATEGORIES = {
  STANDARD: {
    code: 'S',
    rate: 15,
    nameAr: 'معدل قياسي',
    nameEn: 'Standard Rate',
  },
  ZERO_RATED: {
    code: 'Z',
    rate: 0,
    nameAr: 'معدل صفري',
    nameEn: 'Zero Rated',
    examples: ['International exports', 'International transportation'],
  },
  EXEMPT: {
    code: 'E',
    rate: null,
    nameAr: 'معفى',
    nameEn: 'Exempt',
    examples: ['Certain financial services', 'Residential property leasing', 'Local passenger transport'],
  },
  OUT_OF_SCOPE: {
    code: 'O',
    rate: null,
    nameAr: 'خارج النطاق',
    nameEn: 'Out of Scope',
    examples: ['Transactions outside Saudi Arabia', 'Non-business activities'],
  },
};

/**
 * Calculate VAT amount from price
 */
function calculateVAT(amount, rate = SAUDI_VAT_RATE) {
  if (rate === null || rate === 0) return 0;
  return Math.round((amount * rate) / 100 * 100) / 100;
}

/**
 * Calculate price including VAT
 */
function addVAT(amount, rate = SAUDI_VAT_RATE) {
  const vatAmount = calculateVAT(amount, rate);
  return Math.round((amount + vatAmount) * 100) / 100;
}

/**
 * Extract VAT from total price (VAT-inclusive price)
 */
function extractVAT(totalAmount, rate = SAUDI_VAT_RATE) {
  if (rate === null || rate === 0) return { amount: totalAmount, vat: 0 };

  const amount = Math.round((totalAmount / (1 + rate / 100)) * 100) / 100;
  const vat = Math.round((totalAmount - amount) * 100) / 100;

  return { amount, vat };
}

/**
 * Validate Saudi VAT number (TIN - Tax Identification Number)
 * Format: 15 digits (e.g., 300000000000003)
 * First digit: always 3
 * Last digit: check digit
 */
function validateVATNumber(vatNumber) {
  if (!vatNumber) return false;

  // Remove any spaces or hyphens
  const cleanVAT = vatNumber.toString().replace(/[\s-]/g, '');

  // Must be 15 digits
  if (cleanVAT.length !== 15) return false;

  // Must start with 3
  if (cleanVAT[0] !== '3') return false;

  // Must be all digits
  if (!/^\d+$/.test(cleanVAT)) return false;

  return true;
}

/**
 * Format VAT number for display
 */
function formatVATNumber(vatNumber) {
  if (!vatNumber) return '';
  const cleanVAT = vatNumber.toString().replace(/[\s-]/g, '');

  if (cleanVAT.length !== 15) return vatNumber;

  // Format as: 300-0000-00000-003
  return `${cleanVAT.slice(0, 3)}-${cleanVAT.slice(3, 7)}-${cleanVAT.slice(7, 12)}-${cleanVAT.slice(12)}`;
}

/**
 * Calculate VAT for invoice line items
 */
function calculateLineItemVAT(lineItems) {
  let totalBeforeVAT = 0;
  let totalVAT = 0;
  const vatBreakdown = {};

  lineItems.forEach((item) => {
    const { quantity, unitPrice, discount = 0, taxRate = SAUDI_VAT_RATE, taxable = true } = item;

    // Calculate line subtotal
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discount) / 100;
    const lineTotal = subtotal - discountAmount;

    totalBeforeVAT += lineTotal;

    // Calculate VAT
    if (taxable && taxRate > 0) {
      const lineVAT = calculateVAT(lineTotal, taxRate);
      totalVAT += lineVAT;

      // Track VAT by rate
      const rateKey = `${taxRate}%`;
      if (!vatBreakdown[rateKey]) {
        vatBreakdown[rateKey] = {
          rate: taxRate,
          taxableAmount: 0,
          taxAmount: 0,
        };
      }
      vatBreakdown[rateKey].taxableAmount += lineTotal;
      vatBreakdown[rateKey].taxAmount += lineVAT;
    }
  });

  return {
    totalBeforeVAT: Math.round(totalBeforeVAT * 100) / 100,
    totalVAT: Math.round(totalVAT * 100) / 100,
    totalIncludingVAT: Math.round((totalBeforeVAT + totalVAT) * 100) / 100,
    vatBreakdown: Object.values(vatBreakdown),
  };
}

/**
 * Generate VAT return summary for a period
 */
function generateVATReturn(sales, purchases, period) {
  const outputVAT = sales.reduce((sum, sale) => sum + (sale.vatAmount || 0), 0);
  const inputVAT = purchases.reduce((sum, purchase) => sum + (purchase.vatAmount || 0), 0);

  const netVAT = outputVAT - inputVAT;

  return {
    period,
    outputVAT: Math.round(outputVAT * 100) / 100,
    inputVAT: Math.round(inputVAT * 100) / 100,
    netVAT: Math.round(netVAT * 100) / 100,
    payable: netVAT > 0 ? Math.round(netVAT * 100) / 100 : 0,
    refundable: netVAT < 0 ? Math.round(Math.abs(netVAT) * 100) / 100 : 0,
    totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
    totalPurchases: purchases.reduce((sum, purchase) => sum + purchase.total, 0),
  };
}

/**
 * Check if business is VAT registered based on revenue threshold
 * Mandatory registration: SAR 375,000 annual revenue
 * Voluntary registration: SAR 187,500 annual revenue
 */
function checkVATRegistrationRequirement(annualRevenue) {
  const MANDATORY_THRESHOLD = 375000; // SAR
  const VOLUNTARY_THRESHOLD = 187500; // SAR

  if (annualRevenue >= MANDATORY_THRESHOLD) {
    return {
      required: true,
      type: 'mandatory',
      threshold: MANDATORY_THRESHOLD,
      messageAr: 'التسجيل في ضريبة القيمة المضافة إلزامي',
      messageEn: 'VAT registration is mandatory',
    };
  } else if (annualRevenue >= VOLUNTARY_THRESHOLD) {
    return {
      required: false,
      type: 'voluntary',
      threshold: VOLUNTARY_THRESHOLD,
      messageAr: 'يمكن التسجيل الاختياري في ضريبة القيمة المضافة',
      messageEn: 'Voluntary VAT registration is available',
    };
  } else {
    return {
      required: false,
      type: 'not_applicable',
      threshold: VOLUNTARY_THRESHOLD,
      messageAr: 'التسجيل في ضريبة القيمة المضافة غير مطلوب',
      messageEn: 'VAT registration is not required',
    };
  }
}

/**
 * Get VAT filing periods
 * Monthly: For businesses with annual taxable revenue > SAR 40 million
 * Quarterly: For businesses with annual taxable revenue ≤ SAR 40 million
 */
function getVATFilingPeriod(annualRevenue) {
  const MONTHLY_THRESHOLD = 40000000; // SAR 40 million

  if (annualRevenue > MONTHLY_THRESHOLD) {
    return {
      period: 'monthly',
      nameAr: 'شهري',
      nameEn: 'Monthly',
      deadlineDays: 30, // Last day of month following the tax period
    };
  } else {
    return {
      period: 'quarterly',
      nameAr: 'ربع سنوي',
      nameEn: 'Quarterly',
      deadlineDays: 30, // Last day of month following the tax period
    };
  }
}

/**
 * Format amount in Saudi Riyal
 */
function formatSAR(amount, language = 'ar') {
  const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

/**
 * Get VAT category information
 */
function getVATCategory(categoryCode) {
  const categories = Object.values(VAT_CATEGORIES);
  return categories.find((cat) => cat.code === categoryCode) || VAT_CATEGORIES.STANDARD;
}

/**
 * Generate QR code data for ZATCA e-invoicing
 * Format: TLV (Tag-Length-Value) encoding
 */
function generateZATCAQRCode(invoice) {
  // TLV encoding function
  const tlvEncode = (tag, value) => {
    const tagHex = tag.toString(16).padStart(2, '0');
    const length = Buffer.byteLength(value, 'utf8');
    const lengthHex = length.toString(16).padStart(2, '0');
    return tagHex + lengthHex + Buffer.from(value, 'utf8').toString('hex');
  };

  // Required fields for ZATCA QR code
  let qrData = '';

  // Tag 1: Seller name
  qrData += tlvEncode(1, invoice.sellerName || '');

  // Tag 2: VAT registration number
  qrData += tlvEncode(2, invoice.sellerVATNumber || '');

  // Tag 3: Invoice timestamp
  qrData += tlvEncode(3, invoice.issueDate?.toISOString() || '');

  // Tag 4: Invoice total (with VAT)
  qrData += tlvEncode(4, invoice.total?.toString() || '0');

  // Tag 5: VAT total
  qrData += tlvEncode(5, invoice.totalVAT?.toString() || '0');

  // Convert hex to base64
  const qrBase64 = Buffer.from(qrData, 'hex').toString('base64');

  return qrBase64;
}

module.exports = {
  SAUDI_VAT_RATE,
  VAT_CATEGORIES,
  calculateVAT,
  addVAT,
  extractVAT,
  validateVATNumber,
  formatVATNumber,
  calculateLineItemVAT,
  generateVATReturn,
  checkVATRegistrationRequirement,
  getVATFilingPeriod,
  formatSAR,
  getVATCategory,
  generateZATCAQRCode,
};
