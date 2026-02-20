import { describe, it, expect } from 'vitest';
import en from '../messages/en.json';
import sr from '../messages/sr.json';

// --- Helpers ---

type Messages = Record<string, unknown>;

/** Extract all leaf key paths (e.g. "footer.copyright") mapped to their string values. */
function getLeafKeys(obj: Messages, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [k, v] of getLeafKeys(value as Messages, path)) {
        result.set(k, v);
      }
    } else {
      result.set(path, String(value));
    }
  }
  return result;
}

const enKeys = getLeafKeys(en);
const srKeys = getLeafKeys(sr);

// --- Constants ---

/** Keys where identical en/sr values are expected (e.g. brand names that stay the same). */
const IDENTICAL_ALLOWED_KEYS: Set<string> = new Set([
  // Add keys here if a Serbian value legitimately matches the English value
]);

/** Keys fully exempt from Cyrillic enforcement (value is entirely Latin by design). */
const CYRILLIC_EXEMPT_KEYS: Set<string> = new Set([
  // Add keys here if a Serbian value should be entirely Latin
]);

// --- Tests ---

describe('Key Completeness', () => {
  it('sr.json has every key from en.json', () => {
    const missing = [...enKeys.keys()].filter((k) => !srKeys.has(k));
    expect(missing, `Missing keys in sr.json:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('en.json has every key from sr.json (no extra/orphaned keys)', () => {
    const extra = [...srKeys.keys()].filter((k) => !enKeys.has(k));
    expect(extra, `Extra keys in sr.json not present in en.json:\n  ${extra.join('\n  ')}`).toEqual(
      [],
    );
  });
});

describe('Cyrillic Enforcement', () => {
  /**
   * Strip patterns that are allowed to be Latin in Serbian values:
   * - C++
   * - ICU placeholders like {year}, {name}
   * - printf-style placeholders like %s, %d
   * - URLs (http:// or https://)
   * - Email addresses
   * - Tech acronyms: iCal, RSS, JSON-LD, SEO, OG, HTML, API, URL
   * - Meetup.com
   * - Ellipsis characters and common punctuation
   */
  function stripAllowedLatin(value: string): string {
    return (
      value
        // URLs
        .replace(/https?:\/\/[^\s]+/g, '')
        // Email addresses
        .replace(/[\w.+-]+@[\w.-]+\.\w+/g, '')
        // C++ (must come before general cleanup)
        .replace(/C\+\+/g, '')
        // ICU placeholders
        .replace(/\{[a-zA-Z_]+\}/g, '')
        // printf placeholders
        .replace(/%[sd]/g, '')
        // Tech acronyms
        .replace(/\b(iCal|RSS|JSON-LD|SEO|OG|HTML|API|URL)\b/g, '')
        // Meetup.com
        .replace(/Meetup\.com/g, '')
    );
  }

  const srEntries = [...srKeys.entries()].filter(([key]) => !CYRILLIC_EXEMPT_KEYS.has(key));

  it.each(srEntries)('%s has no unexpected Latin characters', (key, value) => {
    const stripped = stripAllowedLatin(value);
    const latinMatches = stripped.match(/\p{Script=Latin}/gu);
    expect(
      latinMatches,
      `Key "${key}" contains unexpected Latin characters: ${latinMatches?.join('')}\n  Full value: "${value}"`,
    ).toBeNull();
  });
});

describe('Similarity Detection', () => {
  const pairedEntries = [...enKeys.entries()].filter(
    ([key]) => srKeys.has(key) && !IDENTICAL_ALLOWED_KEYS.has(key),
  );

  it.each(pairedEntries)(
    '%s — sr value differs from en value',
    (key, enValue) => {
      const srValue = srKeys.get(key)!;
      expect(
        srValue,
        `Key "${key}" has identical en/sr value — possible untranslated copy-paste:\n  "${enValue}"`,
      ).not.toBe(enValue);
    },
  );
});

describe('Empty Value Check', () => {
  const srEntries = [...srKeys.entries()];

  it.each(srEntries)('%s is not empty', (key, value) => {
    expect(value, `Key "${key}" has an empty value in sr.json`).not.toBe('');
  });
});
