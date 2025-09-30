import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    const croreStr = crores % 1 === 0 ? crores.toString() : crores.toFixed(1);
    return `₹${croreStr}Cr`;
  } else if (amount >= 100000) {
    const lakhs = amount / 100000;
    const lakhStr = lakhs % 1 === 0 ? lakhs.toString() : lakhs.toFixed(1);
    return `₹${lakhStr}L`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    const thousandStr = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1);
    return `₹${thousandStr}K`;
  }
  return `₹${amount}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date and time to readable string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  
  return obj;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
}

/**
 * Sort array by property
 */
export function sortBy<T>(
  array: T[],
  property: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Group array by property
 */
export function groupBy<T, K extends keyof T>(
  array: T[],
  property: K
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = String(item[property]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Remove duplicates from array
 */
export function removeDuplicates<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Convert Google Drive sharing URL to direct image URL
 * Converts URLs like:
 * https://drive.google.com/file/d/FILE_ID/view
 * https://drive.google.com/uc?export=view&id=FILE_ID
 * To: https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }

  // Use the extractGoogleDriveFileId function for consistent parsing
  const fileId = extractGoogleDriveFileId(url);
  
  if (fileId) {
    // Always prioritize thumbnail URL for better compatibility and reliability
    // uc?export=view URLs often have CORS issues or loading problems
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  
  return url;
}

// Fallback function for when thumbnail fails
export function getGoogleDriveFallbackUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Get additional fallback URLs for Google Drive images
export function getGoogleDriveAlternateFallbacks(fileId: string): string[] {
  return [
    // Try different thumbnail sizes first (most reliable)
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`,
    // Try googleusercontent URLs (often work better)
    `https://lh3.googleusercontent.com/d/${fileId}=w800`,
    `https://lh3.googleusercontent.com/d/${fileId}=w600`,
    `https://lh3.googleusercontent.com/d/${fileId}=w400`,
    `https://lh3.googleusercontent.com/d/${fileId}=w300`,
    // Try uc URLs without export=view (less problematic)
    `https://drive.google.com/uc?id=${fileId}`,
    // Last resort: the problematic formats
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://docs.google.com/uc?export=download&id=${fileId}`
  ];
}

// Extract file ID from Google Drive URL
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || !url.includes('drive.google.com')) {
    return null;
  }

  // Clean up the URL first - remove extra slashes in id parameter
  let cleanUrl = url.replace(/id=\/+/g, 'id=');

  // Try different Google Drive URL patterns
  const patterns = [
    // Format: https://drive.google.com/file/d/FILE_ID/view (with or without query params)
    /\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?)/,
    // Format: https://drive.google.com/open?id=FILE_ID
    /\/open\?.*id=([a-zA-Z0-9_-]+)/,
    // Format: https://drive.google.com/uc?id=FILE_ID or https://drive.google.com/uc?export=view&id=FILE_ID
    /\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    // Format: https://drive.google.com/thumbnail?id=FILE_ID
    /\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/,
    // Format: https://docs.google.com/uc?export=download&id=FILE_ID
    /docs\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    // Format: https://lh3.googleusercontent.com/d/FILE_ID
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
    // Generic id parameter pattern (fallback)
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}