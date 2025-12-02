/**
 * Date transformation utilities
 *
 * Converts ISO 8601 date strings in API responses to JavaScript Date objects.
 */

/**
 * ISO 8601 date pattern
 * Matches: 2024-01-15, 2024-01-15T10:30:00, 2024-01-15T10:30:00.000Z, etc.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Check if a string looks like an ISO 8601 date
 */
export function isIsoDateString(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}

/**
 * Recursively transform ISO date strings to Date objects in an object
 *
 * @param obj - The object to transform
 * @param enabled - Whether to perform conversion (pass false to skip)
 * @returns A new object with date strings converted to Date objects
 */
export function transformDates<T>(obj: T, enabled: boolean): T {
  if (!enabled || obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformDates(item, enabled)) as T;
  }

  if (obj instanceof Date) {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isIsoDateString(value)) {
      // Convert ISO date string to Date object
      result[key] = new Date(value);
    } else if (value instanceof Date) {
      // Keep existing Date objects as-is
      result[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively transform nested objects
      result[key] = transformDates(value, enabled);
    } else {
      // Keep other values as-is
      result[key] = value;
    }
  }

  return result as T;
}
