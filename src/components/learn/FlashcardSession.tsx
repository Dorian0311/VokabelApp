import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, Check, Zap } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { reviewCard, previewIntervals, Rating } from '../../services/srs';
import { addXP, updateStreak, XP_VALUES } from '../../utils/xp';
import type { Deck, QueryDirection, SessionStats, VocabCard } from '../../types';
import Flashcard from './Flashcard';
import { useTransitionTimer } from '../../hooks/useTransitionTimer';

interface Props {
  deck: Deck;
  direction: QueryDirection;
  practice?: boolean;
  onComplete: (stats: SessionStats) => void;
}

export default function FlashcardSession({ deck, direction, practice = false, onComplete }: Props) {
  const { updateCard, updateProgress, state } = useStore();

  const [queue] = useState(() => [...deck.cards]);
  const timer = useTransitionTimer();
  const ratedIndex = useRef(-1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ total: queue.length, correct: 0, incorrect: 0, xpEarned: 0, reviewedCards: [], incorrectCards: [] });

  const currentCard = queue[currentIndex];
  const intervals = currentCard ? previewIntervals(currentCard.fsrs) : null;

  const handleRate = useCallback((rating: Rating) => {
    if (!currentCard || !isFlipped || ratedIndex.current === currentIndex) return;
    ratedIndex.current = currentIndex;
    const latest = state.decks.find(d => d.id === deck.id)?.cards.find(c => c.id === currentCard.id) ?? currentCard;
    const result = practice ? { card: latest.fsrs } : reviewCard(latest.fsrs, rating);
    const updated: VocabCard = {
      ...latest,
      fsrs: result.card,
      correctCount: latest.correctCount + (rating >= Rating.Good ? 1 : 0),
      incorrectCount: latest.incorrectCount + (rating < Rating.Good ? 1 : 0),
    };
    if (!practice) updateCard(deck.id, updated);

    const xpMap: Record<number, number> = {
      [Rating.Again]: XP_VALUES.flashcardAgain,
      [Rating.Hard]: XP_VALUES.flashcardHard,
      [Rating.Good]: XP_VALUES.flashcardGood,
      [Rating.Easy]: XP_VALUES.flashcardEasy,
    };
    const xpGained = xpMap[rating] ?? 0;

    let newProgress = updateStreak(state.progress);
    newProgress = addXP(newProgress, xpGained);
    updateProgress(newProgress);

    const newStats = {
      ...stats,
      correct: stats.correct + (rating >= Rating.Good ? 1 : 0),
      incorrect: stats.incorrect + (rating < Rating.Good ? 1 : 0),
      xpEarned: stats.xpEarned + xpGained,
      reviewedCards: [...stats.reviewedCards, updated],
      incorrectCards: rating < Rating.Good ? [...stats.incorrectCards, updated] : stats.incorrectCards,
    };
    setStats(newStats);
    setIsFlipped(false);

    if (currentIndex + 1 >= queue.length) {
      timer(() => onComplete(newStats), 300);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isFlipped, practice, timer, state.decks, currentCard, currentIndex, queue.length, deck.id, state.progress, stats, updateCard, updateProgress, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || (e.target instanceof Element && e.target.closest('input, textarea, select, button, [role="dialog"]'))) return;
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped((f) => !f); }
      if (isFlipped) {
        if (e.key === '1') handleRate(Rating.Again);
        if (e.key === '2') handleRate(Rating.Hard);
        if (e.key === '3') handleRate(Rating.Good);
        if (e.key === '4') handleRate(Rating.Easy);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFlipped, handleRate]);

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-4xl">🎉</p>
        <p className="dark:text-zinc-300 text-zinc-700 font-medium">Keine Karten fällig!</p>
        <p className="text-sm dark:text-zinc-500 text-zinc-400">Komm später wieder oder füge neue Vokabeln hinzu.</p>
      </div>
    );
  }

  const pct = ((currentIndex + 1) / queue.length) * 100;

  const ratingButtons: { rating: Rating; label: string; icon: typeof Check; color: string }[] = [
    { rating: Rating.Again, label: 'Nochmal', icon: RotateCcw, color: 'bg-rose-600 hover:bg-rose-500' },
    { rating: Rating.Hard, label: 'Schwer', icon: AlertTriangle, color: 'bg-amber-600 hover:bg-amber-500' },
    { rating: Rating.Good, label: 'Gewusst', icon: Check, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { rating: Rating.Easy, label: 'Leicht', icon: Zap, color: 'bg-blue-600 hover:bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs dark:text-zinc-500 text-zinc-400">
          <span>{currentIndex + 1} / {queue.length}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 dark:bg-zinc-800 bg-zinc-200 rounded-full overflow-hidden">
          <motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: `${pct}%` }} />
        </div>
      </div>

      <Flashcard card={currentCard} direction={direction} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} language={deck.language} />

      {isFlipped && intervals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2"
        >
          {ratingButtons.map(({ rating, label, icon: Icon, color }) => (
            <motion.button
              key={rating}
              onClick={() => handleRate(rating)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-white font-medium transition-colors min-h-[64px] ${color}`}
              whileTap={{ scale: 0.93 }}
            >
              <Icon size={18} />
              <span className="text-xs">{label}</span>
              <span className="text-[10px] opacity-70">{practice ? 'Freies Üben' : intervals[rating].label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {!isFlipped && (
        <p className="text-center text-xs dark:text-zinc-600 text-zinc-400">
          Tippe auf die Karte oder drücke <kbd className="px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-200 font-mono text-[10px]">Space</kbd> zum Umdrehen
        </p>
      )}
    </div>
  );
}
