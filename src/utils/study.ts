import type { QueryDirection, VocabCard } from '../types';

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function answerText(card: VocabCard, direction: QueryDirection): string {
  return direction === 'term-to-translation' ? card.translation : card.term;
}

export function answerKey(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function quizOptions(card: VocabCard, pool: VocabCard[], direction: QueryDirection): string[] {
  const correct = answerText(card, direction);
  const unique = new Map<string, string>();
  for (const candidate of pool) {
    const text = answerText(candidate, direction);
    if (answerKey(text) !== answerKey(correct)) unique.set(answerKey(text), text);
  }
  return shuffle([correct, ...shuffle([...unique.values()]).slice(0, 3)]);
}
