import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, Volume2 } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useTransitionTimer } from '../../hooks/useTransitionTimer';
import { shuffle } from '../../utils/study';
import { checkAnswer } from '../../utils/levenshtein';
import { speak, getLanguageCode } from '../../utils/speech';
import { addXP, updateStreak, XP_VALUES } from '../../utils/xp';
import { reviewCard, Rating } from '../../services/srs';
import type { Deck, QueryDirection, SessionStats, VocabCard } from '../../types';

interface Props {
  deck: Deck;
  direction: QueryDirection;
  practice?: boolean;
  onComplete: (stats: SessionStats) => void;
}

export default function WriteMode({ deck, direction, practice = false, onComplete }: Props) {
  const { updateCard, updateProgress, state } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [queue] = useState(() => shuffle(deck.cards));
  const timer = useTransitionTimer();
  const checked = useRef(false);
  const nextQuestion = useRef<(() => void) | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'close' | 'wrong' | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stats, setStats] = useState<SessionStats>({ total: queue.length, correct: 0, incorrect: 0, xpEarned: 0, reviewedCards: [], incorrectCards: [] });

  const card = queue[currentIndex];
  const prompt = direction === 'term-to-translation' ? card?.term : card?.translation;
  const answer = direction === 'term-to-translation' ? card?.translation : card?.term;
  const pct = ((currentIndex + 1) / queue.length) * 100;
  const langCode = getLanguageCode(deck.language);

  useEffect(() => {
    if (feedback === null) {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex, feedback]);

  const advance = useCallback((xp: number, isCorrect: boolean, currentCard: VocabCard, outcome: 'correct' | 'close' | 'wrong') => {
    const rating = isCorrect ? (hintsUsed > 0 || outcome === 'close' ? Rating.Hard : Rating.Good) : Rating.Again;
    const latest = state.decks.find(d => d.id === deck.id)?.cards.find(c => c.id === currentCard.id) ?? currentCard;
    const result = practice ? { card: latest.fsrs } : reviewCard(latest.fsrs, rating);
    const updated = { ...latest, fsrs: result.card, correctCount: latest.correctCount + (isCorrect ? 1 : 0), incorrectCount: latest.incorrectCount + (isCorrect ? 0 : 1) };
    if (!practice) updateCard(deck.id, updated);

    let p = updateStreak(state.progress);
    p = addXP(p, xp);
    updateProgress(p);

    const newStats = {
      ...stats,
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1),
      xpEarned: stats.xpEarned + xp,
      reviewedCards: [...stats.reviewedCards, updated],
      incorrectCards: isCorrect ? stats.incorrectCards : [...stats.incorrectCards, updated],
    };
    setStats(newStats);

    const next = () => {
      nextQuestion.current = null;
      checked.current = false;
      if (currentIndex + 1 >= queue.length) {
        onComplete(newStats);
      } else {
        setCurrentIndex((i) => i + 1);
        setInput('');
        setFeedback(null);
        setHintsUsed(0);
      }
    };
    nextQuestion.current = next;
    if (outcome !== 'wrong') timer(next, 1200);
  }, [currentIndex, deck.id, queue.length, state.progress, stats, updateCard, updateProgress, onComplete, practice, state.decks, hintsUsed, timer]);

  const handleCheck = useCallback(() => {
    if (!input.trim() || !answer || feedback || checked.current) return;
    checked.current = true;
    const { result } = checkAnswer(input, answer, direction === 'translation-to-term' ? deck.language : 'de');
    setFeedback(result);

    const xp = result === 'wrong' ? XP_VALUES.writeWrong : hintsUsed > 0 ? (hintsUsed >= answer.length ? 0 : 5) : result === 'close' ? XP_VALUES.writeClose : XP_VALUES.writeCorrect;
    advance(xp, result !== 'wrong', card, result);
  }, [input, answer, feedback, card, advance, direction, deck.language, hintsUsed]);

  const handleHint = () => {
    if (!answer) return;
    const nextHint = hintsUsed + 1;
    setHintsUsed(nextHint);
    const revealed = answer.slice(0, nextHint);
    setInput(revealed);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.isComposing || e.repeat || (e.target instanceof Element && e.target.closest('[role="dialog"]'))) return;
      if (e.key === 'Enter') { e.preventDefault(); if (feedback === 'wrong') nextQuestion.current?.(); else handleCheck(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCheck, feedback]);

  if (!card) return null;

  const hintDisplay = answer ? answer.split('').map((ch, i) => i < hintsUsed ? ch : '_').join(' ') : '';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs dark:text-zinc-500 text-zinc-400">
          <span>{currentIndex + 1} / {queue.length}</span>
        </div>
        <div className="h-1.5 dark:bg-zinc-800 bg-zinc-200 rounded-full overflow-hidden">
          <motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm dark:text-zinc-500 text-zinc-400">Übersetze:</p>
        <div className="flex items-center gap-3 min-w-0 max-w-full">
          <p className="min-w-0 [overflow-wrap:anywhere] text-center text-2xl sm:text-3xl font-bold dark:text-zinc-100 text-zinc-900">{prompt}</p>
          {direction === 'term-to-translation' && (
            <button aria-label="Fremdwort vorlesen" onClick={() => speak(card.term, langCode)} className="p-2 rounded-full dark:bg-zinc-800 bg-zinc-100 min-h-11 min-w-11 shrink-0 flex items-center justify-center">
              <Volume2 size={18} className="text-indigo-500" />
            </button>
          )}
        </div>
        {hintsUsed > 0 && (
          <p className="text-sm max-w-full [overflow-wrap:anywhere] font-mono dark:text-zinc-400 text-zinc-500 tracking-widest">{hintDisplay}</p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl text-center text-sm font-medium ${
              feedback === 'correct' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
              feedback === 'close' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {feedback === 'correct' && (hintsUsed > 0 ? `✅ Mit Tipp gelöst! +${hintsUsed >= (answer?.length ?? 0) ? 0 : 5} XP` : `✅ Perfekt! +${XP_VALUES.writeCorrect} XP`)}
            {feedback === 'close' && `⚠️ Fast richtig! Achte auf: "${answer}"`}
            {feedback === 'wrong' && `❌ Richtige Antwort: "${answer}"`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Übersetzung eingeben..."
          disabled={!!feedback}
          maxLength={4000}
          aria-label="Übersetzung"
          className="min-w-0 w-full flex-1 px-4 py-3 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-300 dark:text-zinc-100 text-zinc-900 placeholder:dark:text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 text-lg"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          onClick={handleHint}
          disabled={!!feedback || hintsUsed >= (answer?.length ?? 0)}
          className="p-3 rounded-xl dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 transition-colors disabled:opacity-30 min-h-11 min-w-11 flex items-center justify-center"
          title="Buchstaben-Tipp"
        >
          <Lightbulb size={20} className="text-amber-500" />
        </button>
      </div>

      {feedback === 'wrong' && <button className="w-full min-h-11 rounded-xl bg-indigo-600 text-white" onClick={() => nextQuestion.current?.()}>Weiter</button>}
      <motion.button
        onClick={handleCheck}
        disabled={!input.trim() || !!feedback}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold min-h-11"
        whileTap={{ scale: 0.96 }}
      >
        <ArrowRight size={18} />
        Prüfen
      </motion.button>
    </div>
  );
}
