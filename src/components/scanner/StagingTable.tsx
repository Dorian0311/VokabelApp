import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Trash2, Plus, Save, X } from 'lucide-react';
import { LANGUAGES } from '../../data/languages';
import { createEmptyCard } from 'ts-fsrs';
import { useStore } from '../../hooks/useStore';
import type { ScanResult, Deck, ScannerDraft } from '../../types';

interface Props {
  onClear: () => void;
  decks: Deck[];
}

export default function StagingTable({ onClear, decks }: Props) {
  const { addDeck, addCardsToDeck, state, setScannerDraft } = useStore();
  const [error, setError] = useState('');
  const draft = state.scannerDraft;
  if (!draft) return null;
  const { rows, selectedDeckId, newDeckName, language } = draft;
  const updateDraft = (changes: Partial<ScannerDraft>) => setScannerDraft({ ...draft, ...changes });
  const updateRow = (id: string, field: keyof ScanResult, value: string) => {
    updateDraft({ rows: rows.map(row => row.id === id ? { ...row, [field]: value } : row) });
  };
  const swapRow = (id: string) => updateDraft({ rows: rows.map(row => row.id === id ? { ...row, term: row.translation, translation: row.term, phonetic: undefined, example: undefined } : row) });
  const deleteRow = (id: string) => updateDraft({ rows: rows.filter(row => row.id !== id) });
  const addRow = () => updateDraft({ rows: [...rows, { id: crypto.randomUUID(), term: '', translation: '' }] });
  const validRows = rows.map(row => ({ ...row, term: row.term.trim(), translation: row.translation.trim() })).filter(row => row.term && row.translation);
  const validTarget = selectedDeckId === '__new__' ? !!newDeckName.trim() : decks.some(deck => deck.id === selectedDeckId);
  const handleSave = () => {
    if (!validTarget || !validRows.length) { setError('Bitte gültige Wortpaare und ein Zieldeck mit Namen angeben.'); return; }
    if (validRows.length !== rows.length) { setError('Bitte alle Zeilen ausfüllen oder leere Zeilen löschen.'); return; }
    if (selectedDeckId === '__new__') {
      const lang = LANGUAGES.find(item => item.code === language) ?? LANGUAGES[0];
      addDeck({ id: crypto.randomUUID(), name: newDeckName.trim(), language: lang.code, languageLabel: lang.label, flag: lang.flag, createdAt: Date.now(),
        cards: validRows.map(row => ({ ...row, id: crypto.randomUUID(), fsrs: createEmptyCard(), correctCount: 0, incorrectCount: 0, createdAt: Date.now() })) });
    } else {
      addCardsToDeck(selectedDeckId, validRows);
    }
    setScannerDraft(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-800 border-zinc-200">
        <h3 className="text-sm font-semibold dark:text-zinc-100 text-zinc-900">
          {rows.length} Vokabel{rows.length !== 1 ? 'n' : ''} erkannt
        </h3>
        <button onClick={onClear} aria-label="Scan-Entwurf verwerfen" className="p-2 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 min-h-11 min-w-11 flex items-center justify-center">
          <X size={18} className="dark:text-zinc-400 text-zinc-500" />
        </button>
      </div>

      <p className="px-4 py-2 text-sm dark:text-zinc-400 text-zinc-600">Ungespeicherter Entwurf – bleibt auf diesem Gerät erhalten, bis du ihn speicherst oder verwirfst.</p>
      {error && <p role="alert" className="px-4 py-2 text-rose-700 dark:text-rose-400">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="dark:bg-zinc-800/50 bg-zinc-50">
              <th className="text-left px-4 py-2 dark:text-zinc-400 text-zinc-500 font-medium">Fremdwort</th>
              <th className="text-left px-4 py-2 dark:text-zinc-400 text-zinc-500 font-medium">Übersetzung</th>
              <th className="text-left px-4 py-2 dark:text-zinc-400 text-zinc-500 font-medium hidden sm:table-cell">Lautschrift</th>
              <th className="w-24 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="border-t dark:border-zinc-800/50 border-zinc-100"
                >
                  <td className="px-3 py-1.5">
                    <input
                      aria-label="Fremdwort" maxLength={4000}
                      value={row.term}
                      onChange={(e) => updateRow(row.id, 'term', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-50 dark:text-zinc-100 text-zinc-900 border dark:border-zinc-700 border-zinc-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      aria-label="Deutsche Übersetzung" maxLength={4000}
                      value={row.translation}
                      onChange={(e) => updateRow(row.id, 'translation', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-50 dark:text-zinc-100 text-zinc-900 border dark:border-zinc-700 border-zinc-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </td>
                  <td className="px-3 py-1.5 hidden sm:table-cell">
                    <input
                      value={row.phonetic ?? ''}
                      onChange={(e) => updateRow(row.id, 'phonetic', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-50 dark:text-zinc-100 text-zinc-900 border dark:border-zinc-700 border-zinc-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      placeholder="optional"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1">
                      <button onClick={() => swapRow(row.id)} className="p-1.5 rounded-lg dark:hover:bg-zinc-700 hover:bg-zinc-200 min-h-11 min-w-11 flex items-center justify-center" title="Tauschen">
                        <ArrowLeftRight size={14} className="dark:text-zinc-400 text-zinc-500" />
                      </button>
                      <button onClick={() => deleteRow(row.id)} className="p-1.5 rounded-lg dark:hover:bg-rose-500/10 hover:bg-rose-50 min-h-11 min-w-11 flex items-center justify-center" title="Löschen">
                        <Trash2 size={14} className="text-rose-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t dark:border-zinc-800 border-zinc-200">
        <button onClick={addRow} className="flex items-center gap-1.5 text-xs dark:text-zinc-400 text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700 py-1.5 min-h-11">
          <Plus size={14} /> Zeile hinzufügen
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-4 border-t dark:border-zinc-800 border-zinc-200 dark:bg-zinc-800/30 bg-zinc-50">
        <select
          aria-label="Zieldeck"
          value={selectedDeckId}
          onChange={(e) => updateDraft({ selectedDeckId: e.target.value })}
          className="flex-1 px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-11"
        >
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.flag} {d.name}</option>
          ))}
          <option value="__new__">➕ Neues Deck...</option>
        </select>

        {selectedDeckId === '__new__' && (
          <input
            value={newDeckName}
            onChange={(e) => updateDraft({ newDeckName: e.target.value })}
            placeholder="Deck-Name..."
            className="flex-1 px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-11"
          />
        )}

        {selectedDeckId === '__new__' && <select aria-label="Sprache des neuen Decks" value={language} onChange={e => updateDraft({ language: e.target.value })} className="min-h-11 px-3 rounded-xl bg-white dark:bg-zinc-800">
          {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
        </select>}
        <motion.button
          disabled={!validTarget || !validRows.length || validRows.length !== rows.length}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 min-h-11"
          whileTap={{ scale: 0.96 }}
        >
          <Save size={16} />
          In Deck speichern
        </motion.button>
      </div>
    </motion.div>
  );
}
