import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { LANGUAGES } from '../../data/languages';
import { useModal } from '../../hooks/useModal';
import { useStore } from '../../hooks/useStore';
import type { Deck } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingDeck?: Deck;
}

export default function DeckEditor({ isOpen, onClose, existingDeck }: Props) {
  const dialogRef = useModal(isOpen, onClose);
  const { addDeck, updateDeck } = useStore();
  const [name, setName] = useState(existingDeck?.name ?? '');
  const [langCode, setLangCode] = useState(existingDeck?.language ?? 'en');

  const lang = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];

  const handleSave = () => {
    if (!name.trim()) return;
    if (existingDeck) {
      updateDeck({ ...existingDeck, name: name.trim(), language: lang.code, languageLabel: lang.label, flag: lang.flag });
    } else {
      const deck: Deck = {
        id: crypto.randomUUID(),
        name: name.trim(),
        language: lang.code,
        languageLabel: lang.label,
        flag: lang.flag,
        cards: [],
        createdAt: Date.now(),
      };
      addDeck(deck);
    }
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 dark:bg-black/60 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Deck bearbeiten" tabIndex={-1}
            className="relative w-full max-w-md max-h-[calc(var(--app-height,100dvh)-2rem)] overflow-y-auto dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">
                {existingDeck ? 'Deck bearbeiten' : 'Neues Deck erstellen'}
              </h2>
              <button aria-label="Dialog schließen" onClick={onClose} className="p-2 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors min-h-11 min-w-11 flex items-center justify-center">
                <X size={20} className="dark:text-zinc-400 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-zinc-300 text-zinc-700 mb-1.5">Deck-Name</label>
                <input
                  aria-label="Deck-Name" maxLength={200}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Englisch Unit 1"
                  className="w-full px-4 py-3 rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 placeholder:dark:text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-zinc-300 text-zinc-700 mb-1.5">Sprache</label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLangCode(l.code)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all min-h-11 ${
                        langCode === l.code
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                          : 'dark:bg-zinc-800 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-300 text-zinc-700 dark:hover:border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      <span className="text-lg">{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={!name.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors min-h-11"
              whileTap={{ scale: 0.96 }}
            >
              <Save size={18} />
              {existingDeck ? 'Speichern' : 'Deck erstellen'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
