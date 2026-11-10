import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { LANGUAGES } from '../../data/languages';
import type { ScanResult } from '../../types';
import ImageUpload from './ImageUpload';
import TextInput from './TextInput';
import StagingTable from './StagingTable';

type Tab = 'photo' | 'text';

export default function Scanner() {
  const { state, updateSettings, setScannerDraft } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [scanLanguage, setScanLanguage] = useState(state.scannerDraft?.language ?? 'en');
  const [isScanning, setIsScanning] = useState(false);

  const hasApiKey = !!state.settings.geminiApiKey;

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

      {hasApiKey ? (
        <div className="flex flex-wrap gap-2 items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Persönlicher Gemini-Key hinterlegt</span>
          </div>
          <span className="text-[11px] dark:text-zinc-400 text-zinc-500">
            Fotos werden automatisch analysiert & Vokabelpaare extrahiert
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm dark:text-amber-200 text-amber-800 font-medium">Kein Gemini API-Key hinterlegt</p>
            <p className="text-xs dark:text-amber-300/70 text-amber-700 mt-0.5">
              Für die KI-Bilderkennung benötigst du einen persönlichen Gemini API-Key. Trage ihn unten ein oder nutze den Text-Modus.
            </p>
          </div>
        </div>
      )}

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

      <div className="p-4 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200">
        <h3 className="text-sm font-medium dark:text-zinc-300 text-zinc-700 mb-3">⚙️ Gemini API-Key</h3>
        <input
          aria-label="Persönlicher Gemini API-Key"
          type="password"
          value={state.settings.geminiApiKey}
          onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
          placeholder="API-Key eingeben..."
          className="w-full px-4 py-3 rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 placeholder:dark:text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
        />
        <p className="text-xs dark:text-zinc-500 text-zinc-400 mt-2">
          Dein persönlicher Key wird auf diesem Gerät gespeichert und nur für Scans an Google übermittelt. Key verwalten auf <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 underline">aistudio.google.com</a>
        </p>
      </div>
    </div>
  );
}
