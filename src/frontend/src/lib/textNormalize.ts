/**
 * Normalize text for consistent search comparison
 * - Trims whitespace
 * - Applies Unicode NFKC normalization (handles full-width/half-width, etc.)
 * - Converts to lowercase for Latin characters only
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // Trim whitespace
  const trimmed = text.trim();

  // Apply Unicode NFKC normalization
  // This handles full-width/half-width characters and other Unicode equivalents
  const normalized = trimmed.normalize("NFKC");

  // Convert to lowercase for case-insensitive Latin text matching
  // Japanese characters (kanji, hiragana, katakana) don't have case, so this only affects Latin
  return normalized.toLowerCase();
}

/**
 * Check if a text contains a search term (case-insensitive, normalized)
 */
export function textContains(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  return normalizeText(text).includes(normalizeText(searchTerm));
}
