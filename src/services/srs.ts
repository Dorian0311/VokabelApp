import { fsrs, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

export { Rating, State, createEmptyCard };
export type { Card };

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
});

export function reviewCard(card: Card, rating: Rating): { card: Card; log: unknown } {
  const now = new Date();
  return scheduler.next(card, now, rating as 1 | 2 | 3 | 4);
}

export function previewIntervals(card: Card): Record<Rating, { card: Card; label: string }> {
  const now = new Date();
  const preview = scheduler.repeat(card, now);
  const result: Record<number, { card: Card; label: string }> = {};

  for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
    const nextCard = preview[r].card;
    result[r] = { card: nextCard, label: formatInterval(nextCard) };
  }

  return result as Record<Rating, { card: Card; label: string }>;
}

function formatInterval(card: Card): string {
  const days = card.scheduled_days;
  if (days === 0) {
    const diffMs = card.due.getTime() - Date.now();
    const mins = Math.round(diffMs / 60000);
    if (mins <= 0) return 'Jetzt';
    if (mins < 60) return `${mins}m`;
    return `${Math.round(mins / 60)}h`;
  }
  if (days === 1) return '1 Tag';
  if (days < 30) return `${days} Tage`;
  if (days < 365) return `${Math.round(days / 30)} Mon.`;
  return `${Math.round(days / 365)} J.`;
}

export function isDue(card: Card): boolean {
  return new Date(card.due) <= new Date();
}

export function getCardStateLabel(state: State): string {
  switch (state) {
    case State.New: return 'Neu';
    case State.Learning: return 'Lernen';
    case State.Review: return 'Wiederholen';
    case State.Relearning: return 'Nochmal lernen';
    default: return 'Unbekannt';
  }
}

export function getDeckStats(cards: Array<{ fsrs: Card }>) {
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let dueCount = 0;

  for (const c of cards) {
    const state = c.fsrs.state;
    if (state === State.New) newCount++;
    else if (state === State.Learning || state === State.Relearning) learningCount++;
    else if (state === State.Review) reviewCount++;
    if (isDue(c.fsrs)) dueCount++;
  }

  return { newCount, learningCount, reviewCount, dueCount, total: cards.length };
}
