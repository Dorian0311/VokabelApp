import { useReducer, useEffect, useCallback, useState, type ReactNode } from 'react';
import type { Deck, VocabCard, UserProgress, AppSettings, Page, ScanResult, ScannerDraft } from '../types';
import { loadDecks, saveDecks, loadProgress, saveProgress, loadSettings, saveSettings, isFirstLaunch, markInitialized, loadScannerDraft, saveScannerDraft, getStorageError, STORAGE_ERROR_EVENT } from '../utils/storage';
import { createDemoDeck } from '../data/demoDeck';
import { stopSpeaking } from '../utils/speech';
import { createEmptyCard } from 'ts-fsrs';

import { StoreContext, type AppState, type Action } from './storeContext';

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DRAFT':
      return { ...state, scannerDraft: action.draft };
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SELECT_DECK':
      return { ...state, selectedDeckId: action.deckId };
    case 'SET_DECKS':
      return { ...state, decks: action.decks };
    case 'ADD_DECK':
      return { ...state, decks: [...state.decks, action.deck], selectedDeckId: action.deck.id };
    case 'UPDATE_DECK':
      return { ...state, decks: state.decks.map((d) => (d.id === action.deck.id ? action.deck : d)) };
    case 'DELETE_DECK':
      return {
        ...state,
        decks: state.decks.filter((d) => d.id !== action.deckId),
        selectedDeckId: state.selectedDeckId === action.deckId ? (state.decks.find((d) => d.id !== action.deckId)?.id ?? null) : state.selectedDeckId,
      };
    case 'UPDATE_CARD':
      return {
        ...state,
        decks: state.decks.map((d) =>
          d.id === action.deckId ? { ...d, cards: d.cards.map((c) => (c.id === action.card.id ? action.card : c)) } : d,
        ),
      };
    case 'DELETE_CARD':
      return {
        ...state,
        decks: state.decks.map((d) =>
          d.id === action.deckId ? { ...d, cards: d.cards.filter((c) => c.id !== action.cardId) } : d,
        ),
      };
    case 'ADD_CARDS_TO_DECK':
      return {
        ...state,
        decks: state.decks.map((d) => (d.id === action.deckId ? { ...d, cards: [...d.cards, ...action.cards] } : d)),
      };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'IMPORT_DATA':
      return { ...state, decks: action.decks, progress: action.progress };
    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const decks = loadDecks();
    const progress = loadProgress();
    const settings = loadSettings();
    const scannerDraft = loadScannerDraft();

    if (isFirstLaunch()) {
      const demoDeck = createDemoDeck();
      return { decks: [demoDeck], progress, settings, scannerDraft, currentPage: 'dashboard' as Page, selectedDeckId: null };
    }

    return { decks, progress, settings, scannerDraft, currentPage: 'dashboard' as Page, selectedDeckId: null };
  });

  const [storageError, setStorageError] = useState(getStorageError);
  useEffect(() => {
    const refresh = () => setStorageError(getStorageError());
    window.addEventListener(STORAGE_ERROR_EVENT, refresh);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, refresh);
  }, []);
  useEffect(() => { if (saveDecks(state.decks) && state.decks.length) markInitialized(); }, [state.decks]);
  useEffect(() => { saveScannerDraft(state.scannerDraft); }, [state.scannerDraft]);
  useEffect(() => {
    if (!state.scannerDraft?.rows.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.scannerDraft]);
  useEffect(() => { saveProgress(state.progress); }, [state.progress]);
  useEffect(() => { saveSettings(state.settings); }, [state.settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.settings.darkMode ? '#09090b' : '#fafafa');
  }, [state.settings.darkMode]);
  useEffect(() => {
    const hide = () => { if (document.hidden) stopSpeaking(); };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); stopSpeaking(); };
  }, []);

  const setScannerDraft = useCallback((draft: ScannerDraft | null) => dispatch({ type: 'SET_DRAFT', draft }), []);
  const setPage = useCallback((page: Page) => {
    if (page !== state.currentPage && state.currentPage === 'scanner' && state.scannerDraft?.rows.length && !window.confirm('Der Scan ist noch nicht in einem Deck gespeichert. Den Entwurf behalten und die Seite verlassen?')) return;
    stopSpeaking();
    dispatch({ type: 'SET_PAGE', page });
  }, [state.currentPage, state.scannerDraft]);
  const selectDeck = useCallback((id: string | null) => dispatch({ type: 'SELECT_DECK', deckId: id }), []);
  const addDeck = useCallback((deck: Deck) => dispatch({ type: 'ADD_DECK', deck }), []);
  const updateDeck = useCallback((deck: Deck) => dispatch({ type: 'UPDATE_DECK', deck }), []);
  const deleteDeck = useCallback((id: string) => dispatch({ type: 'DELETE_DECK', deckId: id }), []);
  const updateCard = useCallback((deckId: string, card: VocabCard) => dispatch({ type: 'UPDATE_CARD', deckId, card }), []);
  const deleteCard = useCallback((deckId: string, cardId: string) => dispatch({ type: 'DELETE_CARD', deckId, cardId }), []);
  const addCard = useCallback((deckId: string, cardData: { term: string; translation: string; phonetic?: string; example?: string }) => {
    const now = Date.now();
    const card: VocabCard = {
      id: crypto.randomUUID(),
      term: cardData.term.trim(),
      translation: cardData.translation.trim(),
      phonetic: cardData.phonetic?.trim() || undefined,
      example: cardData.example?.trim() || undefined,
      fsrs: createEmptyCard(),
      correctCount: 0,
      incorrectCount: 0,
      createdAt: now,
    };
    dispatch({ type: 'ADD_CARDS_TO_DECK', deckId, cards: [card] });
  }, []);
  const addCardsToDeck = useCallback((deckId: string, results: ScanResult[]) => {
    const now = Date.now();
    const cards: VocabCard[] = results.map((r) => ({
      id: crypto.randomUUID(),
      term: r.term.trim(),
      translation: r.translation.trim(),
      phonetic: r.phonetic,
      example: r.example,
      fsrs: createEmptyCard(),
      correctCount: 0,
      incorrectCount: 0,
      createdAt: now,
    }));
    dispatch({ type: 'ADD_CARDS_TO_DECK', deckId, cards });
  }, []);
  const updateProgress = useCallback((progress: UserProgress) => dispatch({ type: 'SET_PROGRESS', progress }), []);
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    dispatch({ type: 'SET_SETTINGS', settings: partial });
  }, []);
  const getSelectedDeck = useCallback(() => {
    return state.decks.find((d) => d.id === state.selectedDeckId) ?? state.decks[0];
  }, [state.decks, state.selectedDeckId]);

  return (
    <StoreContext.Provider value={{ state, storageError, setScannerDraft, dispatch, setPage, selectDeck, addDeck, updateDeck, deleteDeck, updateCard, deleteCard, addCard, addCardsToDeck, updateProgress, updateSettings, getSelectedDeck }}>
      {children}
    </StoreContext.Provider>
  );
}
