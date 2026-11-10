let pendingCleanup: (() => void) | undefined;
export function stopSpeaking(): void {
  pendingCleanup?.();
  pendingCleanup = undefined;
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}
export function speak(text: string, lang = 'en-GB'): void {
  if (!window.speechSynthesis || !text.trim()) return;
  stopSpeaking();
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; utterance.rate = 0.9;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => { if (timer) clearTimeout(timer); synth.removeEventListener('voiceschanged', play); pendingCleanup = undefined; };
  const play = () => {
    cleanup();
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ?? voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };
  if (synth.getVoices().length) play();
  else { synth.addEventListener('voiceschanged', play, { once: true }); timer = setTimeout(play, 250); pendingCleanup = cleanup; }
}

export function getLanguageCode(language: string): string {
  const map: Record<string, string> = {
    en: 'en-GB',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    de: 'de-DE',
    nl: 'nl-NL',
    ru: 'ru-RU',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
  };
  return map[language] ?? 'en-GB';
}
