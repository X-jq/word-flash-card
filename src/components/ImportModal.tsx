import { useState, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  Upload,
  Camera,
  ClipboardPaste,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import type { WordCardInput } from '@/types';
import type { ParsedCardData } from '@/lib/wordParser';
import {
  parsePlainText,
  parseFileContent,
  parseOCRText,
} from '@/lib/wordParser';
import { supabase } from '@/lib/supabase';

interface ImportModalProps {
  deckId: string;
  onClose: () => void;
  onImported: () => void;
}

type Tab = 'paste' | 'file' | 'ocr';

export function ImportModal({ deckId, onClose, onImported }: ImportModalProps) {
  const [tab, setTab] = useState<Tab>('paste');

  // Paste tab
  const [pasteText, setPasteText] = useState('');
  const [pasteParsed, setPasteParsed] = useState<ParsedCardData[] | null>(null);

  // File tab
  const [fileParsed, setFileParsed] = useState<ParsedCardData[] | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // OCR tab
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrParsing, setOcrParsing] = useState(false);
  const [ocrParsed, setOcrParsed] = useState<ParsedCardData[] | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Shared
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'paste', label: '粘贴文本', icon: ClipboardPaste },
    { id: 'file', label: 'CSV/TXT 文件', icon: Upload },
    { id: 'ocr', label: '拍照识别', icon: Camera },
  ];

  const currentParsed = tab === 'paste' ? pasteParsed : tab === 'file' ? fileParsed : ocrParsed;

  const handleParsePaste = () => {
    const parsed = parsePlainText(pasteText);
    setPasteParsed(parsed);
  };

  const handleFileContent = (content: string, name: string) => {
    setFileName(name);
    const parsed = parseFileContent(content, name);
    setFileParsed(parsed);
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleOCRImage = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setOcrImage(url);
    setOcrParsing(true);
    setOcrParsed(null);

    try {
      const text = await runOCR(file);
      const parsed = parseOCRText(text);
      setOcrParsed(parsed);
    } catch (err) {
      setOcrParsed([]);
    } finally {
      setOcrParsing(false);
    }
  }, []);

  const removeCard = (index: number) => {
    if (!currentParsed) return;
    if (tab === 'paste') setPasteParsed(currentParsed.filter((_, i) => i !== index));
    else if (tab === 'file') setFileParsed(currentParsed.filter((_, i) => i !== index));
    else setOcrParsed(currentParsed.filter((_, i) => i !== index));
  };

  const updateCardField = (index: number, field: keyof ParsedCardData, value: string) => {
    if (!currentParsed) return;
    const updated = [...currentParsed];
    updated[index] = { ...updated[index], [field]: value };
    if (tab === 'paste') setPasteParsed(updated);
    else if (tab === 'file') setFileParsed(updated);
    else setOcrParsed(updated);
  };

  const handleImport = async () => {
    if (!currentParsed || currentParsed.length === 0) return;
    setImporting(true);

    const payload: WordCardInput[] = currentParsed.map((c) => ({
      deck_id: deckId,
      word: c.word.trim(),
      definition: c.definition ?? '',
      phonetic: c.phonetic ?? '',
      example: c.example ?? '',
      root: c.root ?? '',
      phrases: c.phrases ?? '',
      image_url: c.image_url ?? '',
      audio_url: c.audio_url ?? '',
      custom_fields: c.custom_fields ?? [],
    }));

    const { data, error } = await supabase
      .from('word_cards')
      .insert(payload)
      .select('id');

    setImporting(false);

    if (error || !data) {
      setImportedCount(0);
      return;
    }

    setImportedCount(data.length);
    setTimeout(() => {
      onImported();
    }, 1200);
  };

  const cardCount = currentParsed?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">导入词表</h2>
            <p className="text-xs text-slate-400 mt-0.5">批量创建单词卡片</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 flex-shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t.id
                    ? 'text-teal-600 border-teal-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {importedCount !== null ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                导入完成
              </h3>
              <p className="text-sm text-slate-400">
                成功导入 {importedCount} 张卡片
              </p>
            </div>
          ) : (
            <>
              {/* Paste tab */}
              {tab === 'paste' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      粘贴单词列表
                    </label>
                    <textarea
                      value={pasteText}
                      onChange={(e) => {
                        setPasteText(e.target.value);
                        setPasteParsed(null);
                      }}
                      placeholder={
                        '支持以下格式：\n\n' +
                        '1. 每行一个单词：\nabandon\nabsolute\n\n' +
                        '2. 单词|释义：\nabandon|放弃\nabsolute|绝对的\n\n' +
                        '3. 单词=释义：\nabandon = 放弃\n\n' +
                        '4. 多行带字段：\nabandon\n释义: 放弃\n音标: əˈbændən\n例句: He abandoned the ship.'
                      }
                      className="w-full min-h-[200px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all resize-y"
                    />
                  </div>
                  <button
                    onClick={handleParsePaste}
                    disabled={!pasteText.trim()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    解析文本
                  </button>
                  {pasteParsed ? (
                    <ParsedCardList
                      cards={pasteParsed}
                      onRemove={removeCard}
                      onUpdate={updateCardField}
                    />
                  ) : null}
                </div>
              ) : null}

              {/* File tab */}
              {tab === 'file' ? (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect(file);
                    }}
                    className={`border-2 border-dashed rounded-xl py-12 text-center transition-colors cursor-pointer ${
                      dragOver
                        ? 'border-teal-400 bg-teal-50/50'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      拖放文件到此处，或点击选择
                    </p>
                    <p className="text-xs text-slate-400">
                      支持 CSV、TXT 格式
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </div>

                  {fileName ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="font-medium">{fileName}</span>
                      {fileParsed ? (
                        <span className="text-slate-400">
                          — 解析出 {fileParsed.length} 张卡片
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      CSV 格式说明
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      首行为表头，支持列：word, definition, phonetic, example, root, phrases。
                      其他列名将作为自定义字段导入。
                    </p>
                    <pre className="mt-2 text-xs text-slate-500 bg-white rounded-lg p-2.5 overflow-x-auto">
{`word,definition,phonetic
abandon,放弃,əˈbændən
absolute,绝对的,ˈæbsəluːt`}
                    </pre>
                  </div>

                  {fileParsed ? (
                    <ParsedCardList
                      cards={fileParsed}
                      onRemove={removeCard}
                      onUpdate={updateCardField}
                    />
                  ) : null}
                </div>
              ) : null}

              {/* OCR tab */}
              {tab === 'ocr' ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                    <p className="text-xs text-amber-700 leading-relaxed">
                      拍照或上传课本/单词表照片，系统将自动识别文字并提取单词。识别结果可编辑后再导入。
                    </p>
                  </div>

                  {ocrImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img src={ocrImage} alt="OCR" className="w-full max-h-64 object-contain bg-slate-50" />
                      <button
                        onClick={() => {
                          setOcrImage(null);
                          setOcrParsed(null);
                        }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-600 p-1.5 rounded-lg shadow-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-slate-200 hover:border-teal-300 rounded-xl py-12 text-center cursor-pointer transition-colors"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        拍照或选择图片
                      </p>
                      <p className="text-xs text-slate-400">
                        支持 JPG、PNG 格式
                      </p>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleOCRImage(file);
                        }}
                      />
                    </div>
                  )}

                  {ocrParsing ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                      <span className="ml-3 text-sm text-slate-500">正在识别文字...</span>
                    </div>
                  ) : null}

                  {ocrParsed !== null && !ocrParsing ? (
                    ocrParsed.length > 0 ? (
                      <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-2.5">
                        <p className="text-sm text-teal-700 font-medium">
                          识别到 {ocrParsed.length} 个单词
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5">
                        <p className="text-sm text-red-600">
                          未能识别到单词，请尝试更清晰的照片或使用粘贴文本导入
                        </p>
                      </div>
                    )
                  ) : null}

                  {ocrParsed && ocrParsed.length > 0 ? (
                    <ParsedCardList
                      cards={ocrParsed}
                      onRemove={removeCard}
                      onUpdate={updateCardField}
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        {importedCount === null ? (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <span className="text-sm text-slate-400">
              {cardCount > 0 ? `共 ${cardCount} 张卡片待导入` : ''}
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={cardCount === 0 || importing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    导入 {cardCount > 0 ? `${cardCount} ` : ''}张卡片
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --- Parsed card list (editable preview) ---

interface ParsedCardListProps {
  cards: ParsedCardData[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ParsedCardData, value: string) => void;
}

function ParsedCardList({ cards, onRemove, onUpdate }: ParsedCardListProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        未解析出任何单词，请检查输入格式
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">
          预览（可编辑）
        </h4>
        <span className="text-xs text-slate-400">{cards.length} 张</span>
      </div>
      <div className="max-h-72 overflow-y-auto space-y-2 rounded-xl border border-slate-100 p-2">
        {cards.map((card, i) => (
          <div
            key={i}
            className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={card.word}
                onChange={(e) => onUpdate(i, 'word', e.target.value)}
                placeholder="单词"
                className="text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all"
              />
              <input
                value={card.definition ?? ''}
                onChange={(e) => onUpdate(i, 'definition', e.target.value)}
                placeholder="释义"
                className="text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all"
              />
              {card.phonetic ? (
                <input
                  value={card.phonetic}
                  onChange={(e) => onUpdate(i, 'phonetic', e.target.value)}
                  placeholder="音标"
                  className="text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all sm:col-span-2"
                />
              ) : null}
            </div>
            <button
              onClick={() => onRemove(i)}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- OCR using Tesseract.js loaded dynamically ---

async function runOCR(file: File): Promise<string> {
  // Load Tesseract.js from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
  document.head.appendChild(script);

  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OCR engine'));
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tesseract = (window as any).Tesseract;

  const imageUrl = URL.createObjectURL(file);
  const result = await Tesseract.recognize(imageUrl, 'eng', {
    logger: () => {},
  });

  URL.revokeObjectURL(imageUrl);
  document.head.removeChild(script);

  return result.data.text;
}
