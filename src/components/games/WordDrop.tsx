import { useState, useEffect, useReducer, useRef } from 'react';
import { usePageVisible } from '../../hooks/usePageVisible';
import { shuffle, quizOptions } from '../../utils/study';
import { dropReducer, initialDrop } from '../../utils/gameState';
import { Trophy, RotateCcw, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Deck } from '../../types';

interface Props {
  deck: Deck;
  onComplete: (score: number) => void;
}

export default function WordDrop({ deck, onComplete }: Props) {
  const [cards] = useState(() => shuffle(deck.cards));
  const [optionsByCard] = useState(() => new Map(cards.map(card => [card.id, quizOptions(card, cards, 'term-to-translation')])));
  const [game, dispatch] = useReducer(dropReducer, initialDrop);
  const visible = usePageVisible();
  const reported = useRef(-1);
  const countdown = useRef({ id: '', remaining: 4500 });
  const { score, lives } = game;
  const gameOver = lives === 0;
  const card = cards[game.index % cards.length];
  const wordId = `${game.round}-${game.index}`;
  const currentWord = card ? { id: wordId, card, options: optionsByCard.get(card.id) ?? [] } : null;
  useEffect(() => {
    if (countdown.current.id !== wordId) countdown.current = { id: wordId, remaining: 4500 };
    if (gameOver || !visible || !card) return;
    const start = performance.now();
    const timer = setTimeout(() => dispatch({ type: 'answer', index: game.index, round: game.round, correct: false }), countdown.current.remaining);
    return () => { clearTimeout(timer); countdown.current.remaining = Math.max(0, countdown.current.remaining - (performance.now() - start)); };
  }, [wordId, game.index, game.round, gameOver, visible, card]);
  useEffect(() => {
    if (!gameOver || reported.current === game.round) return;
    reported.current = game.round;
    onComplete(score);
    if (score > 0) confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  }, [gameOver, game.round, score, onComplete]);
  const handleSelectOption = (option: string) => {
    if (!visible || !currentWord) return;
    dispatch({ type: 'answer', index: game.index, round: game.round, correct: option === currentWord.card.translation });
  };
  const handleRestart = () => dispatch({ type: 'restart' });

  if (cards.length < 4 || new Set(cards.map(c => c.translation.trim().toLocaleLowerCase())).size < 4) return <p>Word Drop benötigt vier unterschiedliche Übersetzungen.</p>;
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 text-center space-y-4">
        <Trophy size={48} className="text-amber-500 animate-bounce" />
        <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Spiel vorbei!</h2>
        <p className="text-lg font-semibold text-indigo-500">{score} Punkte erzielt</p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
        >
          <RotateCcw size={18} /> Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 py-2 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200">
        <div className="flex items-center gap-1.5 text-rose-500">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              size={20}
              fill={i < lives ? 'currentColor' : 'none'}
              className={i < lives ? 'text-rose-500' : 'text-zinc-400 opacity-40'}
            />
          ))}
        </div>
        <div className="text-sm font-bold text-indigo-500">Score: {score}</div>
      </div>

      <div className="relative h-64 rounded-2xl dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 overflow-hidden flex flex-col items-center justify-center">
        {currentWord && <div key={currentWord.id}
          className="word-drop-token mx-3 max-w-[calc(100%-1.5rem)] [overflow-wrap:anywhere] text-center px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xl shadow-lg"
          style={{ animationPlayState: visible ? 'running' : 'paused' }}>
          {currentWord.card.term}
        </div>}

      </div>

      {!visible && <p role="status">Spiel pausiert</p>}
      <div className="grid grid-cols-2 gap-3">
        {currentWord?.options.map((option) => (
          <button
            key={option}
            disabled={!visible || gameOver} onClick={() => handleSelectOption(option)}
            className="min-w-0 [overflow-wrap:anywhere] p-4 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-zinc-800/80 font-medium text-sm text-center transition-all min-h-12"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
