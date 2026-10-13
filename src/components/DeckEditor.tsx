import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Deck } from '@/types';
import { supabase } from '@/lib/supabase';

interface DeckEditorProps {
  deck: Deck | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DeckEditor({ deck, onClose, onSaved }: DeckEditorProps) {
  const [name, setName] = useState(deck?.name ?? '');
  const [description, setDescription] = useState(deck?.description ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(deck?.name ?? '');
    setDescription(deck?.description ?? '');
  }, [deck]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    if (deck) {
      await supabase
        .from('decks')
        .update({ name: name.trim(), description })
        .eq('id', deck.id);
    } else {
      await supabase.from('decks').insert({ name: name.trim(), description });
    }

    setSaving(false);
    onSaved();
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {deck ? '编辑卡组' : '新建卡组'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>卡组名称 *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：考研核心词汇"
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>描述</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述这个卡组的内容"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
