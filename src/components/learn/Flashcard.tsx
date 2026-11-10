import { Volume2 } from 'lucide-react';
import { speak, getLanguageCode } from '../../utils/speech';
import type { VocabCard, QueryDirection } from '../../types';

interface Props {
  card: VocabCard;
  direction: QueryDirection;
  isFlipped: boolean;
  onFlip: () => void;
  language: string;
}

export default function Flashcard({ card, direction, isFlipped, onFlip, language }: Props) {
  const front = direction === 'term-to-translation' ? card.term : card.translation;
  const back = direction === 'term-to-translation' ? card.translation : card.term;
  const showAudioFront = direction === 'term-to-translation';
  const showAudioBack = direction === 'translation-to-term';
  const langCode = getLanguageCode(language);

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text, langCode);
  };

  return (
    <div className="[perspective:1000px] w-full">
      <div
        onClick={onFlip}
        className={`cursor-pointer relative w-full grid min-h-72 sm:min-h-80 transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front */}
        <div aria-hidden={isFlipped} className="[grid-area:1/1] min-w-0 w-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:translateZ(0)] rounded-2xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 shadow-xl flex flex-col items-center justify-center p-6 pb-16 sm:p-8 sm:pb-16">
          <p className="text-2xl sm:text-3xl font-bold dark:text-zinc-100 text-zinc-900 text-center max-w-full [overflow-wrap:anywhere]">{front}</p>
          {showAudioFront && (
            <button
              aria-label="Fremdwort vorlesen" tabIndex={isFlipped ? -1 : 0} onClick={(e) => handleSpeak(e, card.term)}
              className="mt-4 p-3 rounded-full dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            >
              <Volume2 size={20} className="text-indigo-500" />
            </button>
          )}

        </div>

        {/* Back */}
        <div aria-hidden={!isFlipped} className="[grid-area:1/1] min-w-0 w-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(0)] rounded-2xl dark:bg-zinc-900 bg-white border dark:border-indigo-500/30 border-indigo-200 shadow-xl flex flex-col items-center justify-center p-6 pb-16 sm:p-8 sm:pb-16 gap-3">
          <p className="text-2xl sm:text-3xl font-bold text-indigo-500 text-center max-w-full [overflow-wrap:anywhere]">{back}</p>
          {card.phonetic && (
            <p className="text-sm dark:text-zinc-400 text-zinc-500 italic">{card.phonetic}</p>
          )}
          {showAudioBack && (
            <button
              aria-label="Fremdwort vorlesen" tabIndex={isFlipped ? 0 : -1} onClick={(e) => handleSpeak(e, card.term)}
              className="p-2.5 rounded-full dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            >
              <Volume2 size={18} className="text-indigo-500" />
            </button>
          )}
          {card.example && (
            <p className="text-xs dark:text-zinc-500 text-zinc-400 text-center mt-2 max-w-full [overflow-wrap:anywhere] italic">"{card.example}"</p>
          )}
        </div>
      </div>
      <button onClick={onFlip} aria-label="Karte umdrehen" className="mt-3 w-full min-h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-medium">Karte umdrehen</button>
    </div>
  );
}
