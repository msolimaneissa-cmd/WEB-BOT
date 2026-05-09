import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * دمج أسماء الأصناف (CSS Classes) لـ Tailwind CSS بشكل صحيح.
 * @param inputs - مصفوفة من أسماء الأصناف أو القيم الشرطية.
 * @returns {string} - سلسلة نصية تحتوي على أسماء الأصناف المدمجة.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق التاريخ باللغة العربية.
 * @param {Date | string | number} date - التاريخ المراد تنسيقه.
 * @returns {string} - التاريخ المنسق (مثال: 11 أبريل 2026).
 */
export function formatArabicDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * معالجة أخطاء الـ API بشكل موحد ومنع تسريب التفاصيل في الإنتاج.
 */
export function handleApiError(error: any, context: string) {
  console.error(`[API Error] ${context}:`, error);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'حدث خطأ داخلي في الخادم' 
    : error.message || 'Internal Server Error';
    
  return { success: false, error: message };
}

/**
 * تنسيق الأرقام باللغة العربية.
 * @param {number} num - الرقم المراد تنسيقه.
 * @returns {string} - الرقم المنسق (مثال: ١,٠٠٠).
 */
export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}
