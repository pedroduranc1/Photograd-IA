/**
 * ID Generation utilities for the application
 * Uses crypto.randomUUID() when available, falls back to secure random string generation
 */

// Check if crypto.randomUUID is available (modern browsers and React Native 0.70+)
const hasNativeUUID = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';

/**
 * Generate a cryptographically secure random string
 * Used as fallback when crypto.randomUUID is not available
 */
function generateSecureRandomString(length: number = 16): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  // Use crypto.getRandomValues if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure but functional)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a UUID v4 string
 * Uses native crypto.randomUUID when available, falls back to custom implementation
 */
export function generateUUID(): string {
  if (hasNativeUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate prefixed IDs for different entity types
 */
export const generateId = {
  school: () => `school_${generateUUID()}`,
  grade: () => `grade_${generateUUID()}`,
  student: () => `student_${generateUUID()}`,
  payment: () => `payment_${generateUUID()}`,
  studentPhoto: () => `photo_${generateUUID()}`,
  userProfile: () => `profile_${generateUUID()}`,
  photo: () => `img_${generateUUID()}`,
  processingJob: () => `job_${generateUUID()}`,
} as const;

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract entity type from prefixed ID
 */
export function getEntityTypeFromId(id: string): string | null {
  const match = id.match(/^([a-z_]+)_/);
  return match ? match[1] : null;
}

/**
 * Generate a short, user-friendly ID (for student IDs, reference numbers, etc.)
 */
export function generateShortId(prefix: string = '', length: number = 6): string {
  const timestamp = Date.now().toString(36).slice(-4);
  const random = generateSecureRandomString(length - 4);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}