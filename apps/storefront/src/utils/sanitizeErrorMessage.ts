/**
 * Sanitizes error messages by removing UUID/ID patterns in parentheses.
 *
 * Examples:
 * - "Item (6aa93718-59c1-4523-bcfb-6220d6321596) out of stock"
 *   becomes "Item out of stock"
 * - "Error (abc-123-def) occurred"
 *   becomes "Error occurred"
 * - "Normal message (with text)"
 *   remains "Normal message (with text)"
 *
 * @param message - The error message to sanitize
 * @returns The sanitized message with ID patterns removed
 */
export const sanitizeErrorMessage = (message: string): string => {
  if (!message) return message;

  // Remove UUID-like patterns in parentheses (hex digits and dashes, 20+ chars)
  // This matches patterns like (6aa93718-59c1-4523-bcfb-6220d6321596)
  return message
    .replace(/\s*\([a-f0-9-]{20,}\)\s*/gi, ' ')
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .trim();
};
