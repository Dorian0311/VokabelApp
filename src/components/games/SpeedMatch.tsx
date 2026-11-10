import { useState, useEffect, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePageVisible } from '../../hooks/usePageVisible';
import { matchReducer, type MatchState } from '../../utils/gameState';
import { shuffle } from '../../utils/study';
import type { Deck } from '../../types';

interface Props {
  deck: Deck;
  onComplete: (time: number) => void;
  onRestart: () => void;
}

export default function SpeedMatch({ deck, onComplete, onRestart }: Props) {
  const [pairs] = useState(() => shuffle(deck.cards).slice(0, 6));
  const [game, dispatch] = useReducer(matchReducer, pairs, pairs => ({ tiles: shuffle(pairs.flatMap((card, i) => [
    { id: `t-${i}`, text: card.term, type: 'term' as const, pairId: i, isMatched: false, isSelected: false, isWrong: false },
    { id: `d-${i}`, text: card.translation, type: 'translation' as const, pairId: i, isMatched: false, isSelected: false, isWrong: false },
  ])), selected: null, resolving: false, matched: 0, penalty: 0 } satisfies MatchState));
  const [elapsed, setElapsed] = useState(0);
  const visible = usePageVisible();
  const reported = useRef(false);
  const [record] = useState(deck.highScoreSpeedMatch);
  const { tiles, penalty, matched: matchedCount } = game;
  const gameOver = pairs.length > 0 && matchedCount === pairs.length;
  const totalSeconds = Math.floor(elapsed / 1000) + penalty;
  const isNewRecord = record === undefined || totalSeconds < record;
  useEffect(() => {
    if (gameOver || !visible) return;
    let previous = performance.now();
    const tick = () => { const now = performance.now(); setElapsed(value => value + now - previous); previous = now; };
    const interval = setInterval(tick, 100);
    return () => { clearInterval(interval); };
  }, [gameOver, visible]);
  useEffect(() => {
    if (!game.resolving) return;
    const timer = setTimeout(() => dispatch({ type: 'resolved' }), 600);
    return () => clearTimeout(timer);
  }, [game.resolving]);
  useEffect(() => {
    if (!gameOver || reported.current) return;
    reported.current = true;
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    onComplete(totalSeconds);
  }, [gameOver, totalSeconds, onComplete]);
  const handleTileClick = (id: string) => { if (!gameOver && visible) dispatch({ type: 'click', id }); };

  const totalTime = totalSeconds;
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (pairs.length < 6) return <p>Speed Match benötigt mindestens sechs Wortpaare.</p>;
  if (gameOver) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-8">
        <Trophy size={48} className="text-amber-500" />
        <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">
          {isNewRecord ? 'Neuer Rekord! 🏆' : 'Geschafft!'}
        </h2>
        <p className="text-4xl font-mono font-bold text-indigo-500">{timeStr}</p>
        {penalty > 0 && <p className="text-sm dark:text-zinc-500 text-zinc-400">(inkl. {penalty}s Strafzeit)</p>}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold min-h-11"
          >
            <RotateCcw size={16} /> Nochmal
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">Speed Match</h2>
        <div className="flex items-center gap-2 text-lg font-mono font-bold dark:text-zinc-100 text-zinc-900">
          <Timer size={20} className="text-indigo-500" />
          {timeStr}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        <AnimatePresence>
          {tiles.map((tile) => (
            <motion.button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={tile.isMatched || game.resolving || !visible}
              className={`relative min-w-0 [overflow-wrap:anywhere] rounded-xl border-2 text-sm font-medium p-2 transition-all no-select flex items-center justify-center text-center min-h-[72px] ${
                tile.isMatched
                  ? 'opacity-0 pointer-events-none'
                  : tile.isWrong
                  ? 'border-rose-500 bg-rose-500/10 dark:text-rose-400 text-rose-600 animate-shake'
                  : tile.isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 dark:text-indigo-400 text-indigo-600'
                  : 'dark:border-zinc-700 border-zinc-300 dark:bg-zinc-900 bg-white dark:text-zinc-200 text-zinc-800 dark:hover:border-zinc-600 hover:border-zinc-400'
              }`}
              layout
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {tile.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center">
        <span className="text-xs dark:text-zinc-500 text-zinc-400">{matchedCount}/{pairs.length} Paare gefunden</span>
      </div>
    </div>
  );
}
