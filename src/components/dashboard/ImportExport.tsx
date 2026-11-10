import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { downloadJSON } from '../../utils/download';
import { getToday } from '../../utils/xp';
import { exportAllData, importAllData, acceptValidatedImport } from '../../utils/storage';

export default function ImportExport() {
  const { dispatch, state } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadJSON(exportAllData(state.decks, state.progress), `snapvocab-backup-${getToday()}.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { window.alert('Backup zu groß (max. 20 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { decks, progress } = importAllData(reader.result as string);
        if (!window.confirm('Dieses gültige Backup ersetzt die aktuellen Decks und den Lernfortschritt. Fortfahren?')) return;
        acceptValidatedImport();
        dispatch({ type: 'IMPORT_DATA', decks, progress });
      } catch {
        alert('Ungültige Backup-Datei. Die bisherigen Daten bleiben unverändert.');
      }
    };
    reader.onerror = () => window.alert('Backup konnte nicht gelesen werden.');
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-zinc-800 border-zinc-200">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border dark:border-zinc-700 border-zinc-300 dark:text-zinc-300 text-zinc-700 text-sm font-medium dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors min-h-11"
      >
        <Download size={16} />
        Backup exportieren
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border dark:border-zinc-700 border-zinc-300 dark:text-zinc-300 text-zinc-700 text-sm font-medium dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors min-h-11"
      >
        <Upload size={16} />
        Backup importieren
      </button>

      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
