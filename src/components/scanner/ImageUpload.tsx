import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { compressImage } from '../../services/imageCompressor';
import { scanImageWithGemini } from '../../services/visionScanner';
import type { ScanResult } from '../../types';

interface Props {
  onScanComplete: (results: ScanResult[]) => void;
  isScanning: boolean;
  onScanStart: () => void;
  onScanEnd: () => void;
  language: string;
}

export default function ImageUpload({ onScanComplete, isScanning, onScanStart, onScanEnd, language }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const onEnd = useRef(onScanEnd);
  useEffect(() => { onEnd.current = onScanEnd; }, [onScanEnd]);
  useEffect(() => () => { request.current?.abort(); onEnd.current(); }, []);
  const [status, setStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (request.current) return;
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien hochladen');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { setError('Das Bild darf maximal 10 MB groß sein.'); return; }
    if (!navigator.onLine) { setError('Du bist offline. Nutze den Text-Modus.'); return; }
    const controller = new AbortController();
    request.current = controller;
    setError(null);
    setStatus('Bild wird vorbereitet …');
    onScanStart();

    try {
      const compressed = await compressImage(file, 1600, 0.8, controller.signal);
      controller.signal.throwIfAborted();
      setPreview(compressed);

      const results = await scanImageWithGemini(compressed, language, controller.signal, setStatus);
      controller.signal.throwIfAborted();
      if (results.length === 0) {
        setError('Keine Vokabeln erkannt. Versuche ein schärferes Foto oder den Text-Modus.');
      } else {
        onScanComplete(results);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      if (request.current === controller) { request.current = null; onScanEnd(); }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 1) { setError('Bitte nur ein Foto auf einmal ablegen. Weitere Fotos kannst du nach Abschluss einzeln scannen.'); return; }
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button" tabIndex={isScanning ? -1 : 0} aria-label="Foto auswählen" aria-disabled={isScanning}
        onKeyDown={e => { if (!isScanning && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileRef.current?.click(); } }}
        onClick={() => { if (!isScanning) fileRef.current?.click(); }}
        className={`relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[200px] ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'dark:border-zinc-700 border-zinc-300 dark:hover:border-zinc-600 hover:border-zinc-400 dark:bg-zinc-900/50 bg-zinc-50'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        {isScanning ? (
          <>
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <p className="text-sm dark:text-zinc-400 text-zinc-500" role="status">{status}</p>
          </>
        ) : preview ? (
          <div className="relative">
            <img src={preview} alt="Vorschau" className="max-h-48 rounded-xl object-contain" />
            <p className="text-xs dark:text-zinc-500 text-zinc-400 mt-2 text-center">Klicke für ein neues Foto</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center">
              <Camera size={28} className="dark:text-zinc-400 text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium dark:text-zinc-300 text-zinc-700">Foto aufnehmen oder Bild hierher ziehen</p>
              <p className="text-xs dark:text-zinc-500 text-zinc-400 mt-1">JPG, PNG — max. 10 MB</p>
            </div>
          </>
        )}
      </motion.div>

      {isScanning && <button className="min-h-11 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" onClick={() => { request.current?.abort(); }}>Scan abbrechen</button>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}
    </div>
  );
}
