import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Link2, Volume2 } from 'lucide-react';
import type { WordCard, CustomField, WordCardInput } from '@/types';
import { supabase } from '@/lib/supabase';

interface CardEditorProps {
  card: WordCard | null;
  deckId: string;
  onClose: () => void;
  onSaved: () => void;
}

const emptyCard: Omit<WordCardInput, 'deck_id'> = {
  word: '',
  definition: '',
  phonetic: '',
  example: '',
  root: '',
  phrases: '',
  image_url: '',
  audio_url: '',
  custom_fields: [],
};

export function CardEditor({ card, deckId, onClose, onSaved }: CardEditorProps) {
  const [form, setForm] = useState(card ?? { ...emptyCard, deck_id: deckId });
  const [saving, setSaving] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(card?.image_url ?? '');
  const [audioUrlInput, setAudioUrlInput] = useState(card?.audio_url ?? '');

  useEffect(() => {
    if (card) {
      setForm(card);
      setImageUrlInput(card.image_url ?? '');
      setAudioUrlInput(card.audio_url ?? '');
    } else {
      setForm({ ...emptyCard, deck_id: deckId });
      setImageUrlInput('');
      setAudioUrlInput('');
    }
  }, [card, deckId]);

  const update = (field: keyof typeof form, value: string | CustomField[]) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const addCustomField = () => {
    update('custom_fields', [...form.custom_fields, { label: '', value: '' }]);
  };

  const updateCustomField = (index: number, key: keyof CustomField, value: string) => {
    const fields = [...form.custom_fields];
    fields[index] = { ...fields[index], [key]: value };
    update('custom_fields', fields);
  };

  const removeCustomField = (index: number) => {
    update('custom_fields', form.custom_fields.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${deckId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('card-images')
      .upload(fileName, file);

    if (error) {
      // Fallback: use object URL for local preview
      const url = URL.createObjectURL(file);
      update('image_url', url);
    } else {
      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(fileName);
      update('image_url', urlData.publicUrl);
      setImageUrlInput(urlData.publicUrl);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${deckId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('card-audio')
      .upload(fileName, file);

    if (error) {
      const url = URL.createObjectURL(file);
      update('audio_url', url);
    } else {
      const { data: urlData } = supabase.storage
        .from('card-audio')
        .getPublicUrl(fileName);
      update('audio_url', urlData.publicUrl);
      setAudioUrlInput(urlData.publicUrl);
    }
  };

  const handleSave = async () => {
    if (!form.word.trim()) return;
    setSaving(true);

    const payload = {
      deck_id: form.deck_id,
      word: form.word.trim(),
      definition: form.definition,
      phonetic: form.phonetic,
      example: form.example,
      root: form.root,
      phrases: form.phrases,
      image_url: form.image_url,
      audio_url: form.audio_url,
      custom_fields: form.custom_fields.filter((f) => f.label.trim()),
    };

    if (card) {
      await supabase.from('word_cards').update(payload).eq('id', card.id);
    } else {
      await supabase.from('word_cards').insert(payload);
    }

    setSaving(false);
    onSaved();
  };

  const playAudioPreview = () => {
    if (form.audio_url) {
      new Audio(form.audio_url).play().catch(() => {});
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-800">
            {card ? '编辑卡片' : '新建卡片'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Front side */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              正面
            </div>
            <div>
              <label className={labelClass}>单词 *</label>
              <input
                className={inputClass}
                value={form.word}
                onChange={(e) => update('word', e.target.value)}
                placeholder="输入单词"
              />
            </div>
            <div>
              <label className={labelClass}>音标</label>
              <input
                className={inputClass}
                value={form.phonetic}
                onChange={(e) => update('phonetic', e.target.value)}
                placeholder="如 əˈbændən"
              />
            </div>

            {/* Image section */}
            <div>
              <label className={labelClass}>图片</label>
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                  <button
                    onClick={() => {
                      update('image_url', '');
                      setImageUrlInput('');
                    }}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl py-6 text-sm text-slate-400 hover:text-teal-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    上传图片
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <button
                    onClick={() => setShowImageInput(!showImageInput)}
                    className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
                  >
                    <Link2 className="w-3 h-3" />
                    或粘贴图片链接
                  </button>
                  {showImageInput ? (
                    <input
                      className={inputClass}
                      value={imageUrlInput}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        update('image_url', e.target.value);
                      }}
                      placeholder="https://..."
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Audio section */}
            <div>
              <label className={labelClass}>音频</label>
              {form.audio_url ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                  <button
                    onClick={playAudioPreview}
                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Volume2 className="w-4 h-4" />
                    试听
                  </button>
                  <span className="text-xs text-slate-400 flex-1 truncate">
                    {form.audio_url}
                  </span>
                  <button
                    onClick={() => {
                      update('audio_url', '');
                      setAudioUrlInput('');
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl py-6 text-sm text-slate-400 hover:text-teal-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    上传音频
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                  <button
                    onClick={() => setShowAudioInput(!showAudioInput)}
                    className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
                  >
                    <Link2 className="w-3 h-3" />
                    或粘贴音频链接
                  </button>
                  {showAudioInput ? (
                    <input
                      className={inputClass}
                      value={audioUrlInput}
                      onChange={(e) => {
                        setAudioUrlInput(e.target.value);
                        update('audio_url', e.target.value);
                      }}
                      placeholder="https://..."
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Back side */}
          <div className="rounded-xl bg-teal-50/50 border border-teal-100 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              背面
            </div>
            <div>
              <label className={labelClass}>释义</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                value={form.definition}
                onChange={(e) => update('definition', e.target.value)}
                placeholder="输入单词释义"
              />
            </div>
            <div>
              <label className={labelClass}>词根</label>
              <input
                className={inputClass}
                value={form.root}
                onChange={(e) => update('root', e.target.value)}
                placeholder="如 ab- (远离) + bandon (控制)"
              />
            </div>
            <div>
              <label className={labelClass}>例句</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                value={form.example}
                onChange={(e) => update('example', e.target.value)}
                placeholder="输入例句"
              />
            </div>
            <div>
              <label className={labelClass}>短语</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                value={form.phrases}
                onChange={(e) => update('phrases', e.target.value)}
                placeholder="输入相关短语，每行一个"
              />
            </div>

            {/* Custom fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass} style={{ marginBottom: 0 }}>
                  自定义字段
                </label>
                <button
                  onClick={addCustomField}
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加字段
                </button>
              </div>
              {form.custom_fields.length > 0 ? (
                <div className="space-y-2">
                  {form.custom_fields.map((field, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        value={field.label}
                        onChange={(e) => updateCustomField(i, 'label', e.target.value)}
                        placeholder="字段名"
                      />
                      <input
                        className={`${inputClass} flex-1`}
                        value={field.value}
                        onChange={(e) => updateCustomField(i, 'value', e.target.value)}
                        placeholder="字段值"
                      />
                      <button
                        onClick={() => removeCustomField(i)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">点击"添加字段"来创建自定义内容区域</p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white/95 backdrop-blur">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!form.word.trim() || saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
