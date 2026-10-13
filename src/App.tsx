import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Trash2,
  Pencil,
  Search,
  GraduationCap,
  BookMarked,
  Volume2,
  Upload,
  Library,
} from 'lucide-react';
import type { Deck, WordCard } from '@/types';
import { supabase } from '@/lib/supabase';
import { FlipCard } from '@/components/FlipCard';
import { CardEditor } from '@/components/CardEditor';
import { DeckEditor } from '@/components/DeckEditor';
import { StudyMode } from '@/components/StudyMode';
import { ImportModal } from '@/components/ImportModal';
import { WordBookModal } from '@/components/WordBookModal';

type View = 'decks' | 'cards';

export default function App() {
  const [view, setView] = useState<View>('decks');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<WordCard[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showDeckEditor, setShowDeckEditor] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [showCardEditor, setShowCardEditor] = useState(false);
  const [editingCard, setEditingCard] = useState<WordCard | null>(null);

  const [studying, setStudying] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showWordBooks, setShowWordBooks] = useState(false);

  // Load decks
  const loadDecks = useCallback(async () => {
    const { data } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });
    setDecks((data as Deck[]) ?? []);
  }, []);

  // Load cards for a deck
  const loadCards = useCallback(async (deckId: string) => {
    const { data } = await supabase
      .from('word_cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    setCards((data as WordCard[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDecks();
      setLoading(false);
    })();
  }, [loadDecks]);

  const openDeck = async (deck: Deck) => {
    setActiveDeck(deck);
    setView('cards');
    await loadCards(deck.id);
  };

  const backToDecks = () => {
    setView('decks');
    setActiveDeck(null);
    setCards([]);
    setSearch('');
  };

  const handleDeleteDeck = async (deck: Deck) => {
    if (!confirm(`确定删除卡组「${deck.name}」及其所有卡片吗？`)) return;
    await supabase.from('decks').delete().eq('id', deck.id);
    await loadDecks();
    if (activeDeck?.id === deck.id) backToDecks();
  };

  const handleDeleteCard = async (card: WordCard) => {
    if (!confirm(`确定删除卡片「${card.word}」吗？`)) return;
    await supabase.from('word_cards').delete().eq('id', card.id);
    if (activeDeck) await loadCards(activeDeck.id);
  };

  const filteredCards = search.trim()
    ? cards.filter(
        (c) =>
          c.word.toLowerCase().includes(search.toLowerCase()) ||
          c.definition.toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  // --- Study Mode ---
  if (studying && activeDeck) {
    return (
      <StudyMode
        cards={cards}
        deckName={activeDeck.name}
        onExit={() => setStudying(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === 'cards' ? (
              <button
                onClick={backToDecks}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  单词卡片
                </h1>
                <p className="text-xs text-slate-400 leading-tight">
                  {view === 'decks'
                    ? '我的卡组'
                    : activeDeck?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'cards' ? (
              <>
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索单词..."
                    className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all w-44"
                  />
                </div>
                <button
                  onClick={() => setStudying(true)}
                  disabled={cards.length === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">学习</span>
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">导入词表</span>
                </button>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setShowCardEditor(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">添加卡片</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWordBooks(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Library className="w-4 h-4" />
                  <span className="hidden sm:inline">词书库</span>
                </button>
                <button
                  onClick={() => {
                    setEditingDeck(null);
                    setShowDeckEditor(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">新建卡组</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : view === 'decks' ? (
          /* --- Decks view --- */
          decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">
                还没有卡组
              </h2>
              <p className="text-sm text-slate-400 mb-6 max-w-sm">
                创建你的第一个卡组，开始添加单词卡片。每张卡片可以包含释义、音标、例句、词根、短语等丰富内容。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWordBooks(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Library className="w-4 h-4" />
                  浏览词书
                </button>
                <button
                  onClick={() => {
                    setEditingDeck(null);
                    setShowDeckEditor(true);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  创建卡组
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onOpen={() => openDeck(deck)}
                  onEdit={() => {
                    setEditingDeck(deck);
                    setShowDeckEditor(true);
                  }}
                  onDelete={() => handleDeleteDeck(deck)}
                />
              ))}
            </div>
          )
        ) : (
          /* --- Cards view --- */
          <div>
            {/* Mobile search */}
            <div className="relative sm:hidden mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索单词..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
              />
            </div>

            {activeDeck?.description ? (
              <p className="text-sm text-slate-500 mb-6">{activeDeck.description}</p>
            ) : null}

            {filteredCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-6">
                  <BookMarked className="w-10 h-10 text-teal-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">
                  {search ? '没有找到匹配的卡片' : '还没有卡片'}
                </h2>
                <p className="text-sm text-slate-400 mb-6 max-w-sm">
                  {search
                    ? '试试其他关键词'
                    : '添加你的第一张单词卡片，支持图片、音频和自定义字段'}
                </p>
                {!search ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImport(true)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      导入词表
                    </button>
                    <button
                      onClick={() => {
                        setEditingCard(null);
                        setShowCardEditor(true);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加卡片
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCards.map((card) => (
                  <FlipCard
                    key={card.id}
                    card={card}
                    onEdit={() => {
                      setEditingCard(card);
                      setShowCardEditor(true);
                    }}
                    onDelete={() => handleDeleteCard(card)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Editors */}
      {showDeckEditor ? (
        <DeckEditor
          deck={editingDeck}
          onClose={() => setShowDeckEditor(false)}
          onSaved={() => {
            setShowDeckEditor(false);
            loadDecks();
          }}
        />
      ) : null}

      {showCardEditor && activeDeck ? (
        <CardEditor
          card={editingCard}
          deckId={activeDeck.id}
          onClose={() => setShowCardEditor(false)}
          onSaved={() => {
            setShowCardEditor(false);
            loadCards(activeDeck.id);
          }}
        />
      ) : null}

      {showImport && activeDeck ? (
        <ImportModal
          deckId={activeDeck.id}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            loadCards(activeDeck.id);
          }}
        />
      ) : null}

      {showWordBooks ? (
        <WordBookModal
          onClose={() => setShowWordBooks(false)}
          onImported={() => {
            setShowWordBooks(false);
            loadDecks();
          }}
        />
      ) : null}
    </div>
  );
}

interface DeckCardProps {
  deck: Deck;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DeckCard({ deck, onOpen, onEdit, onDelete }: DeckCardProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from('word_cards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deck.id);
      setCount(c ?? 0);
    })();
  }, [deck.id]);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <button
        onClick={onOpen}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
            <Layers className="w-5 h-5 text-teal-600" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1">
          {deck.name}
        </h3>
        {deck.description ? (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {deck.description}
          </p>
        ) : (
          <div className="mb-3" />
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{count !== null ? `${count} 张卡片` : '...'}</span>
        </div>
      </button>
      <div className="flex border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          编辑
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={onDelete}
          className="flex-1 py-2.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          删除
        </button>
      </div>
    </div>
  );
}
