import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CloudRain, ArrowLeft, Trophy } from 'lucide-react';
import { answerKey } from '../../utils/study';
import { useStore } from '../../hooks/useStore';
import SpeedMatch from './SpeedMatch';
import WordDrop from './WordDrop';

type Game = 'speedMatch' | 'wordDrop' | null;

export default function GameArcade() {
  const { state, setPage, selectDeck, updateDeck } = useStore();
  const [round, setRound] = useState(0);
  const [activeGame, setActiveGame] = useState<Game>(null);

  const deck = state.decks.find((d) => d.id === state.selectedDeckId) ?? state.decks[0];

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="dark:text-zinc-400 text-zinc-500">Du hast noch keine Decks angelegt.</p>
        <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium min-h-11">
          <ArrowLeft size={16} /> Zum Dashboard & Deck erstellen
        </button>
      </div>
    );
  }

  if (activeGame === 'speedMatch') {
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 text-sm dark:text-zinc-400 text-zinc-500 min-h-11">
          <ArrowLeft size={16} /> Zurück zur Arcade
        </button>
        <SpeedMatch key={`${deck.id}-${round}`} onRestart={() => setRound(value => value + 1)}
          deck={deck}
          onComplete={(time) => {
            if (deck.highScoreSpeedMatch === undefined || time < deck.highScoreSpeedMatch) {
              updateDeck({ ...deck, highScoreSpeedMatch: time });
            }
          }}
        />
      </div>
    );
  }

  if (activeGame === 'wordDrop') {
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 text-sm dark:text-zinc-400 text-zinc-500 min-h-11">
          <ArrowLeft size={16} /> Zurück zur Arcade
        </button>
        <WordDrop
          deck={deck}
          onComplete={(score) => {
            if (deck.highScoreWordDrop === undefined || score > deck.highScoreWordDrop) {
              updateDeck({ ...deck, highScoreWordDrop: score });
            }
          }}
        />
      </div>
    );
  }

  const games = [
    {
      id: 'speedMatch' as Game,
      icon: Zap,
      title: 'Speed Match',
      desc: 'Finde die Paare auf Zeit!',
      highscore: deck.highScoreSpeedMatch !== undefined ? `${deck.highScoreSpeedMatch}s` : null,
      minCards: 6,
      color: 'from-indigo-500/10 to-violet-500/10',
    },
    {
      id: 'wordDrop' as Game,
      icon: CloudRain,
      title: 'Word Drop',
      desc: 'Reagiere schnell!',
      highscore: deck.highScoreWordDrop !== undefined ? `${deck.highScoreWordDrop} Punkte` : null,
      minCards: 4,
      color: 'from-emerald-500/10 to-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{deck.flag}</span>
          <div>
            <h1 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">Game Arcade</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-500">
              Deck: <span className="font-semibold text-indigo-500">{deck.name}</span> · {deck.cards.length} Vokabeln
            </p>
          </div>
        </div>

        {state.decks.length > 1 && (
          <select
            aria-label="Spieldeck" value={deck.id}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((game) => {
          const Icon = game.icon;
          const disabled = deck.cards.length < game.minCards || (game.id === 'wordDrop' && new Set(deck.cards.map(c => answerKey(c.translation))).size < 4);
          return (
            <motion.button
              key={game.id}
              onClick={() => !disabled && setActiveGame(game.id)}
              disabled={disabled}
              className={`relative flex flex-col items-center gap-4 p-8 rounded-2xl border dark:border-zinc-800 border-zinc-200 bg-gradient-to-br ${game.color} transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[200px]`}
              whileHover={!disabled ? { y: -4, scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
            >
              <div className="w-16 h-16 rounded-2xl dark:bg-zinc-800/50 bg-white/80 flex items-center justify-center">
                <Icon size={32} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">{game.title}</h3>
                <p className="text-sm dark:text-zinc-400 text-zinc-500 mt-0.5">{game.desc}</p>
              </div>
              {game.highscore && (
                <div className="flex items-center gap-1.5 text-xs text-amber-500">
                  <Trophy size={14} /> Bestzeit: {game.highscore}
                </div>
              )}
              {disabled && (
                <p className="text-xs text-rose-400">Mind. {game.minCards} unterschiedliche Vokabeln benötigt</p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
