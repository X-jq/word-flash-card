import { useState } from 'react';
import {
  X,
  BookOpen,
  Check,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import type { WordBook } from '@/lib/wordBooks';
import {
  wordBooks,
  categoryLabels,
  categoryColors,
} from '@/lib/wordBooks';
import type { WordCardInput } from '@/types';
import { supabase } from '@/lib/supabase';

interface WordBookModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function WordBookModal({ onClose, onImported }: WordBookModalProps) {
  const [selectedBook, setSelectedBook] = useState<WordBook | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const categories = Object.keys(categoryLabels) as WordBook['category'][];
  const filteredBooks = search.trim()
    ? wordBooks.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.level.toLowerCase().includes(search.toLowerCase())
      )
    : wordBooks;

  const handleImport = async (book: WordBook) => {
    setImporting(true);

    // Create a new deck for this word book
    const { data: deckData, error: deckError } = await supabase
      .from('decks')
      .insert({
        name: book.name,
        description: book.description,
      })
      .select('id')
      .single();

    if (deckError || !deckData) {
      setImporting(false);
      return;
    }

    const deckId = deckData.id;

    const payload: WordCardInput[] = book.cards.map((c) => ({
      deck_id: deckId,
      word: c.word,
      definition: c.definition ?? '',
      phonetic: c.phonetic ?? '',
      example: c.example ?? '',
      root: c.root ?? '',
      phrases: c.phrases ?? '',
      image_url: c.image_url ?? '',
      audio_url: c.audio_url ?? '',
      custom_fields: c.custom_fields ?? [],
    }));

    const { data, error: cardError } = await supabase
      .from('word_cards')
      .insert(payload)
      .select('id');

    setImporting(false);

    if (cardError || !data) {
      setImportedCount(0);
      return;
    }

    setImportedCount(data.length);
    setTimeout(() => {
      onImported();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {selectedBook ? (
              <button
                onClick={() => setSelectedBook(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500" />
                {selectedBook ? selectedBook.name : '内置词书'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedBook
                  ? `共 ${selectedBook.cardCount} 个单词`
                  : '选择词书，一键导入为新卡组'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {importedCount !== null ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                导入完成
              </h3>
              <p className="text-sm text-slate-400">
                成功导入 {importedCount} 张卡片到新卡组
              </p>
            </div>
          ) : selectedBook ? (
            /* --- Word book detail view --- */
            <div className="p-6">
              <div
                className={`rounded-2xl bg-gradient-to-br ${categoryColors[selectedBook.category]} p-5 mb-5 text-white`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                      {categoryLabels[selectedBook.category]}
                    </span>
                    <h3 className="text-xl font-bold mt-2">{selectedBook.name}</h3>
                    <p className="text-sm text-white/80 mt-1">
                      {selectedBook.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{selectedBook.cardCount}</div>
                    <div className="text-xs text-white/70">个单词</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">单词预览</h4>
                <button
                  onClick={() => handleImport(selectedBook)}
                  disabled={importing}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      导入为新卡组
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedBook.cards.map((card, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-slate-50 rounded-lg px-3.5 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {card.word}
                        </span>
                        {card.phonetic ? (
                          <span className="text-xs text-slate-400 font-mono">
                            /{card.phonetic}/
                          </span>
                        ) : null}
                      </div>
                      {card.definition ? (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {card.definition}
                        </p>
                      ) : null}
                    </div>
                    {card.root ? (
                      <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded flex-shrink-0">
                        词根
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- Book list view --- */
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索词书..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                />
              </div>

              {/* Category groups */}
              {categories.map((cat) => {
                const books = filteredBooks.filter((b) => b.category === cat);
                if (books.length === 0) return null;

                return (
                  <div key={cat} className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${categoryColors[cat]}`}
                      />
                      {categoryLabels[cat]}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {books.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className="group text-left bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-teal-200 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[book.category]} flex items-center justify-center`}
                            >
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">
                            {book.name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {book.description}
                          </p>
                          <span className="text-xs text-slate-500 font-medium">
                            {book.cardCount} 词
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  没有找到匹配的词书
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
