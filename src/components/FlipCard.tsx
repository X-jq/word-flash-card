import { useState } from 'react';
import { Volume2, ImageIcon } from 'lucide-react';
import type { WordCard } from '@/types';

interface FlipCardProps {
  card: WordCard;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function FlipCard({ card, onEdit, onDelete, compact = false }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.audio_url) {
      new Audio(card.audio_url).play().catch(() => {});
    }
  };

  return (
    <div
      className={`group relative w-full ${compact ? 'h-72' : 'h-80'} cursor-pointer`}
      style={{ perspective: '1200px' }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm p-6"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.word}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-90"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          ) : null}
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {card.word}
            </span>
            {card.phonetic ? (
              <span className="mt-2 text-sm text-slate-500 font-mono">
                /{card.phonetic}/
              </span>
            ) : null}
            {card.audio_url ? (
              <button
                onClick={playAudio}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                发音
              </button>
            ) : null}
            <span className="mt-6 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
              点击翻转卡片
            </span>
          </div>
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs text-slate-400">
            <ImageIcon className="w-3 h-3" />
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 border border-teal-700 shadow-lg p-5 overflow-y-auto text-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <h3 className="text-xl font-bold mb-3 border-b border-white/20 pb-2">
            {card.word}
          </h3>
          <div className="space-y-2 text-sm">
            {card.definition ? (
              <div>
                <span className="text-teal-200 font-medium">释义：</span>
                <span className="text-white/95">{card.definition}</span>
              </div>
            ) : null}
            {card.root ? (
              <div>
                <span className="text-teal-200 font-medium">词根：</span>
                <span className="text-white/95">{card.root}</span>
              </div>
            ) : null}
            {card.example ? (
              <div>
                <span className="text-teal-200 font-medium">例句：</span>
                <span className="text-white/95 italic">{card.example}</span>
              </div>
            ) : null}
            {card.phrases ? (
              <div>
                <span className="text-teal-200 font-medium">短语：</span>
                <span className="text-white/95">{card.phrases}</span>
              </div>
            ) : null}
            {card.custom_fields && card.custom_fields.length > 0 ? (
              <div className="space-y-1 pt-1">
                {card.custom_fields.map((f, i) => (
                  <div key={i}>
                    <span className="text-teal-200 font-medium">{f.label}：</span>
                    <span className="text-white/95">{f.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {onEdit || onDelete ? (
            <div className="mt-auto pt-3 flex gap-2">
              {onEdit ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
                >
                  编辑
                </button>
              ) : null}
              {onDelete ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-xs bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  删除
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
