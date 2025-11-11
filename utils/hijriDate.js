/**
 * Hijri (Islamic) Calendar Utilities for Saudi Arabia
 * Converts Gregorian dates to Hijri dates using the Umm al-Qura calendar system
 * which is the official calendar in Saudi Arabia
 */

// Hijri month names in Arabic and English
const hijriMonths = {
  ar: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
  en: [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ],
};

/**
 * Convert Gregorian date to Hijri date using simplified algorithm
 * Note: For production use, consider using a library like 'hijri-date' or 'moment-hijri'
 * for more accurate conversions based on Umm al-Qura calendar
 */
function gregorianToHijri(gregorianDate) {
  // Simplified conversion (for demonstration)
  // In production, use a proper library for accurate Umm al-Qura calendar conversion

  const date = new Date(gregorianDate);
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  // Approximate conversion formula
  // This is a simplified version - use proper library for production
  const julianDay = Math.floor((1461 * (gYear + 4800 + Math.floor((gMonth - 14) / 12))) / 4) +
    Math.floor((367 * (gMonth - 2 - 12 * (Math.floor((gMonth - 14) / 12)))) / 12) -
    Math.floor((3 * (Math.floor((gYear + 4900 + Math.floor((gMonth - 14) / 12)) / 100))) / 4) +
    gDay - 32075;

  const hijriJulian = julianDay - 1948440 + 10632;
  const n = Math.floor((30 * hijriJulian + 10646) / 10631);
  const hijriYear = Math.floor((hijriJulian - 227013) / 354.36667);
  const hijriJulianYear = Math.floor((11 * hijriYear + 3) / 30);
  const hijriMonth = Math.floor((hijriJulian - hijriJulianYear) / 29.5) + 1;
  const hijriDay = hijriJulian - Math.floor(29.5 * (hijriMonth - 1)) - hijriJulianYear + 1;

  return {
    year: Math.floor(hijriYear),
    month: Math.floor(hijriMonth),
    day: Math.floor(hijriDay),
  };
}

/**
 * Format Hijri date in Arabic
 */
function formatHijriDateArabic(hijriDate) {
  if (!hijriDate || !hijriDate.year || !hijriDate.month || !hijriDate.day) {
    return '';
  }

  const monthName = hijriMonths.ar[hijriDate.month - 1] || '';
  return `${hijriDate.day} ${monthName} ${hijriDate.year} هـ`;
}

/**
 * Format Hijri date in English
 */
function formatHijriDateEnglish(hijriDate) {
  if (!hijriDate || !hijriDate.year || !hijriDate.month || !hijriDate.day) {
    return '';
  }

  const monthName = hijriMonths.en[hijriDate.month - 1] || '';
  return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
}

/**
 * Get complete Hijri date object from Gregorian date
 */
function getHijriDate(gregorianDate) {
  const hijri = gregorianToHijri(gregorianDate);

  return {
    year: hijri.year,
    month: hijri.month,
    day: hijri.day,
    formatted: formatHijriDateArabic(hijri),
    formattedEn: formatHijriDateEnglish(hijri),
  };
}

/**
 * Get current Hijri date
 */
function getCurrentHijriDate() {
  return getHijriDate(new Date());
}

/**
 * Format date with both Gregorian and Hijri
 */
function formatBilateralDate(gregorianDate, language = 'ar') {
  const gDate = new Date(gregorianDate);
  const hijri = getHijriDate(gDate);

  const gregorianFormatted = gDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hijriFormatted = language === 'ar' ? formatHijriDateArabic(hijri) : formatHijriDateEnglish(hijri);

  if (language === 'ar') {
    return `${gregorianFormatted} الموافق ${hijriFormatted}`;
  } else {
    return `${gregorianFormatted} (${hijriFormatted})`;
  }
}

/**
 * Get Hijri month name
 */
function getHijriMonthName(monthNumber, language = 'ar') {
  if (monthNumber < 1 || monthNumber > 12) {
    return '';
  }
  return hijriMonths[language][monthNumber - 1];
}

/**
 * Validate Hijri date
 */
function isValidHijriDate(year, month, day) {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 30) {
    return false;
  }
  return true;
}

module.exports = {
  gregorianToHijri,
  formatHijriDateArabic,
  formatHijriDateEnglish,
  getHijriDate,
  getCurrentHijriDate,
  formatBilateralDate,
  getHijriMonthName,
  isValidHijriDate,
  hijriMonths,
};
