export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0) as number[]);

  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[la][lb];
}

export type AnswerResult = 'correct' | 'close' | 'wrong';

export function normalizeAnswer(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function answerVariants(value: string, language?: string): string[] {
  const original = normalizeAnswer(value);
  const withoutNotes = normalizeAnswer(original.replace(/\([^()]*\)/g, ' '));
  const variants = [original, withoutNotes, ...withoutNotes.split(/\s*\/\s*/).map(normalizeAnswer)];
  if (language === 'en') variants.push(...variants.map(v => v.replace(/^to\s+/, '')));
  return [...new Set(variants.filter(Boolean))];
}

export function checkAnswer(input: string, correct: string, language?: string): { result: AnswerResult; distance: number } {
  const trimmedInput = normalizeAnswer(input);
  const variants = answerVariants(correct, language);
  if (trimmedInput && variants.includes(trimmedInput)) {
    return { result: 'correct', distance: 0 };
  }

  const distance = Math.min(...variants.map(v => levenshteinDistance(trimmedInput, v)));
  if (trimmedInput.length >= 4 && variants.some(v => v.length >= 4 && levenshteinDistance(trimmedInput, v) === 1)) {
    return { result: 'close', distance };
  }

  return { result: 'wrong', distance };
}
