import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseTextToVocab } from '../../services/textParser';
import type { ScanResult } from '../../types';

interface Props {
  onParseComplete: (results: ScanResult[]) => boolean;
}

export default function TextInput({ onParseComplete }: Props) {
  const [text, setText] = useState('');

  const handleParse = () => {
    if (!text.trim()) return;
    const results = parseTextToVocab(text);
    if (results.length === 0) {
      alert('Keine Wortpaare erkannt. Achte darauf, dass jede Zeile ein Trennzeichen enthält (-, :, ;, Tab).');
      return;
    }
    if (onParseComplete(results)) setText('');
  };

  return (
    <div className="space-y-4">
      <textarea aria-label="Vokabelliste" maxLength={200000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Füge deine Vokabelliste ein (ein Paar pro Zeile):\n\nadventure - Abenteuer\njourney → Reise\nluggage; Gepäck\npassport : Reisepass`}
        className="w-full min-h-[200px] px-4 py-3 rounded-xl dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 dark:text-zinc-100 text-zinc-900 placeholder:dark:text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y text-sm leading-relaxed"
      />
      <motion.button
        onClick={handleParse}
        disabled={!text.trim()}
        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors min-h-11"
        whileTap={{ scale: 0.96 }}
      >
        <Sparkles size={18} />
        Erkennen
      </motion.button>
    </div>
  );
}
