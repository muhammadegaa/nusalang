/**
 * Standard Library - JSON Module
 * Provides JSON utilities for NusaLang applications
 */

/**
 * Parse JSON string
 */
export function parse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`JSON parse error: ${(error as Error).message}`);
  }
}

/**
 * Stringify object to JSON
 */
export function stringify(value: any, pretty = false): string {
  try {
    return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  } catch (error) {
    throw new Error(`JSON stringify error: ${(error as Error).message}`);
  }
}

/**
 * Validate JSON string
 */
export function isValid(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export const json = {
  parse,
  stringify,
  isValid,
};

