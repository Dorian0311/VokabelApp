import { useState, useEffect, useCallback, useRef } from 'react';
import { useTransitionTimer } from '../../hooks/useTransitionTimer';
import { shuffle, quizOptions } from '../../utils/study';
import { motion } from 'framer-motion';
import { useStore } from '../../hooks/useStore';
import { addXP, updateStreak, XP_VALUES } from '../../utils/xp';
import { reviewCard, Rating } from '../../services/srs';
import type { Deck, QueryDirection, SessionStats, VocabCard } from '../../types';

interface Props {
  deck: Deck;
  direction: QueryDirection;
  practice?: boolean;
  pool?: VocabCard[];
  onComplete: (stats: SessionStats) => void;
}

export default function QuizMode({ deck, direction, practice = false, pool = deck.cards, onComplete }: Props) {
  const { updateCard, updateProgress, state } = useStore();

  const [questions] = useState(() => shuffle(deck.cards).map(card => ({ card, options: quizOptions(card, pool, direction) })));
  const queue = questions.map(question => question.card);
  const timer = useTransitionTimer();
  const locked = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [stats, setStats] = useState<SessionStats>({ total: queue.length, correct: 0, incorrect: 0, xpEarned: 0, reviewedCards: [], incorrectCards: [] });

  const card = queue[currentIndex];
  const prompt = direction === 'term-to-translation' ? card?.term : card?.translation;
  const correctAnswer = direction === 'term-to-translation' ? card?.translation : card?.term;

  const options = questions[currentIndex]?.options ?? [];
  const correctIdx = options.indexOf(correctAnswer!);
  const pct = ((currentIndex + 1) / queue.length) * 100;

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null || !card || locked.current || idx < 0 || idx >= options.length || options.length < 4) return;
    locked.current = true;
    setSelected(idx);

    const isCorrect = idx === correctIdx;
    const xp = isCorrect ? XP_VALUES.quizCorrect : XP_VALUES.quizWrong;
    const rating = isCorrect ? Rating.Good : Rating.Again;
    const latest = state.decks.find(d => d.id === deck.id)?.cards.find(c => c.id === card.id) ?? card;
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

    timer(() => {
      if (currentIndex + 1 >= queue.length) {
        onComplete(newStats);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
        locked.current = false;
      }
    }, 1200);
  }, [practice, timer, state.decks, options.length, selected, card, correctIdx, currentIndex, deck.id, queue.length, state.progress, stats, updateCard, updateProgress, onComplete, setStats, setSelected, setCurrentIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || (e.target instanceof Element && e.target.closest('input, textarea, select, [role="dialog"]'))) return;
      if (selected !== null && e.key === 'Enter') return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && selected === null) handleSelect(num - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, handleSelect]);

  if (!card) return null;
  if (options.length < 4) return <p role="status">Für das Quiz brauchst du vier unterschiedliche Antworten. Nutze Karteikarten oder den Schreibmodus.</p>;

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

      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-sm dark:text-zinc-500 text-zinc-400">Was bedeutet:</p>
        <p className="max-w-full [overflow-wrap:anywhere] text-center text-2xl sm:text-3xl font-bold dark:text-zinc-100 text-zinc-900">{prompt}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, idx) => {
          let style = 'dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 dark:text-zinc-100 text-zinc-900 dark:hover:border-indigo-500/30 hover:border-indigo-500/30';
          if (selected !== null) {
            if (idx === correctIdx) style = 'bg-emerald-600 border-emerald-500 text-white';
            else if (idx === selected) style = 'bg-rose-600 border-rose-500 text-white';
            else style = 'dark:bg-zinc-900/50 bg-zinc-100 dark:border-zinc-800 border-zinc-200 dark:text-zinc-600 text-zinc-400';
          }

          return (
            <motion.button
              key={`${currentIndex}-${idx}`}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-left text-sm font-medium transition-all min-h-[56px] ${style}`}
              whileTap={selected === null ? { scale: 0.96 } : {}}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg dark:bg-zinc-800 bg-zinc-100 text-xs font-bold shrink-0 dark:text-zinc-400 text-zinc-500">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
