/**
 * Utility for drawing-label text normalization.
 * Escapes HTML-control characters and limits string length before the value
 * reaches Canvas text calls or DOM-backed overlays.
 */

/**
 * Sanitizes a string for display rendering.
 * 
 * @param text - The raw input to be sanitized (casted from unknown).
 * @returns A sanitized and length-limited string.
 */
export const sanitizeCanvasText = (text: unknown): string => {
  // 1. Guard against non-string or empty inputs
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 2. Escape HTML special characters so labels remain literal text in DOM-backed overlays
  // and consistent in Canvas labels.
  const escapeMap: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
  };

  const sanitized = text.replace(/[<>"'&]/g, (char) => escapeMap[char] ?? char);

  // 3. Bound label length to avoid pathological layout/rendering cost.
  const MAX_LENGTH = 200;
  
  return sanitized.length > MAX_LENGTH 
    ? sanitized.slice(0, MAX_LENGTH) 
    : sanitized;
};

// --- EOF ---