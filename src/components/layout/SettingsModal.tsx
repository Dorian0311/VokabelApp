import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Target, RefreshCw } from 'lucide-react';
import { useTransitionTimer } from '../../hooks/useTransitionTimer';
import { useModal } from '../../hooks/useModal';
import { useStore } from '../../hooks/useStore';
import { createDemoDeck } from '../../data/demoDeck';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const demoTimer = useTransitionTimer();
  const dialogRef = useModal(isOpen, onClose);
  const { state, updateSettings, updateProgress, addDeck } = useStore();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSetGoal = (goal: number) => {
    updateProgress({ ...state.progress, dailyGoal: goal });
  };

  const handleAddDemoDeck = () => {
    const demo = createDemoDeck();
    demo.id = `demo-${Date.now()}`;
    demo.name = `Englisch Demo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    addDeck(demo);
    setResetSuccess(true);
    demoTimer(() => setResetSuccess(false), 2500);
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Einstellungen" tabIndex={-1}
            className="relative w-full max-w-md max-h-[calc(var(--app-height,100dvh)-2rem)] flex flex-col dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b dark:border-zinc-800 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-bold dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
                ⚙️ Einstellungen
              </h2>
              <button
                aria-label="Dialog schließen" onClick={onClose}
                className="p-2 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-200 transition-colors min-h-10 min-w-10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 min-h-0 flex-1 overflow-y-auto">
              {/* Appearance / Theme */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Erscheinungsbild
                </label>
                <button
                  onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-800/50 bg-zinc-50 hover:border-indigo-500/40 transition-all text-sm font-medium"
                >
                  <div className="flex items-center gap-2.5 dark:text-zinc-200 text-zinc-800">
                    {state.settings.darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                    <span>{state.settings.darkMode ? 'Dark Mode aktiv' : 'Light Mode aktiv'}</span>
                  </div>
                  <span className="text-xs text-indigo-500 font-semibold">Umschalten</span>
                </button>
              </div>

              {/* Daily Goal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Target size={14} /> Tagesziel (Vokabeln pro Tag)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleSetGoal(goal)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        state.progress.dailyGoal === goal
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                          : 'dark:border-zinc-800 border-zinc-200 dark:text-zinc-400 text-zinc-600 hover:border-zinc-700'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Data Reset */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Beispieldaten
                </label>
                <button
                  onClick={handleAddDemoDeck}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:hover:bg-zinc-800 hover:bg-zinc-50 text-xs font-medium dark:text-zinc-300 text-zinc-700 transition-colors"
                >
                  <RefreshCw size={14} className={resetSuccess ? 'animate-spin' : ''} />
                  <span>{resetSuccess ? 'Demo-Deck hinzugefügt!' : 'Englisch Demo-Deck neu hinzufügen'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t dark:border-zinc-800 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <span className="text-[11px] dark:text-zinc-500 text-zinc-400">
                SnapVocab AI · v1.0.0 PWA
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Fertig
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
