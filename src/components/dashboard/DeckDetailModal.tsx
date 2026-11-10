import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Volume2, Search, Play, Check, AlertTriangle } from 'lucide-react';
import { useModal } from '../../hooks/useModal';
import { useStore } from '../../hooks/useStore';
import { speak, getLanguageCode } from '../../utils/speech';
import type { Deck, VocabCard } from '../../types';

interface Props {
  deck: Deck;
  isOpen: boolean;
  onClose: () => void;
  onLearn: (deckId: string) => void;
}

export default function DeckDetailModal({ deck, isOpen, onClose, onLearn }: Props) {
  const dialogRef = useModal(isOpen, onClose);
  const { deleteCard, addCard, updateCard, deleteDeck } = useStore();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState(false);

  // New card form state
  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [example, setExample] = useState('');

  // Edit card state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editExample, setEditExample] = useState('');

  const langCode = getLanguageCode(deck.language);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return deck.cards;
    const q = search.toLowerCase();
    return deck.cards.filter(
      (c) =>
        c.term.toLowerCase().includes(q) ||
        c.translation.toLowerCase().includes(q) ||
        (c.example && c.example.toLowerCase().includes(q))
    );
  }, [deck.cards, search]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !translation.trim()) return;
    addCard(deck.id, {
      term,
      translation,
      phonetic: phonetic.trim() || undefined,
      example: example.trim() || undefined,
    });
    setTerm('');
    setTranslation('');
    setPhonetic('');
    setExample('');
    setShowAddForm(false);
  };

  const startEdit = (card: VocabCard) => {
    setEditingCardId(card.id);
    setEditTerm(card.term);
    setEditTranslation(card.translation);
    setEditPhonetic(card.phonetic || '');
    setEditExample(card.example || '');
  };

  const saveEdit = (card: VocabCard) => {
    if (!editTerm.trim() || !editTranslation.trim()) return;
    updateCard(deck.id, {
      ...card,
      term: editTerm.trim(),
      translation: editTranslation.trim(),
      phonetic: editPhonetic.trim() || undefined,
      example: editExample.trim() || undefined,
    });
    setEditingCardId(null);
  };

  const handleDeleteDeck = () => {
    deleteDeck(deck.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Vokabeln verwalten" tabIndex={-1}
            className="relative w-full max-w-2xl max-h-[calc(var(--app-height,100dvh)-2rem)] flex flex-col dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b dark:border-zinc-800 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{deck.flag}</span>
                <div>
                  <h2 className="text-lg font-bold dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
                    {deck.name}
                  </h2>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500">
                    {deck.languageLabel} · {deck.cards.length} Vokabel{deck.cards.length !== 1 ? 'n' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConfirmDeleteDeck(true)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors min-h-11 min-w-11 flex items-center justify-center"
                  title="Deck löschen"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  aria-label="Dialog schließen" onClick={onClose}
                  className="p-2 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors min-h-11 min-w-11 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Confirm Delete Banner */}
            {confirmDeleteDeck && (
              <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-rose-500 font-medium">
                  <AlertTriangle size={18} />
                  <span>Deck wirklich löschen? Alle {deck.cards.length} Vokabeln gehen verloren.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDeleteDeck(false)}
                    className="px-3 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-200 text-xs font-semibold"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleDeleteDeck}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Ja, löschen
                  </button>
                </div>
              </div>
            )}

            {/* Actions Bar: Search & Add Button */}
            <div className="p-4 border-b dark:border-zinc-800 border-zinc-200 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-zinc-500 text-zinc-400" />
                <input
                  type="text"
                  aria-label="Vokabeln durchsuchen" maxLength={4000} placeholder="Vokabeln durchsuchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 dark:text-zinc-100 text-zinc-900 placeholder:dark:text-zinc-500 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors min-h-10 shrink-0"
              >
                <Plus size={16} />
                <span>Neue Vokabel</span>
              </button>
            </div>

            {/* Add Card Form Accordion */}
            {showAddForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddCard}
                className="max-h-[50dvh] shrink-0 overflow-y-auto p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b dark:border-zinc-800 border-zinc-200 space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Neue Vokabel anlegen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium dark:text-zinc-400 text-zinc-500 mb-1">
                      Fremdwort ({deck.languageLabel}) *
                    </label>
                    <input
                      type="text"
                      required
                      aria-label="Fremdwort" maxLength={4000} placeholder="z.B. challenge"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium dark:text-zinc-400 text-zinc-500 mb-1">
                      Deutsche Übersetzung *
                    </label>
                    <input
                      type="text"
                      required
                      aria-label="Deutsche Übersetzung" maxLength={4000} placeholder="z.B. Herausforderung"
                      value={translation}
                      onChange={(e) => setTranslation(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium dark:text-zinc-400 text-zinc-500 mb-1">
                      Lautschrift (optional)
                    </label>
                    <input
                      type="text"
                      aria-label="Lautschrift" maxLength={4000} placeholder="z.B. /ˈtʃælɪndʒ/"
                      value={phonetic}
                      onChange={(e) => setPhonetic(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium dark:text-zinc-400 text-zinc-500 mb-1">
                      Beispielsatz (optional)
                    </label>
                    <input
                      type="text"
                      aria-label="Beispielsatz" maxLength={4000} placeholder="z.B. It was a tough challenge."
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    <Check size={14} /> Speichern
                  </button>
                </div>
              </motion.form>
            )}

            {/* Cards List */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCards.length === 0 ? (
                <div className="text-center py-12 text-sm dark:text-zinc-500 text-zinc-400">
                  {search ? 'Keine Vokabeln gefunden.' : 'Noch keine Vokabeln im Deck. Füge welche hinzu oder nutze den Scanner!'}
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isEditing = editingCardId === card.id;

                  if (isEditing) {
                    return (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-xl border dark:border-indigo-500/50 border-indigo-300 dark:bg-zinc-800/80 bg-indigo-50/30 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editTerm}
                            onChange={(e) => setEditTerm(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-300 font-semibold"
                            aria-label="Fremdwort bearbeiten" maxLength={4000} placeholder="Fremdwort"
                          />
                          <input
                            type="text"
                            value={editTranslation}
                            onChange={(e) => setEditTranslation(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-300 font-semibold"
                            aria-label="Übersetzung bearbeiten" maxLength={4000} placeholder="Übersetzung"
                          />
                          <input
                            type="text"
                            value={editPhonetic}
                            onChange={(e) => setEditPhonetic(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-300 italic"
                            aria-label="Lautschrift bearbeiten" maxLength={4000} placeholder="Lautschrift"
                          />
                          <input
                            type="text"
                            value={editExample}
                            onChange={(e) => setEditExample(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-300"
                            aria-label="Beispielsatz bearbeiten" maxLength={4000} placeholder="Beispielsatz"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingCardId(null)}
                            className="px-2.5 py-1 text-xs rounded-lg dark:text-zinc-400 text-zinc-600"
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={() => saveEdit(card)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={card.id}
                      className="group flex items-center justify-between p-3 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/60 bg-white hover:border-indigo-500/40 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => speak(card.term, langCode)}
                          className="p-2 rounded-lg dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 text-indigo-500 transition-colors shrink-0 min-h-11 min-w-11 flex items-center justify-center"
                          title="Aussprache abspielen"
                        >
                          <Volume2 size={16} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="[overflow-wrap:anywhere] font-semibold text-sm dark:text-zinc-100 text-zinc-900">
                              {card.term}
                            </span>
                            {card.phonetic && (
                              <span className="text-xs dark:text-zinc-500 text-zinc-400 italic">
                                {card.phonetic}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium truncate">
                            {card.translation}
                          </p>
                          {card.example && (
                            <p className="text-[11px] dark:text-zinc-500 text-zinc-400 italic truncate mt-0.5">
                              "{card.example}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(card)}
                          className="p-1.5 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCard(deck.id, card.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer */}
            <div className="shrink-0 p-4 border-t dark:border-zinc-800 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
              <span className="text-xs dark:text-zinc-400 text-zinc-500">
                {deck.cards.length} Vokabel{deck.cards.length !== 1 ? 'n' : ''} hinterlegt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium dark:text-zinc-300 text-zinc-700 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  Schließen
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onLearn(deck.id);
                  }}
                  disabled={deck.cards.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Play size={14} fill="currentColor" />
                  Jetzt lernen
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
