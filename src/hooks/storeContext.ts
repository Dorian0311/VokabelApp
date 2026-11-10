import { createContext, type Dispatch } from 'react';
import type { Deck, VocabCard, UserProgress, AppSettings, Page, ScanResult, ScannerDraft } from '../types';

export interface AppState {
  decks: Deck[];
  progress: UserProgress;
  settings: AppSettings;
  currentPage: Page;
  selectedDeckId: string | null;
  scannerDraft: ScannerDraft | null;
}

export type Action =
  | { type: 'SET_DRAFT'; draft: ScannerDraft | null }
  | { type: 'SET_PAGE'; page: Page }
  | { type: 'SELECT_DECK'; deckId: string | null }
  | { type: 'SET_DECKS'; decks: Deck[] }
  | { type: 'ADD_DECK'; deck: Deck }
  | { type: 'UPDATE_DECK'; deck: Deck }
  | { type: 'DELETE_DECK'; deckId: string }
  | { type: 'UPDATE_CARD'; deckId: string; card: VocabCard }
  | { type: 'DELETE_CARD'; deckId: string; cardId: string }
  | { type: 'ADD_CARDS_TO_DECK'; deckId: string; cards: VocabCard[] }
  | { type: 'SET_PROGRESS'; progress: UserProgress }
  | { type: 'SET_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'IMPORT_DATA'; decks: Deck[]; progress: UserProgress };

export interface StoreContextType {
  state: AppState;
  storageError: string;
  setScannerDraft: (draft: ScannerDraft | null) => void;
  dispatch: Dispatch<Action>;
  setPage: (page: Page) => void;
  selectDeck: (id: string | null) => void;
  addDeck: (deck: Deck) => void;
  updateDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
  updateCard: (deckId: string, card: VocabCard) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  addCard: (deckId: string, card: { term: string; translation: string; phonetic?: string; example?: string }) => void;
  addCardsToDeck: (deckId: string, results: ScanResult[]) => void;
  updateProgress: (progress: UserProgress) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  getSelectedDeck: () => Deck | undefined;
}

export const StoreContext = createContext<StoreContextType | null>(null);
