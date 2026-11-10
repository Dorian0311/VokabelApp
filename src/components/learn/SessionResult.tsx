import { useTransitionTimer } from '../../hooks/useTransitionTimer';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, RotateCcw, ArrowLeft, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SessionStats } from '../../types';

interface Props {
  stats: SessionStats;
  onClose: () => void;
  onRetryIncorrect: () => void;
}

export default function SessionResult({ stats, onClose, onRetryIncorrect }: Props) {
  const timer = useTransitionTimer();
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const accColor = accuracy >= 80 ? 'text-emerald-700 dark:text-emerald-400' : accuracy >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400';

  useEffect(() => {
    if (accuracy >= 70) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      timer(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 } }), 500);
    }
  }, [accuracy, timer]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Trophy size={40} className="text-indigo-500" />
        </div>
      </motion.div>

      <div className="text-center">
        <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Geschafft! 🎉</h2>
        <p className="dark:text-zinc-400 text-zinc-500 text-sm mt-1">Hier ist deine Zusammenfassung</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 p-4 rounded-xl dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-200">
          <Target size={20} className={accColor} />
          <span className={`text-2xl font-bold ${accColor}`}>{accuracy}%</span>
          <span className="text-xs dark:text-zinc-500 text-zinc-400">Genauigkeit</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 rounded-xl dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-200">
          <Zap size={20} className="text-indigo-400" />
          <span className="text-2xl font-bold text-indigo-400">+{stats.xpEarned}</span>
          <span className="text-xs dark:text-zinc-500 text-zinc-400">XP</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 rounded-xl dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-200">
          <span className="text-xl">📚</span>
          <span className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">{stats.total}</span>
          <span className="text-xs dark:text-zinc-500 text-zinc-400">Karten</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {stats.incorrectCards.length > 0 && (
          <motion.button
            onClick={onRetryIncorrect}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold min-h-11"
            whileTap={{ scale: 0.96 }}
          >
            <RotateCcw size={16} />
            {stats.incorrectCards.length} Fehler wiederholen
          </motion.button>
        )}
        <motion.button
          onClick={onClose}
          className="flex items-center justify-center gap-2 py-3 px-4 dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-100 text-zinc-900 rounded-xl text-sm font-semibold min-h-11"
          whileTap={{ scale: 0.96 }}
        >
          <ArrowLeft size={16} />
          Zurück
        </motion.button>
      </div>
    </motion.div>
  );
}
