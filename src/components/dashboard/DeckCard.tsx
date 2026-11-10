import { motion } from 'framer-motion';
import { Play, BookOpen, Settings2 } from 'lucide-react';
import { getDeckStats } from '../../services/srs';
import type { Deck } from '../../types';

interface Props {
  deck: Deck;
  onSelect: (id: string) => void;
  onLearn: (id: string) => void;
}

export default function DeckCard({ deck, onSelect, onLearn }: Props) {
  const stats = getDeckStats(deck.cards);
  const total = stats.total || 1;

  return (
    <motion.div
      onClick={() => onSelect(deck.id)}
      className="relative dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-5 cursor-pointer transition-shadow dark:hover:shadow-lg dark:hover:shadow-indigo-500/5 hover:shadow-lg group"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="text-2xl">{deck.flag}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 text-sm leading-tight [overflow-wrap:anywhere] line-clamp-2">{deck.name}</h3>
            <span className="text-xs dark:text-zinc-500 text-zinc-400">{deck.languageLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {stats.dueCount > 0 && (
            <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">
              {stats.dueCount}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(deck.id);
            }}
            className="min-h-11 min-w-11 p-1.5 rounded-lg text-zinc-400 dark:hover:text-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Karten verwalten"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs dark:text-zinc-500 text-zinc-400 mb-3">
        <BookOpen size={14} />
        <span>{stats.total} Vokabel{stats.total !== 1 ? 'n' : ''}</span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden dark:bg-zinc-800 bg-zinc-100 mb-4">
        <div className="bg-zinc-500 transition-all" style={{ width: `${(stats.newCount / total) * 100}%` }} title={`Neu: ${stats.newCount}`} />
        <div className="bg-amber-500 transition-all" style={{ width: `${(stats.learningCount / total) * 100}%` }} title={`Lernen: ${stats.learningCount}`} />
        <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.reviewCount / total) * 100}%` }} title={`Gemeistert: ${stats.reviewCount}`} />
      </div>

      <div className="flex gap-2 text-[10px] dark:text-zinc-500 text-zinc-400 mb-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Neu {stats.newCount}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Lernen {stats.learningCount}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Gemeistert {stats.reviewCount}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(deck.id);
          }}
          className="flex items-center justify-center py-2 px-3 dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold transition-colors min-h-11"
        >
          Karten ({stats.total})
        </button>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onLearn(deck.id); }}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors min-h-11"
          whileTap={{ scale: 0.96 }}
        >
          <Play size={14} fill="currentColor" />
          Lernen
        </motion.button>
      </div>
    </motion.div>
  );
}
