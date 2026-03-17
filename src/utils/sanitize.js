/**
 * Sanitises user-supplied text before it is stored in localStorage.
 * React's JSX escaping already prevents XSS on render, but this removes
 * null bytes (which break JSON) and caps length.
 */
export function sanitizeText(value, maxLen = 1000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\0/g, '')   // strip null bytes
    .slice(0, maxLen);    // cap length
}

export function sanitizeNumber(value, min = 0, max = 99999) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}
