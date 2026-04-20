/**
 * [TENOR 2026] Utility for Canvas Text Sanitization.
 * Prevents XSS injections and visual corruption by escaping HTML characters
 * and limiting string length before rendering to the 2D Canvas context.
 * Adheres to PP-0024 (Security of Rendering).
 */

/**
 * Sanitizes a string for safe rendering on a Canvas context.
 * 
 * @param text - The raw input to be sanitized (casted from unknown).
 * @returns A sanitized and length-limited string.
 */
export const sanitizeCanvasText = (text: unknown): string => {
  // 1. Guard against non-string or empty inputs
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 2. Escape HTML special characters to prevent XSS-like behavior in overlays
  // and ensure consistent rendering of literal characters.
  const escapeMap: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
  };

  const sanitized = text.replace(/[<>"'&]/g, (char) => escapeMap[char] ?? char);

  // 3. Enforce a hard limit on string length to prevent DoS (Denial of Service)
  // on the rendering engine and maintain UI layout integrity.
  const MAX_LENGTH = 200;
  
  return sanitized.length > MAX_LENGTH 
    ? sanitized.slice(0, MAX_LENGTH) 
    : sanitized;
};

// --- EOF ---