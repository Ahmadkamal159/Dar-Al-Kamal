/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Normalizes text for search (lowercasing, trimming, removing accents, normalizing Arabic alef/ta/etc.)
 */
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_/\\(),]/g, ' ')
    .replace(/\s+/g, ' ');
}

export interface SearchableItem {
  id?: number | string;
  nameEn: string;
  nameAr?: string;
  chemicalName?: string;
  cas?: string;
  family?: string;
  pyramidNote?: string;
  brandOrOrigin?: string;
  [key: string]: any;
}

/**
 * Computes a relevance score for a given item against a search query.
 * Higher score = closer match.
 * Returns -1 if no match found.
 */
export function scoreMaterialMatch(item: SearchableItem, rawQuery: string): number {
  const query = normalizeSearchString(rawQuery);
  if (!query) return 1000;

  // Exact ID match (e.g. "1" or "#1")
  const cleanedId = query.replace(/^#/, '');
  if (item.id !== undefined && String(item.id) === cleanedId) {
    return 15000;
  }

  const enName = normalizeSearchString(item.nameEn);
  const arName = item.nameAr ? normalizeSearchString(item.nameAr) : '';
  const chemName = item.chemicalName ? normalizeSearchString(item.chemicalName) : '';
  const casNum = item.cas ? normalizeSearchString(item.cas) : '';

  // 1. Single letter query (e.g. user presses 'A')
  if (query.length === 1) {
    if (enName.startsWith(query)) {
      // Prioritize items starting with this letter, with shorter words slightly higher
      return 10000 - enName.length;
    }
    if (arName.startsWith(query)) {
      return 9500 - arName.length;
    }
    // Check if any word starts with this letter
    const words = enName.split(' ');
    if (words.some(w => w.startsWith(query))) {
      return 7000 - enName.length;
    }
    if (enName.includes(query)) {
      return 4000 - enName.indexOf(query) * 10;
    }
    if (arName.includes(query)) {
      return 3500 - arName.indexOf(query) * 10;
    }
    return -1;
  }

  // 2. Exact match on English or Arabic name
  if (enName === query || arName === query) {
    return 12000;
  }

  // 3. Name starts with full query
  if (enName.startsWith(query)) {
    return 9000 - enName.length;
  }
  if (arName.startsWith(query)) {
    return 8800 - arName.length;
  }

  // 4. Word boundary start (e.g. query "aldehyde" in "Cyclamen aldehyde")
  const enWords = enName.split(' ');
  const matchedWordIdx = enWords.findIndex(w => w.startsWith(query));
  if (matchedWordIdx !== -1) {
    return 7500 - matchedWordIdx * 100 - (enWords[matchedWordIdx].length - query.length);
  }

  const arWords = arName.split(' ');
  const matchedArWordIdx = arWords.findIndex(w => w.startsWith(query));
  if (matchedArWordIdx !== -1) {
    return 7300 - matchedArWordIdx * 100;
  }

  // 5. Substring match inside names or chemical name
  if (enName.includes(query)) {
    return 5500 - enName.indexOf(query) * 20;
  }
  if (arName.includes(query)) {
    return 5300 - arName.indexOf(query) * 20;
  }
  if (chemName.includes(query)) {
    return 4800 - chemName.indexOf(query) * 20;
  }
  if (casNum.includes(query)) {
    return 4500;
  }

  // 6. Typo-tolerant / Fuzzy match (e.g., "aldehide" -> "aldehyde", "brasile" -> "brassylate")
  // Check against each token of English name and chemical name
  const allTokens = [...enWords, ...chemName.split(' ')].filter(t => t.length >= 3);
  let bestFuzzyScore = -1;

  for (const token of allTokens) {
    // If query starts with the same 4 letters (e.g. "brasile" vs "brassylate" -> "bras")
    if (query.length >= 4 && token.startsWith(query.slice(0, 4))) {
      const dist = levenshteinDistance(token, query);
      const similarity = 1 - (dist / Math.max(token.length, query.length));
      if (similarity >= 0.55) {
        const score = 6500 * similarity;
        if (score > bestFuzzyScore) bestFuzzyScore = score;
      }
    }

    // Levenshtein distance check for spelling mistakes like "aldehide" vs "aldehyde"
    const maxLen = Math.max(token.length, query.length);
    const dist = levenshteinDistance(token, query);
    const maxAllowedDist = query.length <= 4 ? 1 : query.length <= 7 ? 2 : 3;

    if (dist <= maxAllowedDist) {
      const similarity = 1 - (dist / maxLen);
      const score = 6000 * similarity;
      if (score > bestFuzzyScore) bestFuzzyScore = score;
    }
  }

  if (bestFuzzyScore > 0) {
    return bestFuzzyScore;
  }

  return -1;
}

/**
 * Filters and sorts materials by closest match score
 */
export function getClosestMatches<T extends SearchableItem>(
  materials: T[],
  query: string,
  limit?: number
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    // Return sorted alphabetically by English name
    const list = [...materials].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    return limit ? list.slice(0, limit) : list;
  }

  const scored = materials
    .map(item => ({
      item,
      score: scoreMaterialMatch(item, trimmed),
    }))
    .filter(res => res.score >= 0)
    .sort((a, b) => {
      // First sort by score descending
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort alphabetically
      return a.item.nameEn.localeCompare(b.item.nameEn);
    });

  const results = scored.map(s => s.item);
  return limit ? results.slice(0, limit) : results;
}
