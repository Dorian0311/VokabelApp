export async function compressImage(file: File, maxSize = 1600, quality = 0.8, signal?: AbortSignal): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Das Bild darf maximal 10 MB groß sein.');
  if (!Number.isFinite(maxSize) || maxSize < 1 || !Number.isFinite(quality) || quality <= 0 || quality > 1) throw new Error('Ungültige Bildkomprimierung.');
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => { URL.revokeObjectURL(url); signal?.removeEventListener('abort', abort); img.onload = null; img.onerror = null; };
    const abort = () => { cleanup(); img.src = ''; reject(new DOMException('Abgebrochen', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    img.onload = () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        if (!width || !height || width * height > 50000000) throw new Error('Das Bild ist zu groß. Bitte einen kleineren Ausschnitt verwenden.');
        const ratio = Math.min(1, maxSize / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Bildverarbeitung ist nicht verfügbar.');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL('image/jpeg', quality);
        if (!result.startsWith('data:image/jpeg;base64,')) throw new Error('JPEG-Konvertierung fehlgeschlagen.');
        resolve(result);
      } catch (error) { reject(error); }
      finally { cleanup(); }
    };
    img.onerror = () => { cleanup(); reject(new Error('Bild nicht lesbar. Bitte als JPG oder PNG auswählen (HEIC ggf. vorher konvertieren).')); };
    img.src = url;
  });
}
