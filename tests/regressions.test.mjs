import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createEmptyCard } from 'ts-fsrs';
import { checkAnswer } from '../src/utils/levenshtein.ts';
import { getToday, updateStreak } from '../src/utils/xp.ts';
import { quizOptions } from '../src/utils/study.ts';
import { initialDrop, dropReducer, matchReducer } from '../src/utils/gameState.ts';
import { validateDecks, defaultProgress, importAllData, exportAllData, loadDecks, saveDecks, saveProgress, getStorageError, acceptValidatedImport } from '../src/utils/storage.ts';
import { compressImage } from '../src/services/imageCompressor.ts';
import { parseScanResults, scanImageWithGemini } from '../src/services/visionScanner.ts';

process.env.TZ = 'Europe/Berlin';

const makeCard = (id, translation = id) => ({ id, term: id, translation, fsrs: createEmptyCard(), correctCount: 0, incorrectCount: 0, createdAt: Date.now() });
const makeDeck = () => ({ id: 'deck', name: 'Test', language: 'en', languageLabel: 'Englisch', flag: 'GB', cards: [makeCard('run', 'laufen')], createdAt: Date.now() });

test('answers accept defined alternatives, notes, English infinitives and Unicode whitespace', () => {
  assert.equal(checkAnswer('run', 'to run (ran, run)', 'en').result, 'correct');
  assert.equal(checkAnswer('Abreise', 'Abfahrt / Abreise').result, 'correct');
  assert.equal(checkAnswer('  HELLO   world ', 'hello world').result, 'correct');
  assert.equal(checkAnswer('e\u0301cole', 'école').result, 'correct');
  assert.equal(checkAnswer('ran', 'to run (ran, run)', 'en').result, 'wrong');
  assert.equal(checkAnswer('a', 'an').result, 'wrong');
  assert.equal(checkAnswer(' ', 'hello').result, 'wrong');
});

test('quiz distractors are distinct, contain no placeholders and do not mutate the pool', () => {
  const cards = [makeCard('a', 'gleich'), makeCard('b', ' GLEICH '), makeCard('c', 'anders'), makeCard('d', 'd'), makeCard('e', 'e')];
  const before = JSON.stringify(cards);
  const result = quizOptions(cards[0], cards, 'term-to-translation');
  assert.equal(result.length, 4);
  assert.equal(new Set(result.map(s => s.trim().toLowerCase())).size, 4);
  assert.equal(result.filter(v => v === 'gleich').length, 1);
  assert.equal(JSON.stringify(cards), before);
  assert.deepEqual(quizOptions(cards[0], [cards[0]], 'term-to-translation'), ['gleich']);
});

test('FSRS dates survive export/import and malformed backups are rejected atomically', () => {
  const deck = makeDeck(); deck.cards[0].fsrs.last_review = new Date();
  const imported = importAllData(exportAllData([deck], defaultProgress()));
  assert.ok(imported.decks[0].cards[0].fsrs.due instanceof Date);
  assert.ok(imported.decks[0].cards[0].fsrs.last_review instanceof Date);
  assert.throws(() => importAllData('{"progress":{}}'));
  assert.throws(() => importAllData('{"version":1,"decks":[],"progress":{}}'));
  const corrupt = structuredClone(deck); corrupt.cards[0].fsrs.due = 'bad';
  assert.throws(() => validateDecks([corrupt]));
  assert.throws(() => validateDecks([deck, deck]));
  assert.throws(() => validateDecks([{ ...deck, cards: [deck.cards[0], deck.cards[0]] }]));
  assert.throws(() => validateDecks([{ ...deck, cards: [{ ...deck.cards[0], term: 7 }] }]));
});

test('corrupt stored originals are not overwritten and write failures are reported', () => {
  const contents = new Map([['snapvocab-decks', '{broken']]);
  globalThis.localStorage = { getItem: key => contents.get(key) ?? null, setItem: (key, value) => contents.set(key, value) };
  assert.deepEqual(loadDecks(), []);
  assert.equal(saveDecks([]), false);
  assert.equal(contents.get('snapvocab-decks'), '{broken');
  acceptValidatedImport();
  assert.equal(saveDecks([makeDeck()]), true);
  globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(saveProgress(defaultProgress()), false);
  assert.match(getStorageError(), /Speichern fehlgeschlagen/);
});

