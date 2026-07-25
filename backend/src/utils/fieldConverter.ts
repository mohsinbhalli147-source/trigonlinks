/**
 * Utility functions for converting between camelCase and snake_case
 * This is needed because the frontend uses camelCase while the database uses snake_case
 */

/**
 * Convert camelCase to snake_case
 * Example: fatherName -> father_name, emergencyContact -> emergency_contact
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 * Example: father_name -> fatherName, emergency_contact -> emergencyContact
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys in an object from camelCase to snake_case recursively
 */
export function convertObjectKeysToSnake<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectKeysToSnake(item)) as any;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnake(key);
        result[snakeKey] = convertObjectKeysToSnake(obj[key]);
      }
    }
    return result as T;
  }

  return obj;
}

/**
 * Convert all keys in an object from snake_case to camelCase recursively
 */
export function convertObjectKeysToCamel<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectKeysToCamel(item)) as any;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        result[camelKey] = convertObjectKeysToCamel(obj[key]);
      }
    }
    return result as T;
  }

  return obj;
}
