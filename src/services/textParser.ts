import type { ScanResult } from '../types';

const SEPARATORS = [
  /\t/,
  /;/,
  /\s*->\s*/,
  /\s*→\s*/,
  /\s*=>\s*/,
  /\s*:\s*/,
  /\s+–\s+/,
  /\s+-\s+/,
];

export function parseTextToVocab(text: string): ScanResult[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ScanResult[] = [];

  for (const line of lines) {
    let parts: string[] | null = null;

    for (const sep of SEPARATORS) {
      const split = line.split(sep).map((s) => s.trim()).filter(Boolean);
      if (split.length >= 2) {
        parts = split;
        break;
      }
    }

    if (parts && parts.length >= 2) {
      results.push({
        term: parts[0],
        translation: parts[1],
        phonetic: parts[2] || undefined,
        example: parts[3] || undefined,
      });
    }
  }

  return results;
}
