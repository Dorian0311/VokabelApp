import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useClock } from '../../hooks/useClock';
import { getDeckStats } from '../../services/srs';
import DeckCard from './DeckCard';
import DeckEditor from './DeckEditor';
import DeckDetailModal from './DeckDetailModal';
import ImportExport from './ImportExport';

export default function Dashboard() {
  useClock();
  const { state, setPage, selectDeck } = useStore();
  const [showEditor, setShowEditor] = useState(false);
  const [activeDeckDetailId, setActiveDeckDetailId] = useState<string | null>(null);

  const totalDue = state.decks.reduce((sum, d) => sum + getDeckStats(d.cards).dueCount, 0);

  const handleLearn = (deckId: string) => {
    selectDeck(deckId);
    setPage('learn');
  };

  const handleSelect = (deckId: string) => {
    selectDeck(deckId);
    setActiveDeckDetailId(deckId);
  };

  const activeDeck = state.decks.find((d) => d.id === activeDeckDetailId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Willkommen zurück! 👋</h1>
        <p className="dark:text-zinc-400 text-zinc-600 mt-1">
          {totalDue > 0
            ? `${totalDue} Vokabel${totalDue !== 1 ? 'n' : ''} warten auf dich`
            : 'Alle Vokabeln sind auf dem neuesten Stand 🎉'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.decks.map((deck) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DeckCard deck={deck} onSelect={handleSelect} onLearn={handleLearn} />
          </motion.div>
        ))}

        <motion.button
          onClick={() => setShowEditor(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed dark:border-zinc-700 border-zinc-300 dark:hover:border-indigo-500/50 hover:border-indigo-500/50 dark:hover:bg-zinc-900/50 hover:bg-indigo-50/50 transition-all min-h-[180px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-12 h-12 rounded-full dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center">
            <Plus size={24} className="dark:text-zinc-400 text-zinc-500" />
          </div>
          <span className="text-sm font-medium dark:text-zinc-400 text-zinc-500">Neues Deck erstellen</span>
        </motion.button>
      </div>

      <ImportExport />

      {showEditor && <DeckEditor isOpen={showEditor} onClose={() => setShowEditor(false)} />}

      {activeDeck && (
        <DeckDetailModal
          deck={activeDeck}
          isOpen={!!activeDeckDetailId}
          onClose={() => setActiveDeckDetailId(null)}
          onLearn={handleLearn}
        />
      )}
    </div>
  );
}
