import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, PenLine, ListChecks, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useClock } from '../../hooks/useClock';
import { answerKey, answerText, shuffle } from '../../utils/study';
import { getDeckStats, isDue } from '../../services/srs';
import type { LearnMode, QueryDirection, SessionStats, VocabCard } from '../../types';
import FlashcardSession from './FlashcardSession';
import WriteMode from './WriteMode';
import QuizMode from './QuizMode';
import SessionResult from './SessionResult';

const modes = [
  { id: 'flashcard' as LearnMode, label: 'Karteikarten', icon: Layers, desc: 'Klassisch umdrehen & bewerten' },
  { id: 'write' as LearnMode, label: 'Schreiben', icon: PenLine, desc: 'Übersetzung eintippen' },
  { id: 'quiz' as LearnMode, label: 'Quiz', icon: ListChecks, desc: 'Multiple Choice' },
];

export default function LearnCenter() {
  const { state, setPage, selectDeck } = useStore();
  useClock();
  const [practice, setPractice] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [retryIds, setRetryIds] = useState<string[] | null>(null);
  const [limit, setLimit] = useState(20);
  const [sessionCards, setSessionCards] = useState<VocabCard[]>([]);
  const [learnMode, setLearnMode] = useState<LearnMode | null>(null);
  const [direction, setDirection] = useState<QueryDirection>('translation-to-term');
  const [sessionResult, setSessionResult] = useState<SessionStats | null>(null);

  const deck = state.decks.find((d) => d.id === state.selectedDeckId) ?? state.decks[0];

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="dark:text-zinc-400 text-zinc-500">Du hast noch keine Decks angelegt.</p>
        <button
          onClick={() => setPage('dashboard')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium min-h-11"
        >
          <ArrowLeft size={16} /> Zum Dashboard & Deck erstellen
        </button>
      </div>
    );
  }

  const stats = getDeckStats(deck.cards);
  const canQuiz = new Set(deck.cards.map(c => answerKey(answerText(c, direction)))).size >= 4;
  const startSession = (mode: LearnMode) => { setSessionCards(shuffle(practice ? deck.cards : deck.cards.filter(c => isDue(c.fsrs))).slice(0, limit || undefined)); setRetryIds(null); setSessionId(id => id + 1); setLearnMode(mode); };

  if (sessionResult) {
    return (
      <SessionResult
        stats={sessionResult}
        onClose={() => { setSessionResult(null); setLearnMode(null); }}
        onRetryIncorrect={() => { setRetryIds(sessionResult.incorrectCards.map(c => c.id)); setSessionId(id => id + 1); setSessionResult(null); }}
      />
    );
  }

  if (learnMode) {
    const candidates = retryIds ? deck.cards.filter(c => retryIds.includes(c.id)) : practice ? deck.cards : deck.cards.filter(c => isDue(c.fsrs));
    const sessionDeck = { ...deck, cards: retryIds ? candidates : sessionCards };
    const handleComplete = (s: SessionStats) => setSessionResult(s);
    const handleBack = () => setLearnMode(null);

    return (
      <div key={`${deck.id}-${sessionId}`} className="space-y-4">
        <p className="text-sm dark:text-zinc-400 text-zinc-600">{practice ? "Freies Üben · Der Wiederholungsplan bleibt unverändert" : "Fällige Karten · Spaced Repetition"}</p>
        <button onClick={handleBack} className="flex items-center gap-2 text-sm dark:text-zinc-400 text-zinc-500 dark:hover:text-zinc-200 hover:text-zinc-700 min-h-11">
          <ArrowLeft size={16} /> Zurück zur Übersicht
        </button>
        {learnMode === 'flashcard' && <FlashcardSession deck={sessionDeck} direction={direction} practice={practice} onComplete={handleComplete} />}
        {learnMode === 'write' && <WriteMode deck={sessionDeck} direction={direction} practice={practice} onComplete={handleComplete} />}
        {learnMode === 'quiz' && <QuizMode pool={deck.cards} deck={sessionDeck} direction={direction} practice={practice} onComplete={handleComplete} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{deck.flag}</span>
          <div>
            <h1 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">{deck.name}</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-500">
              {stats.total} Vokabeln · {stats.dueCount} fällig · {stats.reviewCount} gemeistert
            </p>
          </div>
        </div>

        {state.decks.length > 1 && (
          <select
            aria-label="Lerndeck" value={deck.id}
            onChange={(e) => selectDeck(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-300 dark:text-zinc-200 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {state.decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.flag} {d.name} ({d.cards.length} W.)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs dark:text-zinc-500 text-zinc-400 font-medium">Abfragerichtung:</span>
        <div className="flex dark:bg-zinc-900 bg-zinc-100 rounded-lg p-0.5">
          {([
            ['translation-to-term', 'DE → Fremdsprache'],
            ['term-to-translation', 'Fremdsprache → DE'],
          ] as [QueryDirection, string][]).map(([dir, label]) => (
            <button
              key={dir}
              onClick={() => setDirection(dir)}
              className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-11 ${
                direction === dir ? 'dark:text-zinc-100 text-zinc-900' : 'dark:text-zinc-500 text-zinc-500'
              }`}
            >
              {direction === dir && (
                <motion.div
                  layoutId="direction-toggle"
                  className="absolute inset-0 dark:bg-zinc-800 bg-white rounded-md shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <ArrowLeftRight size={12} />
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border dark:border-zinc-800 border-zinc-200 p-4">
        <legend className="px-2 font-semibold">Was möchtest du üben?</legend>
        <div className="flex flex-wrap gap-2">
          <button aria-pressed={!practice} onClick={() => setPractice(false)} className={`min-h-11 px-4 rounded-lg ${!practice ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Fällige Karten ({stats.dueCount})</button>
          <button aria-pressed={practice} onClick={() => setPractice(true)} className={`min-h-11 px-4 rounded-lg ${practice ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Frei üben</button>
        </div>
        <p className="text-sm dark:text-zinc-400 text-zinc-600">{practice ? 'Alle Karten frei trainieren. Dein Wiederholungsplan bleibt unverändert.' : stats.dueCount ? 'Trainiere jetzt fällige Karten nach deinem Wiederholungsplan.' : 'Alles erledigt! Mit „Frei üben“ kannst du jederzeit weiterlernen.'}</p>
        <label className="flex flex-wrap items-center gap-3 text-sm">Karten pro Runde
          <select aria-label="Karten pro Runde" value={limit} onChange={e => setLimit(Number(e.target.value))} className="min-h-11 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <option value={10}>10</option><option value={20}>20</option><option value={0}>Alle</option>
          </select>
        </label>
        {!canQuiz && <p className="text-sm dark:text-zinc-400 text-zinc-600">Quiz benötigt vier unterschiedliche Antworten.</p>}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              onClick={() => startSession(mode.id)}
              disabled={deck.cards.length === 0 || (!practice && stats.dueCount === 0) || (mode.id === 'quiz' && !canQuiz)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 dark:hover:border-indigo-500/30 hover:border-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left min-h-[120px]"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Icon size={24} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 text-sm">{mode.label}</h3>
                <p className="text-xs dark:text-zinc-500 text-zinc-400 mt-0.5">{mode.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
