import type { Card } from 'ts-fsrs';
import type { Deck, VocabCard, UserProgress, AppSettings, ScannerDraft } from '../types';

const KEYS = { decks: 'snapvocab-decks', progress: 'snapvocab-progress', settings: 'snapvocab-settings', initialized: 'snapvocab-initialized' };
const blocked = new Set<string>();
let storageError = '';
export const STORAGE_ERROR_EVENT = 'snapvocab-storage-error';
export function getStorageError(): string { return storageError; }
function report(message: string) {
  storageError = message;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORAGE_ERROR_EVENT));
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültiges Objekt im Backup.');
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 4000): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Ungültiges Textfeld im Backup.');
  return value;
}
function required(value: unknown): string {
  const text = string(value).trim();
  if (!text) throw new Error('Ein Pflichtfeld im Backup ist leer.');
  return text;
}
function number(value: unknown, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) throw new Error('Ungültiger Zahlenwert im Backup.');
  return value;
}
function date(value: unknown): Date {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') throw new Error('Ungültiges FSRS-Datum.');
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new Error('Ungültiges FSRS-Datum.');
  return result;
}
function optional(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : string(value).trim() || undefined;
}
function card(value: unknown): VocabCard {
  const c = object(value);
  const f = object(c.fsrs);
  const state = number(f.state, true);
  if (state > 3 || number(f.difficulty) > 10) throw new Error('Ungültiger FSRS-Zustand.');
  const fsrs: Card = {
    due: date(f.due), stability: number(f.stability), difficulty: number(f.difficulty),
    scheduled_days: number(f.scheduled_days, true), reps: number(f.reps, true), lapses: number(f.lapses, true),
    learning_steps: number(f.learning_steps, true), state: state as Card['state'],
    last_review: f.last_review == null ? undefined : date(f.last_review),
  };
  return { id: required(c.id), term: required(c.term), translation: required(c.translation),
    phonetic: optional(c.phonetic), example: optional(c.example), fsrs,
    correctCount: number(c.correctCount, true), incorrectCount: number(c.incorrectCount, true), createdAt: number(c.createdAt) };
}
export function validateDecks(value: unknown): Deck[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Ungültige Deckliste.');
  const deckIds = new Set<string>();
  return value.map(entry => {
    const d = object(entry);
    const id = required(d.id);
    if (deckIds.has(id)) throw new Error('Doppelte Deck-ID.');
    deckIds.add(id);
    if (!Array.isArray(d.cards) || d.cards.length > 50000) throw new Error('Ungültige Kartenliste.');
    const cards = d.cards.map(card);
    if (new Set(cards.map(c => c.id)).size !== cards.length) throw new Error('Doppelte Karten-ID.');
    return { id, name: required(d.name), language: required(d.language), languageLabel: required(d.languageLabel),
      flag: string(d.flag), cards, createdAt: number(d.createdAt),
      highScoreSpeedMatch: d.highScoreSpeedMatch === undefined ? undefined : number(d.highScoreSpeedMatch),
      highScoreWordDrop: d.highScoreWordDrop === undefined ? undefined : number(d.highScoreWordDrop) };
  });
}
function day(value: unknown): string {
  const text = string(value, 10);
  if (text !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(text + 'T12:00:00Z').toISOString().slice(0, 10) !== text)) throw new Error('Ungültiger Kalendertag.');
  return text;
}
export function validateProgress(value: unknown): UserProgress {
  const p = object(value);
  const dailyGoal = number(p.dailyGoal, true);
  if (dailyGoal < 1 || dailyGoal > 10000) throw new Error('Ungültiges Tagesziel.');
  return { xp: number(p.xp, true), streak: number(p.streak, true), dailyGoal,
    lastStudyDate: day(p.lastStudyDate), dailyProgress: number(p.dailyProgress, true), dailyProgressDate: day(p.dailyProgressDate) };
}
export function defaultProgress(): UserProgress {
  return { xp: 0, streak: 0, lastStudyDate: '', dailyGoal: 20, dailyProgress: 0, dailyProgressDate: '' };
}
function read<T>(key: string, validate: (value: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : validate(JSON.parse(raw));
  } catch {
    blocked.add(key);
    report('Lokale Daten konnten nicht geladen werden. Originaldaten bleiben erhalten; neue Änderungen sind eventuell nicht gespeichert. Exportiere die Originaldaten und importiere ein gültiges Backup.');
    return fallback;
  }
}
function write(key: string, value: unknown): boolean {
  if (blocked.has(key)) return false;
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { report('Speichern fehlgeschlagen (Speicher voll oder Zugriff gesperrt). Bitte exportiere deinen aktuellen Stand als Backup.'); return false; }
}
export function loadDecks(): Deck[] { return read(KEYS.decks, validateDecks, []); }
export function saveDecks(decks: Deck[]): boolean { return write(KEYS.decks, decks); }
export function loadProgress(): UserProgress { return read(KEYS.progress, validateProgress, defaultProgress()); }
export function saveProgress(progress: UserProgress): boolean { return write(KEYS.progress, progress); }
function isLegacySharedKey(value: string): boolean {
  let hash = 14695981039346656037n;
  for (const character of value) hash = BigInt.asUintN(64, (hash ^ BigInt(character.charCodeAt(0))) * 1099511628211n);
  return hash.toString(16) === 'e26fc0ccc95980b';
}
export function loadSettings(): AppSettings {
  return read(KEYS.settings, value => {
    const settings = object(value);
    if (typeof settings.darkMode !== 'boolean') throw new Error('Ungültige Darstellung.');
    const key = string(settings.geminiApiKey, 1024);
    return { geminiApiKey: isLegacySharedKey(key) ? '' : key, darkMode: settings.darkMode };
  }, { geminiApiKey: '', darkMode: true });
}
export function saveSettings(settings: AppSettings): boolean { return write(KEYS.settings, settings); }
export function isFirstLaunch(): boolean {
  try { return !blocked.has(KEYS.decks) && localStorage.getItem(KEYS.decks) === null && !localStorage.getItem(KEYS.initialized); }
  catch { report('Lokaler Speicher ist nicht verfügbar. Änderungen können nur per Backup gesichert werden.'); return false; }
}
export function markInitialized(): void { write(KEYS.initialized, true); }
export function acceptValidatedImport(): void {
  blocked.delete(KEYS.decks); blocked.delete(KEYS.progress);
  storageError = ''; if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORAGE_ERROR_EVENT));
}
export function exportAllData(decks = loadDecks(), progress = loadProgress()): string {
  return JSON.stringify({ decks, progress, exportDate: new Date().toISOString(), version: 1 }, null, 2);
}
export function exportRecoveryData(): string {
  return JSON.stringify({ decks: localStorage.getItem(KEYS.decks), progress: localStorage.getItem(KEYS.progress) }, null, 2);
}
export function importAllData(json: string): { decks: Deck[]; progress: UserProgress } {
  const data = object(JSON.parse(json));
  if (data.version !== 1) throw new Error('Nicht unterstützte Backup-Version.');
  return { decks: validateDecks(data.decks), progress: validateProgress(data.progress) };
}

export function loadScannerDraft(): ScannerDraft | null {
  return read('snapvocab-scanner-draft', value => {
    if (value === null) return null;
    const d = object(value);
    if (!Array.isArray(d.rows)) throw new Error('Ungültiger Scan-Entwurf.');
    return { rows: d.rows.map(value => {
      const r = object(value);
      return { id: required(r.id), term: string(r.term), translation: string(r.translation), phonetic: optional(r.phonetic), example: optional(r.example) };
    }), selectedDeckId: string(d.selectedDeckId), newDeckName: string(d.newDeckName), language: required(d.language) };
  }, null);
}
export function saveScannerDraft(draft: ScannerDraft | null): boolean { return write('snapvocab-scanner-draft', draft); }
