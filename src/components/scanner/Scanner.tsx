import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../hooks/useStore';
import { LANGUAGES } from '../../data/languages';
import type { ScanResult } from '../../types';
import ImageUpload from './ImageUpload';
import TextInput from './TextInput';
import StagingTable from './StagingTable';

type Tab = 'photo' | 'text';

export default function Scanner() {
  const { state, setScannerDraft } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [scanLanguage, setScanLanguage] = useState(state.scannerDraft?.language ?? 'en');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanComplete = (results: ScanResult[]): boolean => {
    if (state.scannerDraft?.rows.length && !window.confirm('Den vorhandenen Scan-Entwurf durch die neuen Ergebnisse ersetzen?')) return false;
    setScannerDraft({ rows: results.map(row => ({ ...row, id: crypto.randomUUID() })), selectedDeckId: state.decks.find(d => d.language === scanLanguage)?.id ?? '__new__', newDeckName: '', language: scanLanguage });
    return true;
  };
  const clearDraft = () => {
    if (window.confirm('Den ungespeicherten Scan-Entwurf verwerfen?')) setScannerDraft(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Foto-Scanner</h1>

      <div className="flex dark:bg-zinc-900 bg-zinc-100 rounded-xl p-1">
        {([['photo', '📸 Foto scannen'], ['text', '📝 Text einfügen']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors min-h-11 ${
              activeTab === id ? 'dark:text-zinc-100 text-zinc-900' : 'dark:text-zinc-500 text-zinc-500'
            }`}
          >
            {activeTab === id && (
              <motion.div
                layoutId="scanner-tab"
                className="absolute inset-0 dark:bg-zinc-800 bg-white rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <label className="flex flex-wrap items-center gap-3 text-sm">Fremdsprache des Fotos
        <select aria-label="Fremdsprache des Fotos" value={scanLanguage} onChange={e => setScanLanguage(e.target.value)} disabled={isScanning} className="min-h-11 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
        </select>
      </label>
      {activeTab === 'photo' ? (
        <ImageUpload language={scanLanguage} onScanComplete={handleScanComplete} isScanning={isScanning} onScanStart={() => setIsScanning(true)} onScanEnd={() => setIsScanning(false)} />
      ) : (
        <TextInput onParseComplete={handleScanComplete} />
      )}

      {(state.scannerDraft?.rows.length ?? 0) > 0 && (
        <StagingTable onClear={clearDraft} decks={state.decks} />
      )}


    </div>
  );
}
