import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X, Volume2 } from 'lucide-react';
import type { WordCard } from '@/types';
import { FlipCard } from '@/components/FlipCard';

interface StudyModeProps {
  cards: WordCard[];
  deckName: string;
  onExit: () => void;
}

export function StudyMode({ cards, deckName, onExit }: StudyModeProps) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % cards.length);
  }, [cards.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }, [cards.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onExit]);

  if (cards.length === 0) return null;

  const card = cards[index];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-white/90 font-medium">{deckName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50">
            {index + 1} / {cards.length}
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {showAll ? '卡片模式' : '列表模式'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      {showAll ? (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {cards.map((c, i) => (
              <div
                key={c.id}
                className={`rounded-2xl p-5 transition-all ${
                  i === index
                    ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                    : 'bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold">{c.word}</span>
                      {c.phonetic ? (
                        <span className={`text-sm font-mono ${i === index ? 'text-teal-200' : 'text-white/50'}`}>
                          /{c.phonetic}/
                        </span>
                      ) : null}
                      {c.audio_url ? (
                        <button
                          onClick={() => new Audio(c.audio_url).play().catch(() => {})}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                            i === index ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <Volume2 className="w-3 h-3" />
                          播放
                        </button>
                      ) : null}
                    </div>
                    {c.definition ? <p className="text-sm mt-1">{c.definition}</p> : null}
                    {c.example ? <p className="text-sm italic mt-1 opacity-80">{c.example}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-md">
            <FlipCard card={card} compact />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <button
          onClick={prev}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          上一张
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % cards.length)}
          className="p-2.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          title="重新开始"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={next}
          className="inline-flex items-center gap-2 text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          下一张
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