test('local day and streak use the calendar across midnight and DST', () => {
  assert.equal(getToday(new Date('2026-11-10T00:15:00+01:00')), '2026-11-10');
  assert.equal(getToday(new Date('2026-03-29T00:15:00+01:00')), '2026-03-29');
  const today = new Date(); const previous = new Date(today); previous.setDate(previous.getDate() - 1);
  const progress = { ...defaultProgress(), streak: 3, lastStudyDate: getToday(previous) };
  assert.equal(updateStreak(progress).streak, 4);
});

test('Word Drop ignores duplicate/outdated answers and cannot lose lives after a resolved word', () => {
  const answer = { type: 'answer', index: 0, round: 0, correct: true };
  const next = dropReducer(initialDrop, answer);
  assert.equal(next.score, 10); assert.equal(next.lives, 3); assert.equal(next.index, 1);
  assert.equal(dropReducer(next, { ...answer, correct: false }), next);
  assert.equal(dropReducer(next, answer), next);
  const restarted = dropReducer(next, { type: 'restart' });
  assert.equal(dropReducer(restarted, answer), restarted);
  let game = initialDrop;
  for (let i = 0; i < 3; i++) game = dropReducer(game, { type: 'answer', index: i, round: 0, correct: false });
  assert.equal(game.lives, 0);
  assert.equal(dropReducer(game, { type: 'answer', index: 3, round: 0, correct: true }), game);
});

test('Speed Match rejects a third click until the error pair is resolved', () => {
  const tile = (id, pairId, type) => ({ id, text: id, pairId, type, isMatched: false, isSelected: false, isWrong: false });
  const initial = { tiles: [tile('a', 0, 'term'), tile('b', 1, 'term'), tile('c', 0, 'translation')], selected: null, resolving: false, penalty: 0, matched: 0 };
  const first = matchReducer(initial, { type: 'click', id: 'a' });
  const wrong = matchReducer(first, { type: 'click', id: 'b' });
  assert.equal(wrong.resolving, true);
  assert.equal(matchReducer(wrong, { type: 'click', id: 'c' }), wrong);
  const resolved = matchReducer(wrong, { type: 'resolved' });
  assert.equal(resolved.tiles.some(t => t.isWrong || t.isSelected), false);
  const correct = matchReducer(matchReducer(resolved, { type: 'click', id: 'a' }), { type: 'click', id: 'c' });
  assert.equal(correct.matched, 1);
  assert.equal(initial.tiles.some(t => t.isSelected), false);
});

test('vision response validation rejects malformed data and normalizes nullable fields', () => {
  assert.deepEqual(parseScanResults('[{"term":" run ","translation":" laufen ","phonetic":null}]'), [{ term: 'run', translation: 'laufen', phonetic: undefined, example: undefined }]);
  assert.throws(() => parseScanResults('{}'));
  assert.throws(() => parseScanResults('[null]'));
  assert.throws(() => parseScanResults('[{"term":42,"translation":"x"}]'));
});

test('canvas errors reject rather than leaving compression pending, with URL cleanup', async () => {
  let revoked = 0;
  mock.method(URL, 'createObjectURL', () => 'blob:test');
  mock.method(URL, 'revokeObjectURL', () => { revoked++; });
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  globalThis.Image = class { naturalWidth = 4000; naturalHeight = 6000; set src(value) { if (value) queueMicrotask(() => this.onload?.()); } };
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() { throw new Error('canvas failed'); } }) }) };
  try {
    await assert.rejects(compressImage({ size: 1 }), /canvas failed/);
    assert.equal(revoked, 1);
    await assert.rejects(compressImage({ size: 11 * 1024 * 1024 }), /10 MB/);
  } finally { globalThis.Image = originalImage; globalThis.document = originalDocument; mock.restoreAll(); }
});

test('missing key and malformed image fail before network access', async () => {
  await assert.rejects(scanImageWithGemini('AAAA', ''), /API-Key/);
  await assert.rejects(scanImageWithGemini('not base64!', 'test-only'), /Bilddaten/);
});
