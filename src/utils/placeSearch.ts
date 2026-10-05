/**
 * Word-boundary text matching for place search.
 *
 * Why not plain `includes()`?
 * ---------------------------
 * The registry stores search terms as whole words, so a naive substring test
 * produces wrong results AND extra work:
 *
 *   "hospitality".includes("hospital")  ->  true   (hotels shown for "hospital")
 *   "hospital".includes("hospital")     ->  true
 *
 * The same class of bug hit the category filter. Matching on word boundaries
 * fixes the false positives while still supporting prefix typing, which is what
 * an autocomplete needs ("man" should find "Mansoor").
 */

function isWordChar(code: number): boolean {
  // 0-9
  if (code >= 48 && code <= 57) return true;
  // A-Z
  if (code >= 65 && code <= 90) return true;
  // a-z
  if (code >= 97 && code <= 122) return true;
  // Treat non-ASCII letters (e.g. Somali/Arabic script) as word characters so
  // they are not mistaken for separators.
  if (code > 127) return true;
  return false;
}

/**
 * True when `needle` appears in `haystack` at a word start.
 * Both arguments must already be lower-cased.
 *
 *   wordStartsWith('the oriental hotel & hospitality', 'hospitality') -> true
 *   wordStartsWith('the oriental hotel & hospitality', 'hospital')    -> false
 */
export function wordStartsWith(haystack: string, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;

  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return false;

    const startsAtBoundary = idx === 0 || !isWordChar(haystack.charCodeAt(idx - 1));
    if (startsAtBoundary) {
      // The match must not continue into the rest of a longer word.
      // This is what stops "hospital" from matching "hospitality".
      const endIdx = idx + needle.length;
      const endsAtBoundary = endIdx >= haystack.length || !isWordChar(haystack.charCodeAt(endIdx));
      if (endsAtBoundary) return true;
    }

    from = idx + 1;
  }
}

/**
 * Score a candidate for relevance ordering. Lower is better.
 *   0 = the name starts with the query
 *   1 = a word in the name starts with the query
 *   2 = any other field matches at a word start
 *  -1 = no match
 */
export function scorePlaceMatch(name: string, haystack: string, needle: string): number {
  if (name.startsWith(needle)) return 0;
  if (wordStartsWith(name, needle)) return 1;
  if (wordStartsWith(haystack, needle)) return 2;
  return -1;
}
