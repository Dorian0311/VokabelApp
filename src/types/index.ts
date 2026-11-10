import type { Card } from 'ts-fsrs';

export interface VocabCard {
  id: string;
  term: string;
  translation: string;
  phonetic?: string;
  example?: string;
  fsrs: Card;
  correctCount: number;
  incorrectCount: number;
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  language: string;
  languageLabel: string;
  flag: string;
  cards: VocabCard[];
  createdAt: number;
  highScoreSpeedMatch?: number;
  highScoreWordDrop?: number;
}

export interface UserProgress {
  xp: number;
  streak: number;
  lastStudyDate: string;
  dailyGoal: number;
  dailyProgress: number;
  dailyProgressDate: string;
}

export interface AppSettings {
  geminiApiKey: string;
  darkMode: boolean;
}

export type Page = 'dashboard' | 'scanner' | 'learn' | 'games';
export type LearnMode = 'flashcard' | 'write' | 'quiz';
export type QueryDirection = 'term-to-translation' | 'translation-to-term';

export interface ScanResult {
  term: string;
  translation: string;
  phonetic?: string;
  example?: string;
}

export interface StagingRow extends ScanResult { id: string }
export interface ScannerDraft {
  rows: StagingRow[];
  selectedDeckId: string;
  newDeckName: string;
  language: string;
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  xpEarned: number;
  reviewedCards: VocabCard[];
  incorrectCards: VocabCard[];
}
