/**
 * Utility functions for the Junior Joy POS application
 */

/**
 * Safely convert potentially problematic values to strings for rendering in JSX
 * This prevents React error #31 which occurs when objects are rendered directly
 * 
 * @param {any} value - The value to safely convert to a string
 * @returns {string} A safely stringified version of the value
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // Convert objects to a string representation
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
  
  // Return primitive values as strings
  return String(value);
};

/**
 * Format a date string for display
 * 
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
};

/**
 * Format a currency value
 * 
 * @param {number} value - The value to format as currency
 * @param {string} currency - The currency code (default: 'MVR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'MVR') => {
  if (value === null || value === undefined) return `${currency} 0.00`;
  
  try {
    const numValue = Number(value);
    return `${currency} ${numValue.toFixed(2)}`;
  } catch (e) {
    return `${currency} 0.00`;
  }
};
