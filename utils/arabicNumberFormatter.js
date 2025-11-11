/**
 * Arabic Number Formatting Utilities
 * Handles number formatting for both Arabic and English with proper localization
 */

// Arabic-Indic numerals mapping
const ARABIC_NUMERALS = {
  0: '٠',
  1: '١',
  2: '٢',
  3: '٣',
  4: '٤',
  5: '٥',
  6: '٦',
  7: '٧',
  8: '٨',
  9: '٩',
};

/**
 * Convert Western numerals to Arabic-Indic numerals
 */
function toArabicNumerals(number) {
  if (number === null || number === undefined) return '';

  return number
    .toString()
    .split('')
    .map((char) => ARABIC_NUMERALS[char] || char)
    .join('');
}

/**
 * Convert Arabic-Indic numerals to Western numerals
 */
function toWesternNumerals(arabicNumber) {
  if (!arabicNumber) return '';

  const reverseMap = Object.entries(ARABIC_NUMERALS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});

  return arabicNumber
    .toString()
    .split('')
    .map((char) => reverseMap[char] || char)
    .join('');
}

/**
 * Format number with Arabic locale
 */
function formatNumberArabic(number, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useArabicNumerals = true,
    useGrouping = true,
  } = options;

  if (number === null || number === undefined || isNaN(number)) return '';

  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(number);

  return useArabicNumerals ? toArabicNumerals(formatted) : formatted;
}

/**
 * Format number with English locale
 */
function formatNumberEnglish(number, options = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, useGrouping = true } = options;

  if (number === null || number === undefined || isNaN(number)) return '';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(number);
}

/**
 * Format currency in Saudi Riyal (SAR)
 */
function formatCurrencySAR(amount, language = 'ar', options = {}) {
  const { showSymbol = true, useArabicNumerals = language === 'ar' } = options;

  if (amount === null || amount === undefined || isNaN(amount)) return '';

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (language === 'ar' && useArabicNumerals) {
    return toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Format currency for multiple currencies
 */
function formatCurrency(amount, currency = 'SAR', language = 'ar', options = {}) {
  const { useArabicNumerals = language === 'ar' } = options;

  if (amount === null || amount === undefined || isNaN(amount)) return '';

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (language === 'ar' && useArabicNumerals) {
    return toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Format percentage
 */
function formatPercentage(number, language = 'ar', options = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, useArabicNumerals = language === 'ar' } = options;

  if (number === null || number === undefined || isNaN(number)) return '';

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(number / 100);

  if (language === 'ar' && useArabicNumerals) {
    return toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Convert number to words in Arabic
 */
function numberToWordsArabic(number) {
  if (number === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = [
    '',
    'مائة',
    'مئتان',
    'ثلاثمائة',
    'أربعمائة',
    'خمسمائة',
    'ستمائة',
    'سبعمائة',
    'ثمانمائة',
    'تسعمائة',
  ];
  const teens = [
    'عشرة',
    'أحد عشر',
    'اثنا عشر',
    'ثلاثة عشر',
    'أربعة عشر',
    'خمسة عشر',
    'ستة عشر',
    'سبعة عشر',
    'ثمانية عشر',
    'تسعة عشر',
  ];

  let words = '';

  // Handle thousands
  const thousands = Math.floor(number / 1000);
  if (thousands > 0) {
    if (thousands === 1) {
      words += 'ألف';
    } else if (thousands === 2) {
      words += 'ألفان';
    } else if (thousands <= 10) {
      words += ones[thousands] + ' آلاف';
    } else {
      words += numberToWordsArabic(thousands) + ' ألف';
    }
    number %= 1000;
    if (number > 0) words += ' و';
  }

  // Handle hundreds
  const hundredsDigit = Math.floor(number / 100);
  if (hundredsDigit > 0) {
    words += hundreds[hundredsDigit];
    number %= 100;
    if (number > 0) words += ' و';
  }

  // Handle tens and ones
  if (number >= 10 && number <= 19) {
    words += teens[number - 10];
  } else {
    const tensDigit = Math.floor(number / 10);
    const onesDigit = number % 10;

    if (tensDigit > 0) {
      words += tens[tensDigit];
      if (onesDigit > 0) words += ' و';
    }

    if (onesDigit > 0) {
      words += ones[onesDigit];
    }
  }

  return words;
}

/**
 * Convert number to words in English
 */
function numberToWordsEnglish(number) {
  if (number === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  let words = '';

  // Handle thousands
  const thousands = Math.floor(number / 1000);
  if (thousands > 0) {
    words += numberToWordsEnglish(thousands) + ' thousand';
    number %= 1000;
    if (number > 0) words += ' ';
  }

  // Handle hundreds
  const hundreds = Math.floor(number / 100);
  if (hundreds > 0) {
    words += ones[hundreds] + ' hundred';
    number %= 100;
    if (number > 0) words += ' ';
  }

  // Handle tens and ones
  if (number >= 10 && number <= 19) {
    words += teens[number - 10];
  } else {
    const tensDigit = Math.floor(number / 10);
    const onesDigit = number % 10;

    if (tensDigit > 0) {
      words += tens[tensDigit];
      if (onesDigit > 0) words += '-';
    }

    if (onesDigit > 0) {
      words += ones[onesDigit];
    }
  }

  return words;
}

/**
 * Convert currency amount to words
 */
function amountToWords(amount, currency = 'SAR', language = 'ar') {
  if (!amount || isNaN(amount)) return '';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = '';

  if (language === 'ar') {
    words = numberToWordsArabic(integerPart);

    if (currency === 'SAR') {
      words += ' ريال سعودي';
      if (decimalPart > 0) {
        words += ' و ' + numberToWordsArabic(decimalPart) + ' هللة';
      }
    } else {
      words += ' ' + currency;
      if (decimalPart > 0) {
        words += ' و ' + numberToWordsArabic(decimalPart) + ' سنت';
      }
    }
  } else {
    words = numberToWordsEnglish(integerPart);

    if (currency === 'SAR') {
      words += ' Saudi Riyal';
      if (decimalPart > 0) {
        words += ' and ' + numberToWordsEnglish(decimalPart) + ' Halala';
      }
    } else {
      words += ' ' + currency;
      if (decimalPart > 0) {
        words += ' and ' + numberToWordsEnglish(decimalPart) + ' cents';
      }
    }
  }

  return words;
}

/**
 * Format large numbers with abbreviations
 */
function formatCompactNumber(number, language = 'ar') {
  if (number === null || number === undefined || isNaN(number)) return '';

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(number);
}

/**
 * Format number as accounting format (negative in parentheses)
 */
function formatAccounting(number, currency = 'SAR', language = 'ar') {
  if (number === null || number === undefined || isNaN(number)) return '';

  const isNegative = number < 0;
  const absValue = Math.abs(number);

  const formatted = formatCurrency(absValue, currency, language, { useArabicNumerals: language === 'ar' });

  if (isNegative) {
    return `(${formatted})`;
  }

  return formatted;
}

module.exports = {
  ARABIC_NUMERALS,
  toArabicNumerals,
  toWesternNumerals,
  formatNumberArabic,
  formatNumberEnglish,
  formatCurrencySAR,
  formatCurrency,
  formatPercentage,
  numberToWordsArabic,
  numberToWordsEnglish,
  amountToWords,
  formatCompactNumber,
  formatAccounting,
};
