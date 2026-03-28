'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { Template, Item, PRESET_TEMPLATES, Settings } from '@/types';
import {
  LayoutDashboard,
  Library,
  Layers,
  Settings as SettingsIcon,
  Plus,
  Search,
  LogOut,
  X,
  ChevronRight,
  ExternalLink,
  Trash2,
  Download,
  Upload,
  Sun,
  Moon,
  Smartphone,
  Check,
  Bell,
  Box,
  MapPin,
  Hash,
  Tag,
  ArrowRight,
  AlertCircle,
  Sparkles,
  PlusCircle,
  MinusCircle,
  Clock,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  GripVertical,
} from 'lucide-react';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return '夜更かしですか？';
  if (h < 11) return 'おはようございます';
  if (h < 17) return 'こんにちは';
  return 'こんばんは';
}

function getDaysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function exportToCSV(templates: Template[], items: Item[]) {
  const header = ['id', 'templateId', 'templateName', 'name', 'quantity', 'subLocation', 'attributes', 'createdAt', 'updatedAt'];
  const rows = items.map((item) => {
    const tpl = templates.find((t) => t.id === item.templateId);
    return [item.id, item.templateId, tpl?.name ?? '', item.name, item.quantity, item.subLocation, JSON.stringify(item.attributes), new Date(item.createdAt).toISOString(), new Date(item.updatedAt).toISOString()];
  });
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tresor_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// LOGIN PAGE
// ============================================================

function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError('Googleログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setError('');
    setLoading(true);
    try {
      if (tab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (msg.includes('email-already-in-use')) {
        setError('このメールアドレスはすでに使用されています');
      } else if (msg.includes('weak-password')) {
        setError('パスワードは6文字以上で入力してください');
      } else {
        setError('エラーが発生しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">t</span>
          </div>
          <h1 className="text-4xl font-bold text-amber-600 dark:text-amber-400 tracking-tight italic">trésor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">管理を、もっとシンプルに。</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
          <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Googleでログイン
          </button>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            <span className="text-slate-400 text-xs font-medium">または</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-2xl p-1 mb-4">
            <button onClick={() => setTab('signin')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'signin' ? 'bg-white dark:bg-slate-600 text-amber-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>ログイン</button>
            <button onClick={() => setTab('signup')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'signup' ? 'bg-white dark:bg-slate-600 text-amber-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>新規登録</button>
          </div>
          <div className="space-y-3">
            <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmail()} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" />
            <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmail()} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" />
            {error && <p className="text-red-500 text-xs font-medium px-1">{error}</p>}
            <button onClick={handleEmail} disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-50">
              {loading ? '処理中...' : tab === 'signin' ? 'ログイン' : 'アカウント作成'}
            </button>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-6">© 2024 trésor — あなただけの宝箱</p>
      </div>
    </div>
  );
}

// ============================================================
// TUTORIAL MODAL
// ============================================================

function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'trésor（トレゾール）へようこそ', desc: '身の回りのあらゆるモノを「あなた専用の型」で管理できる魔法の宝箱です。', icon: <Sparkles size={48} className="text-amber-500" /> },
    { title: '1. テンプレート（型）を作る', desc: '「テンプレート」タブから、管理したいモノの型を作ります。項目を自由に決められます。', icon: <Layers size={48} className="text-amber-500" /> },
    { title: '2. モノを登録する', desc: '「ライブラリ」から、モノを登録します。型を選ぶだけで、最適な入力欄が現れます。', icon: <PlusCircle size={48} className="text-amber-500" /> },
    { title: '3. タグで賢く整理', desc: '「#仕事」などのタグを付けると、一覧からワンタップで絞り込めます。', icon: <Hash size={48} className="text-amber-500" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center py-4">{steps[step].icon}</div>
        <div className="space-y-2 text-center mt-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">{steps[step].title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{steps[step].desc}</p>
        </div>
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-amber-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
          ))}
        </div>
        <div className="flex gap-4 pt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300">
              戻る
            </button>
          )}
          <button
            onClick={() => { if (step < steps.length - 1) setStep(step + 1); else onClose(); }}
            className="flex-1 py-3.5 bg-amber-600 rounded-2xl font-bold text-white shadow-sm"
          >
            {step < steps.length - 1 ? '次へ' : 'はじめる！'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ITEM EDITOR MODAL
// ============================================================

interface ItemEditorModalProps {
  item: Item | null;
  templates: Template[];
  defaultTemplateId?: string;
  onSave: (item: Item) => void;
  onClose: () => void;
  isDark: boolean;
}

function ItemEditorModal({ item, templates, defaultTemplateId, onSave, onClose, isDark }: ItemEditorModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [templateId, setTemplateId] = useState(item?.templateId ?? defaultTemplateId ?? templates[0]?.id ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [subLocation, setSubLocation] = useState(item?.subLocation ?? '');
  const [attributes, setAttributes] = useState<Record<string, string>>(item?.attributes ?? {});
  const [note, setNote] = useState(item?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const template = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (!item && template && !subLocation) {
      setSubLocation(template.subLocations[0] ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const handleSave = async () => {
    if (!name.trim()) { setError('アイテム名を入力してください'); return; }
    setSaving(true);
    setError('');
    try {
      const now = Date.now();
      await onSave({ id: item?.id ?? generateId(), templateId, name: name.trim(), quantity, subLocation, attributes, note: note.trim() || undefined, createdAt: item?.createdAt ?? now, updatedAt: now, sortOrder: item?.sortOrder });
    } catch (e) {
      setError('保存に失敗しました。もう一度お試しください。');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      <div className={`relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-inherit rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{item ? 'アイテム編集' : 'モノを登録'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">テンプレート</label>
            <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); const tpl = templates.find((t) => t.id === e.target.value); setSubLocation(tpl?.subLocations[0] ?? ''); setAttributes({}); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium">
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">アイテム名 *</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="アイテム名を入力" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">数量</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">−</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 text-center px-2 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 font-bold text-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">+</button>
            </div>
          </div>
          {template && template.subLocations.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">保管場所</label>
              <div className="flex flex-wrap gap-2">
                {template.subLocations.map((loc) => (
                  <button key={loc} onClick={() => setSubLocation(loc)} className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${subLocation === loc ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{loc}</button>
                ))}
              </div>
            </div>
          )}
          {template && template.attributes.length > 0 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">属性</label>
              {template.attributes.map((attr) => (
                <div key={attr.name}>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">{attr.name}</label>
                  {(attr.type === 'text' || attr.type === 'number' || attr.type === 'tag') ? (
                    <input type={attr.type === 'number' ? 'number' : 'text'} value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} placeholder={attr.name} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" />
                  ) : attr.type === 'date' ? (
                    <input type="date" value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" />
                  ) : attr.type === 'url' ? (
                    <input type="url" value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium" />
                  ) : attr.type === 'checkbox' ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setAttributes({ ...attributes, [attr.name]: attributes[attr.name] === 'true' ? 'false' : 'true' })} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${attributes[attr.name] === 'true' ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {attributes[attr.name] === 'true' && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{attr.name}</span>
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {/* Note field — always visible, multiline */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">ノート</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="自由にメモを記入できます（改行可）"
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm resize-none leading-relaxed"
            />
          </div>
        </div>
        {error && <p className="px-6 pb-2 text-red-500 text-sm font-bold">{error}</p>}
        <div className="sticky bottom-0 flex gap-3 px-6 pb-6 pt-4 bg-inherit border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">キャンセル</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-60">{saving ? '保存中...' : item ? '保存する' : '追加する'}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATE EDITOR MODAL
// ============================================================

interface TemplateEditorModalProps {
  template: Template | null;
  onSave: (t: Template) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isDark: boolean;
}

function TemplateEditorModal({ template, onSave, onDelete, onClose, isDark }: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [subLocations, setSubLocations] = useState<string[]>(template?.subLocations ?? []);
  const [attributes, setAttributes] = useState<Template['attributes']>(template?.attributes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addSubLocation = () => setSubLocations([...subLocations, '']);
  const updateSubLocation = (i: number, val: string) => { const u = [...subLocations]; u[i] = val; setSubLocations(u); };
  const removeSubLocation = (i: number) => setSubLocations(subLocations.filter((_, idx) => idx !== i));
  const addAttribute = () => setAttributes([...attributes, { name: '', type: 'text' }]);
  const updateAttribute = (i: number, field: 'name' | 'type', val: string) => { const u = [...attributes]; u[i] = field === 'type' ? { ...u[i], type: val as Template['attributes'][0]['type'] } : { ...u[i], name: val }; setAttributes(u); };
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { setError('テンプレート名称を入力してください'); return; }
    setSaving(true);
    setError('');
    try {
      const now = Date.now();
      await onSave({ id: template?.id ?? generateId(), name: name.trim(), subLocations: subLocations.filter((s) => s.trim()), attributes: attributes.filter((a) => a.name.trim()), createdAt: template?.createdAt ?? now, updatedAt: now, sortOrder: template?.sortOrder });
    } catch (e) {
      setError('保存に失敗しました。もう一度お試しください。');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (template && onDelete && window.confirm('このテンプレートを削除しますか？')) {
      onDelete(template.id);
    }
  };

  const attrTypeLabels: Record<string, string> = { text: '文字 (Text)', number: '数値 (Number)', date: '日付 (Date)', tag: 'タグ (Tag)', url: 'URL', checkbox: 'チェック (Checkbox)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      <div className={`relative z-10 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 bg-inherit rounded-t-[2.5rem]">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{template ? 'テンプレート編集' : 'テンプレート作成'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="px-8 py-6 space-y-6">
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="名称 (例: 冷蔵庫)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" autoFocus />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400">階層オプション</span>
              <button onClick={addSubLocation} className="text-amber-600 text-[10px] font-bold hover:text-amber-700">+ 追加</button>
            </div>
            <div className="space-y-3">
              {subLocations.map((loc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={loc} onChange={(e) => updateSubLocation(i, e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <button onClick={() => removeSubLocation(i)} className="p-2 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400">デフォルト属性</span>
              <button onClick={addAttribute} className="text-amber-600 text-[10px] font-bold hover:text-amber-700">+ 追加</button>
            </div>
            <div className="space-y-3">
              {attributes.map((attr, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={attr.name} onChange={(e) => updateAttribute(i, 'name', e.target.value)} placeholder="項目名" className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <button onClick={() => removeAttribute(i)} className="p-2 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <select value={attr.type} onChange={(e) => updateAttribute(i, 'type', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm">
                    {Object.entries(attrTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="px-8 pb-2 text-red-500 text-sm font-bold">{error}</p>}
        <div className="px-8 pb-8 space-y-4">
          <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-3xl shadow-sm transition-colors disabled:opacity-60">
            {saving ? '保存中...' : '保存する'}
          </button>
          {template && onDelete && (
            <button onClick={handleDelete} className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
              このテンプレートを削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRESET SELECTION MODAL
// ============================================================

interface PresetSelectionModalProps {
  onSelect: (preset: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  isDark: boolean;
}

function PresetSelectionModal({ onSelect, onClose, isDark }: PresetSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      <div className={`relative z-10 w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-inherit rounded-t-[2.5rem]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">プリセット</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelect(preset)}
              className={`w-full text-left p-5 rounded-3xl font-bold text-slate-800 dark:text-white text-base hover:opacity-80 transition-opacity ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================

interface DashboardTabProps {
  templates: Template[];
  items: Item[];
  onAddItem: () => void;
  onShowTutorial: () => void;
  onGoToLibrary: () => void;
  onEditItem: (item: Item) => void;
}

function DashboardTab({ templates, items, onAddItem, onShowTutorial, onGoToLibrary, onEditItem }: DashboardTabProps) {
  const greeting = getGreeting();

  const alertItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(today.getDate() + 7);
    return items.filter((item) => {
      if (!item.attributes) return false;
      return Object.values(item.attributes).some((val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d >= today && d <= soon;
      });
    }).slice(0, 3);
  }, [items]);

  const recentItems = useMemo(() => items.slice(0, 4), [items]);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}</h2>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">現在の管理状況をお知らせします。</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 h-32 flex flex-col justify-between overflow-hidden shadow-sm">
          <Box size={24} className="text-amber-400" />
          <div>
            <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{items.length}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">アイテム総数</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 h-32 flex flex-col justify-between overflow-hidden shadow-sm">
          <Layers size={24} className="text-slate-400" />
          <div>
            <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{templates.length}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">テンプレート</p>
          </div>
        </div>
      </div>

      {/* Welcome card (when no templates) */}
      {templates.length === 0 && (
        <div className="bg-amber-500 p-6 rounded-[2.5rem] shadow-sm overflow-hidden relative">
          <div className="absolute -right-2 -top-2 opacity-20 pointer-events-none">
            <Sparkles size={80} className="text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-white" />
            <p className="text-lg font-bold text-white">使い方はかんたんです！</p>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <p className="text-sm font-bold text-white">「テンプレート」で型を作る</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <p className="text-sm font-bold text-white">「ライブラリ」から登録する</p>
            </div>
          </div>
          <button onClick={onShowTutorial} className="w-full bg-white py-3 rounded-2xl font-bold text-amber-600 text-sm shadow-sm hover:bg-amber-50 transition-colors">
            はじめてガイドを見る
          </button>
        </div>
      )}

      {/* Alert items */}
      {alertItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" />
            <p className="font-bold text-xs text-amber-600">期限間近のアラート</p>
          </div>
          <div className="space-y-2">
            {alertItems.map((item) => (
              <button key={item.id} onClick={() => onEditItem(item)} className="w-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400 truncate">{item.name}</p>
                </div>
                <ChevronRight size={16} className="text-amber-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[10px] text-slate-400">最近のアクティビティ</p>
          <button onClick={onGoToLibrary} className="flex items-center gap-1">
            <span className="text-amber-600 text-[10px] font-bold">すべて見る</span>
            <ArrowRight size={12} className="text-amber-600" />
          </button>
        </div>
        {recentItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map((item) => (
              <button key={item.id} onClick={() => onEditItem(item)} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
                  <Box size={20} className="text-slate-300" />
                </div>
                <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">{item.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 truncate">{templates.find((t) => t.id === item.templateId)?.name || '未分類'}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 font-bold text-sm">アイテムがまだありません</p>
            <button onClick={onAddItem} className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-colors">
              最初のアイテムを追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LIBRARY TAB
// ============================================================

interface LibraryTabProps {
  templates: Template[];
  items: Item[];
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onReorderItems: (reordered: Item[]) => void;
}

function LibraryTab({ templates, items, onEditItem, onDeleteItem, onQuantityChange, onReorderItems }: LibraryTabProps) {
  const [search, setSearch] = useState('');
  const [filterTemplateId, setFilterTemplateId] = useState<string | null>(null);
  const [activeAttributeFilter, setActiveAttributeFilter] = useState<{ key: string; value: string } | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // Long-press drag sort state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout>>();
  const dragStartY = useRef(0);
  const dragFromIdx = useRef(0);
  const dragItemH = useRef(88);
  const origCenters = useRef<number[]>([]);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  // Swipe state
  const swipeRef = useRef<{ itemId: string; startX: number; startY: number; active: boolean } | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchTemplate = !filterTemplateId || item.templateId === filterTemplateId;
      let matchAttr = true;
      if (activeAttributeFilter) {
        matchAttr = item.attributes?.[activeAttributeFilter.key] === activeAttributeFilter.value;
      }
      return matchSearch && matchTemplate && matchAttr;
    });
  }, [items, search, filterTemplateId, activeAttributeFilter]);

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const fromId = filtered[fromIdx]?.id;
    const toId = filtered[toIdx]?.id;
    if (!fromId || !toId) return;
    const fromFull = items.findIndex((i) => i.id === fromId);
    const toFull = items.findIndex((i) => i.id === toId);
    const newItems = [...items];
    const [moved] = newItems.splice(fromFull, 1);
    newItems.splice(toFull, 0, moved);
    onReorderItems(newItems);
  };

  const initDrag = (e: React.PointerEvent, item: Item, idx: number) => {
    if (!sortMode) return;
    const y = e.clientY;
    const pid = e.pointerId;
    dragStartY.current = y;
    didDrag.current = false;
    lpTimer.current = setTimeout(() => {
      const el = rowRefs.current.get(item.id);
      dragItemH.current = (el?.getBoundingClientRect().height ?? 80) + 12;
      origCenters.current = filtered.map((i) => {
        const r = rowRefs.current.get(i.id);
        return r ? r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2 : 0;
      });
      dragFromIdx.current = idx;
      didDrag.current = true;
      try { listRef.current?.setPointerCapture(pid); } catch { /* */ }
      setActiveDragId(item.id);
      setDropIndex(idx);
      if (typeof navigator.vibrate === 'function') navigator.vibrate(30);
    }, 400);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!sortMode) return;
    if (!activeDragId) {
      if (lpTimer.current && Math.abs(e.clientY - dragStartY.current) > 10) {
        clearTimeout(lpTimer.current);
        lpTimer.current = undefined;
      }
      return;
    }
    e.preventDefault();
    const delta = e.clientY - dragStartY.current;
    setDragDeltaY(delta);
    const currentCY = (origCenters.current[dragFromIdx.current] ?? 0) + delta;
    let bestIdx = dragFromIdx.current;
    let bestDist = Infinity;
    origCenters.current.forEach((cy, i) => {
      const d = Math.abs(currentCY - cy);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    if (bestIdx !== dropIndex) setDropIndex(bestIdx);
  };

  const endDrag = () => {
    clearTimeout(lpTimer.current);
    lpTimer.current = undefined;
    if (activeDragId) {
      if (dropIndex !== null && dropIndex !== dragFromIdx.current) {
        handleReorder(dragFromIdx.current, dropIndex);
      }
      // Suppress click after drag
      setTimeout(() => { didDrag.current = false; }, 300);
    } else {
      didDrag.current = false;
    }
    setActiveDragId(null);
    setDragDeltaY(0);
    setDropIndex(null);
  };

  const getRowStyle = (id: string, index: number): React.CSSProperties => {
    if (id === activeDragId) {
      return { transform: `translateY(${dragDeltaY}px) scale(1.03)`, zIndex: 50, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
    }
    if (activeDragId !== null && dropIndex !== null) {
      const h = dragItemH.current;
      const from = dragFromIdx.current;
      if (from < dropIndex && index > from && index <= dropIndex) return { transform: `translateY(-${h}px)`, transition: 'transform 0.15s ease' };
      if (from > dropIndex && index >= dropIndex && index < from) return { transform: `translateY(${h}px)`, transition: 'transform 0.15s ease' };
    }
    return { transition: 'transform 0.15s ease' };
  };

  // Swipe handlers (only when not in sort mode)
  const onSwipeStart = (e: React.PointerEvent, itemId: string) => {
    if (sortMode) return;
    swipeRef.current = { itemId, startX: e.clientX, startY: e.clientY, active: false };
  };

  const onSwipeMove = (e: React.PointerEvent) => {
    if (sortMode || !swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.startX;
    const dy = e.clientY - swipeRef.current.startY;
    if (!swipeRef.current.active) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        swipeRef.current.active = true;
        e.preventDefault();
      } else if (Math.abs(dy) > 12) {
        swipeRef.current = null;
        return;
      }
    }
    if (swipeRef.current?.active && dx < 0) {
      e.preventDefault();
    }
  };

  const onSwipeEnd = (e: React.PointerEvent, itemId: string) => {
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.startX;
    if (swipeRef.current.active && dx < -50) {
      setSwipedId(itemId);
    } else if (swipeRef.current.active && dx > 20) {
      setSwipedId(null);
    }
    swipeRef.current = null;
  };

  return (
    <div className="space-y-4" onClick={() => swipedId && setSwipedId(null)}>
      {/* Search */}
      <div className="relative flex items-center">
        <Search size={18} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名称で検索..."
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Template filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFilterTemplateId(null)} className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-colors ${!filterTemplateId ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
          すべて
        </button>
        {templates.map((t) => (
          <button key={t.id} onClick={() => setFilterTemplateId(filterTemplateId === t.id ? null : t.id)} className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-colors ${filterTemplateId === t.id ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {t.name}
          </button>
        ))}
      </div>

      {/* Attribute filter pill */}
      {activeAttributeFilter && (
        <div className="flex items-center bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 px-3 py-2 rounded-xl">
          <Filter size={14} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs font-bold text-amber-800 dark:text-amber-400 ml-2 flex-1 truncate">絞り込み中: {activeAttributeFilter.value}</p>
          <button onClick={() => setActiveAttributeFilter(null)} className="ml-2"><X size={14} className="text-amber-600" /></button>
        </div>
      )}

      {/* Sort / Delete mode toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setSortMode(!sortMode); setDeleteMode(false); setSwipedId(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${sortMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
        >
          <GripVertical size={13} />
          並べ替え
        </button>
        <button
          onClick={() => { setDeleteMode(!deleteMode); setSortMode(false); setSwipedId(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${deleteMode ? 'bg-red-500 border-red-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
        >
          <Trash2 size={13} />
          削除
        </button>
      </div>

      {/* Items */}
      <div
        ref={listRef}
        className="space-y-3"
        style={{ touchAction: activeDragId ? 'none' : 'auto', userSelect: 'none' }}
        onPointerMove={sortMode ? onDragMove : undefined}
        onPointerUp={sortMode ? endDrag : undefined}
        onPointerCancel={sortMode ? endDrag : undefined}
      >
        {filtered.map((item, index) => {
          const template = templates.find((t) => t.id === item.templateId);
          const isDragging = activeDragId === item.id;
          const isSwiped = swipedId === item.id;
          return (
            <div
              key={item.id}
              ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
              style={getRowStyle(item.id, index)}
              className="relative overflow-hidden rounded-[2rem]"
              onPointerDown={(e) => { if (sortMode) initDrag(e, item, index); else onSwipeStart(e, item.id); }}
              onPointerMove={!sortMode ? onSwipeMove : undefined}
              onPointerUp={!sortMode ? (e) => onSwipeEnd(e, item.id) : undefined}
              onPointerCancel={!sortMode ? () => { swipeRef.current = null; } : undefined}
            >
              {/* Swipe delete button (revealed behind card) */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center rounded-r-[2rem]">
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('アイテムを削除しますか？')) { onDeleteItem(item.id); setSwipedId(null); } }}
                  className="flex flex-col items-center gap-1"
                >
                  <Trash2 size={20} className="text-white" />
                  <span className="text-white text-[10px] font-bold">削除</span>
                </button>
              </div>

              {/* Card (slides left on swipe) */}
              <div
                style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform 0.25s ease' }}
                className={`bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border cursor-pointer select-none transition-shadow
                  ${isDragging ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-2xl' : 'border-slate-100 dark:border-slate-700'}
                  ${deleteMode ? 'border-red-100 dark:border-red-900/30' : ''}
                `}
                onClick={(e) => {
                  if (sortMode || didDrag.current) { e.preventDefault(); return; }
                  if (isSwiped) { setSwipedId(null); return; }
                  onEditItem(item);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Box size={24} className="text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-[10px] text-slate-500 dark:text-slate-300 font-bold">{template?.name || '未分類'}</span>
                      {item.subLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-amber-600" />
                          <span className="text-[10px] text-amber-600 font-bold">{item.subLocation}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Quantity controls — hidden in delete mode */}
                  {!deleteMode && (
                    <div className="flex items-center bg-slate-50 dark:bg-slate-700 rounded-2xl p-1 self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, -1); }} className="p-1"><MinusCircle size={18} className="text-slate-400" /></button>
                      <span className="w-6 text-center font-bold text-sm text-slate-800 dark:text-white">{item.quantity || 0}</span>
                      <button onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, 1); }} className="p-1"><PlusCircle size={18} className="text-slate-400" /></button>
                    </div>
                  )}
                  {/* Delete mode button */}
                  {deleteMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('アイテムを削除しますか？')) onDeleteItem(item.id); }}
                      className="p-2 self-center flex-shrink-0 bg-red-50 dark:bg-red-900/30 rounded-xl"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  )}
                </div>
                {/* Attribute chips */}
                {item.attributes && Object.keys(item.attributes).some((k) => item.attributes[k]) && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-50 dark:border-slate-700 pt-3 mt-3">
                    {Object.entries(item.attributes).map(([key, val]) => {
                      if (!val && val !== 'false') return null;
                      const isCheckbox = val === 'true' || val === 'false';
                      const isTag = !isCheckbox && (val.toString().startsWith('#') || key.toLowerCase().includes('タグ'));
                      const isUrl = !isCheckbox && val.toString().startsWith('http');
                      if (isCheckbox) {
                        return (
                          <span key={key} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700">
                            {val === 'true' ? <CheckSquare size={10} className="text-amber-600" /> : <Square size={10} className="text-slate-400" />}
                            <span className={`text-[10px] font-bold ${val === 'true' ? 'text-amber-600' : 'text-slate-400'}`}>{key}</span>
                          </span>
                        );
                      }
                      return (
                        <button key={key} onClick={(e) => { e.stopPropagation(); isUrl ? window.open(val, '_blank') : setActiveAttributeFilter({ key, value: val }); }} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${isTag ? 'bg-amber-100 dark:bg-amber-900/30' : isUrl ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-50 dark:bg-slate-700'}`}>
                          {isTag ? <Hash size={9} className="text-amber-700" /> : isUrl ? <ExternalLink size={9} className="text-blue-600" /> : <Tag size={9} className="text-slate-500" />}
                          <span className={`text-[10px] font-bold ${isTag ? 'text-amber-700 dark:text-amber-400' : isUrl ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-300'}`}>{isUrl ? key : val}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Note */}
                {item.note && (
                  <div className="border-t border-slate-50 dark:border-slate-700 pt-3 mt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{item.note}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Library size={48} className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
            <p className="text-sm font-bold text-slate-300 mt-2">アイテムが見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATES TAB
// ============================================================

interface TemplatesTabProps {
  templates: Template[];
  onCreateTemplate: () => void;
  onEditTemplate: (t: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onShowPresets: () => void;
  onReorderTemplates: (reordered: Template[]) => void;
}

function TemplatesTab({ templates, onCreateTemplate, onEditTemplate, onDeleteTemplate, onShowPresets, onReorderTemplates }: TemplatesTabProps) {
  const [sortMode, setSortMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // Long-press drag sort state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout>>();
  const dragStartY = useRef(0);
  const dragFromIdx = useRef(0);
  const dragItemH = useRef(88);
  const origCenters = useRef<number[]>([]);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  // Swipe state
  const swipeRef = useRef<{ itemId: string; startX: number; startY: number; active: boolean } | null>(null);

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newTemplates = [...templates];
    const [moved] = newTemplates.splice(fromIdx, 1);
    newTemplates.splice(toIdx, 0, moved);
    onReorderTemplates(newTemplates);
  };

  const initDrag = (e: React.PointerEvent, t: Template, idx: number) => {
    if (!sortMode) return;
    const y = e.clientY;
    const pid = e.pointerId;
    dragStartY.current = y;
    didDrag.current = false;
    lpTimer.current = setTimeout(() => {
      const el = rowRefs.current.get(t.id);
      dragItemH.current = (el?.getBoundingClientRect().height ?? 80) + 12;
      origCenters.current = templates.map((tmpl) => {
        const r = rowRefs.current.get(tmpl.id);
        return r ? r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2 : 0;
      });
      dragFromIdx.current = idx;
      didDrag.current = true;
      try { listRef.current?.setPointerCapture(pid); } catch { /* */ }
      setActiveDragId(t.id);
      setDropIndex(idx);
      if (typeof navigator.vibrate === 'function') navigator.vibrate(30);
    }, 400);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!sortMode) return;
    if (!activeDragId) {
      if (lpTimer.current && Math.abs(e.clientY - dragStartY.current) > 10) {
        clearTimeout(lpTimer.current);
        lpTimer.current = undefined;
      }
      return;
    }
    e.preventDefault();
    const delta = e.clientY - dragStartY.current;
    setDragDeltaY(delta);
    const currentCY = (origCenters.current[dragFromIdx.current] ?? 0) + delta;
    let bestIdx = dragFromIdx.current;
    let bestDist = Infinity;
    origCenters.current.forEach((cy, i) => {
      const d = Math.abs(currentCY - cy);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    if (bestIdx !== dropIndex) setDropIndex(bestIdx);
  };

  const endDrag = () => {
    clearTimeout(lpTimer.current);
    lpTimer.current = undefined;
    if (activeDragId) {
      if (dropIndex !== null && dropIndex !== dragFromIdx.current) {
        handleReorder(dragFromIdx.current, dropIndex);
      }
      setTimeout(() => { didDrag.current = false; }, 300);
    } else {
      didDrag.current = false;
    }
    setActiveDragId(null);
    setDragDeltaY(0);
    setDropIndex(null);
  };

  const getRowStyle = (id: string, index: number): React.CSSProperties => {
    if (id === activeDragId) {
      return { transform: `translateY(${dragDeltaY}px) scale(1.03)`, zIndex: 50, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
    }
    if (activeDragId !== null && dropIndex !== null) {
      const h = dragItemH.current;
      const from = dragFromIdx.current;
      if (from < dropIndex && index > from && index <= dropIndex) return { transform: `translateY(-${h}px)`, transition: 'transform 0.15s ease' };
      if (from > dropIndex && index >= dropIndex && index < from) return { transform: `translateY(${h}px)`, transition: 'transform 0.15s ease' };
    }
    return { transition: 'transform 0.15s ease' };
  };

  const onSwipeStart = (e: React.PointerEvent, itemId: string) => {
    if (sortMode) return;
    swipeRef.current = { itemId, startX: e.clientX, startY: e.clientY, active: false };
  };

  const onSwipeMove = (e: React.PointerEvent) => {
    if (sortMode || !swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.startX;
    const dy = e.clientY - swipeRef.current.startY;
    if (!swipeRef.current.active) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        swipeRef.current.active = true;
        e.preventDefault();
      } else if (Math.abs(dy) > 12) {
        swipeRef.current = null;
        return;
      }
    }
    if (swipeRef.current?.active && dx < 0) e.preventDefault();
  };

  const onSwipeEnd = (e: React.PointerEvent, itemId: string) => {
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.startX;
    if (swipeRef.current.active && dx < -50) setSwipedId(itemId);
    else if (swipeRef.current.active && dx > 20) setSwipedId(null);
    swipeRef.current = null;
  };

  return (
    <div className="space-y-6" onClick={() => swipedId && setSwipedId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">テンプレート管理</h2>
        <div className="flex gap-2">
          <button onClick={onShowPresets} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-amber-200 px-3 py-2 rounded-xl text-amber-600 text-xs font-bold hover:bg-amber-50 transition-colors">
            <Sparkles size={14} />
            プリセット
          </button>
          <button onClick={onCreateTemplate} className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-colors">
            <Plus size={14} />
            作成
          </button>
        </div>
      </div>

      {/* Sort / Delete mode toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setSortMode(!sortMode); setDeleteMode(false); setSwipedId(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${sortMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
        >
          <GripVertical size={13} />
          並べ替え
        </button>
        <button
          onClick={() => { setDeleteMode(!deleteMode); setSortMode(false); setSwipedId(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${deleteMode ? 'bg-red-500 border-red-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
        >
          <Trash2 size={13} />
          削除
        </button>
      </div>

      {/* Templates list */}
      <div
        ref={listRef}
        className="space-y-3"
        style={{ touchAction: activeDragId ? 'none' : 'auto', userSelect: 'none' }}
        onPointerMove={sortMode ? onDragMove : undefined}
        onPointerUp={sortMode ? endDrag : undefined}
        onPointerCancel={sortMode ? endDrag : undefined}
      >
        {templates.map((template, index) => {
          const isDragging = activeDragId === template.id;
          const isSwiped = swipedId === template.id;
          return (
            <div
              key={template.id}
              ref={(el) => { if (el) rowRefs.current.set(template.id, el); else rowRefs.current.delete(template.id); }}
              style={getRowStyle(template.id, index)}
              className="relative overflow-hidden rounded-3xl"
              onPointerDown={(e) => { if (sortMode) initDrag(e, template, index); else onSwipeStart(e, template.id); }}
              onPointerMove={!sortMode ? onSwipeMove : undefined}
              onPointerUp={!sortMode ? (e) => onSwipeEnd(e, template.id) : undefined}
              onPointerCancel={!sortMode ? () => { swipeRef.current = null; } : undefined}
            >
              {/* Swipe delete button */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center rounded-r-3xl">
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('このテンプレートを削除しますか？関連するアイテムもすべて削除されます。')) { onDeleteTemplate(template.id); setSwipedId(null); } }}
                  className="flex flex-col items-center gap-1"
                >
                  <Trash2 size={20} className="text-white" />
                  <span className="text-white text-[10px] font-bold">削除</span>
                </button>
              </div>

              {/* Card (slides left on swipe) */}
              <button
                style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform 0.25s ease' }}
                className={`w-full bg-white dark:bg-slate-800 p-4 rounded-3xl border select-none flex items-center justify-between transition-shadow
                  ${isDragging ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-2xl' : 'border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'}
                  ${deleteMode ? 'border-red-100 dark:border-red-900/30' : ''}
                `}
                onClick={() => {
                  if (sortMode || didDrag.current) return;
                  if (isSwiped) { setSwipedId(null); return; }
                  onEditTemplate(template);
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2.5 bg-amber-50 dark:bg-slate-700 rounded-2xl flex-shrink-0">
                    <Layers size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-slate-800 dark:text-white text-base truncate">{template.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{template.subLocations?.length || 0} 階層 / {template.attributes?.length || 0} 属性</p>
                  </div>
                </div>
                {deleteMode ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('このテンプレートを削除しますか？関連するアイテムもすべて削除されます。')) onDeleteTemplate(template.id); }}
                    className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl flex-shrink-0"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                ) : (
                  <ChevronRight size={18} className="text-slate-200 flex-shrink-0" />
                )}
              </button>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="text-center py-12">
            <Layers size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" strokeWidth={1} />
            <p className="font-bold text-slate-400">テンプレートがありません</p>
            <p className="text-slate-400 text-sm mt-1">プリセットか新規作成から始めましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================

interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (s: Partial<Settings>) => void;
  templates: Template[];
  items: Item[];
  onDeleteAllData: () => void;
  isDark: boolean;
  userEmail?: string | null;
  userName?: string | null;
}

function SettingsTab({ settings, onUpdateSettings, templates, items, onDeleteAllData, isDark, userEmail, userName }: SettingsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`CSVファイル「${file.name}」を読み込みました。\nインポート機能は近日公開予定です。`);
  };

  const handleResetData = () => {
    if (window.confirm('🚨 全データリセット\n\n登録したアイテムとテンプレートがすべて削除されます。元に戻せません。本当に実行しますか？')) {
      onDeleteAllData();
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">設定</h2>

      {/* Account */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 ml-2">アカウント</p>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">{userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              {userName && <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{userName}</p>}
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full flex items-center p-4 gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <LogOut size={20} className="text-slate-400" />
            <span className="font-bold">ログアウト</span>
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 ml-2">テーマ設定</p>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
          <button onClick={() => onUpdateSettings({ theme: 'light' })} className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3"><Sun size={20} className="text-slate-500" /><span className="font-bold text-slate-700 dark:text-slate-200">ライトモード</span></div>
            {settings.theme === 'light' && <div className="w-3 h-3 rounded-full bg-amber-500" />}
          </button>
          <button onClick={() => onUpdateSettings({ theme: 'dark' })} className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3"><Moon size={20} className="text-slate-500" /><span className="font-bold text-slate-700 dark:text-slate-200">ダークモード</span></div>
            {settings.theme === 'dark' && <div className="w-3 h-3 rounded-full bg-amber-500" />}
          </button>
          <button onClick={() => onUpdateSettings({ theme: 'system' })} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3"><Smartphone size={20} className="text-slate-500" /><span className="font-bold text-slate-700 dark:text-slate-200">端末の設定に従う</span></div>
            {settings.theme === 'system' && <div className="w-3 h-3 rounded-full bg-amber-500" />}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 ml-2">通知設定</p>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-amber-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">期限の何日前に通知するか</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 7].map((days) => (
                <button key={days} onClick={() => onUpdateSettings({ notificationDaysBefore: days })} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${settings.notificationDaysBefore === days ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                  {days}日前
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">通知時刻</p>
            <div className="flex flex-wrap gap-2">
              {[7, 9, 12, 18, 20].map((hour) => (
                <button key={hour} onClick={() => onUpdateSettings({ notificationHour: hour })} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${settings.notificationHour === hour ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                  {hour}時
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 ml-2">データ管理 (バックアップ)</p>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
          <button onClick={() => exportToCSV(templates, items)} className="w-full flex items-center p-4 gap-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={20} className="text-amber-600" />
            <span className="font-bold text-slate-700 dark:text-slate-200">CSVバックアップを出力</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Upload size={20} className="text-blue-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">CSVファイルから復元</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
        </div>
      </div>

      {/* Reset */}
      <div>
        <button onClick={handleResetData} className="w-full bg-red-50 dark:bg-red-900/30 rounded-3xl flex items-center p-4 gap-3 border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
          <Trash2 size={20} className="text-red-500" />
          <span className="font-bold text-red-500">全データをリセット</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

type Tab = 'dashboard' | 'library' | 'templates' | 'settings';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { templates, items, loading: dataLoading, settings: firestoreSettings, saveTemplate, deleteTemplate, saveItem, deleteItem, updateQuantity, reorderItems, reorderTemplates, deleteAllData, saveSettings } = useData(user?.uid ?? null);

  const DEFAULT_SETTINGS: Settings = { theme: 'system', notificationDaysBefore: 7, notificationHour: 9 };
  const [localSettings, setLocalSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem('tresor-settings');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return DEFAULT_SETTINGS;
  });

  // Merge Firestore settings when they arrive (Firestore takes precedence)
  const settings: Settings = firestoreSettings ?? localSettings;

  const [tab, setTab] = useState<Tab>('dashboard');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | undefined>(undefined);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Show tutorial for new users (no templates, tutorial not done)
  useEffect(() => {
    if (!dataLoading && templates.length === 0) {
      const done = localStorage.getItem('tresor-tutorial-done');
      if (!done) setShowTutorial(true);
    }
  }, [dataLoading, templates.length]);

  // Apply theme
  useEffect(() => {
    const apply = (dark: boolean) => { setIsDark(dark); document.documentElement.classList.toggle('dark', dark); };
    if (settings.theme === 'dark') { apply(true); }
    else if (settings.theme === 'light') { apply(false); }
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const updateSettings = (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setLocalSettings(next);
    localStorage.setItem('tresor-settings', JSON.stringify(next));
    saveSettings(next).catch(console.error);
  };

  const handleSaveItem = async (item: Item) => { await saveItem(item); setShowItemEditor(false); setEditingItem(null); };
  const handleSaveTemplate = async (template: Template) => { await saveTemplate(template); setShowTemplateEditor(false); setEditingTemplate(null); };
  const handleSelectPreset = async (preset: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    await saveTemplate({ id: generateId(), ...preset, createdAt: now, updatedAt: now, sortOrder: templates.length });
    setShowPresets(false);
  };

  const openAddItem = (templateId?: string) => { setEditingItem(null); setDefaultTemplateId(templateId); setShowItemEditor(true); };
  const openEditItem = (item: Item) => { setEditingItem(item); setDefaultTemplateId(undefined); setShowItemEditor(true); };
  const openEditTemplate = (template: Template) => { setEditingTemplate(template); setShowTemplateEditor(true); };
  const openCreateTemplate = () => { setEditingTemplate(null); setShowTemplateEditor(true); };

  const closeTutorial = () => { setShowTutorial(false); localStorage.setItem('tresor-tutorial-done', 'true'); };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-amber-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold italic">t</span>
          </div>
          <p className="text-slate-500 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ホーム', icon: <LayoutDashboard size={22} /> },
    { id: 'library', label: 'ライブラリ', icon: <Library size={22} /> },
    { id: 'templates', label: 'テンプレート', icon: <Layers size={22} /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon size={22} /> },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Sidebar (desktop) */}
      <aside className={`hidden md:flex flex-col w-64 flex-shrink-0 border-r ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400 italic">trésor</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">あなただけの宝箱</p>
          </div>
          <button onClick={() => setShowTutorial(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors" title="使い方">
            <BookOpen size={18} className="text-slate-400" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-bold text-sm ${tab === item.id ? 'bg-amber-500 text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{user.displayName || user.email}</p>
            </div>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="ログアウト">
              <LogOut size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-sm z-10`}>
          <h1 className="text-xl font-bold text-amber-500 italic">trésor</h1>
          <button onClick={() => setShowTutorial(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <BookOpen size={20} className="text-slate-400" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-2xl mx-auto px-4 py-6 md:px-8">
            {tab === 'dashboard' && (
              <DashboardTab
                templates={templates}
                items={items}
                onAddItem={() => openAddItem()}
                onShowTutorial={() => setShowTutorial(true)}
                onGoToLibrary={() => setTab('library')}
                onEditItem={openEditItem}
              />
            )}
            {tab === 'library' && (
              <LibraryTab
                templates={templates}
                items={items}
                onEditItem={openEditItem}
                onDeleteItem={deleteItem}
                onQuantityChange={(id, delta) => updateQuantity(id, delta)}
                onReorderItems={reorderItems}
              />
            )}
            {tab === 'templates' && (
              <TemplatesTab
                templates={templates}
                onCreateTemplate={openCreateTemplate}
                onEditTemplate={openEditTemplate}
                onDeleteTemplate={deleteTemplate}
                onShowPresets={() => setShowPresets(true)}
                onReorderTemplates={reorderTemplates}
              />
            )}
            {tab === 'settings' && (
              <SettingsTab
                settings={settings}
                onUpdateSettings={updateSettings}
                templates={templates}
                items={items}
                onDeleteAllData={deleteAllData}
                isDark={isDark}
                userEmail={user.email}
                userName={user.displayName}
              />
            )}
          </div>
        </main>

        {/* FAB (library tab only) */}
        {tab === 'library' && (
          <button
            onClick={() => openAddItem()}
            className="fixed right-6 bottom-20 md:bottom-8 w-14 h-14 bg-amber-600 hover:bg-amber-700 rounded-full shadow-lg flex items-center justify-center z-20 transition-colors"
          >
            <Plus size={28} className="text-white" />
          </button>
        )}

        {/* Mobile bottom nav */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex items-center ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} shadow-lg z-10`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${tab === item.id ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {item.icon}
              <span className={`text-[10px] font-bold ${tab === item.id ? 'text-amber-500' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Modals */}
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
      {showItemEditor && (
        <ItemEditorModal
          item={editingItem}
          templates={templates}
          defaultTemplateId={defaultTemplateId}
          onSave={handleSaveItem}
          onClose={() => { setShowItemEditor(false); setEditingItem(null); }}
          isDark={isDark}
        />
      )}
      {showTemplateEditor && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onDelete={async (id) => { await deleteTemplate(id); setShowTemplateEditor(false); setEditingTemplate(null); }}
          onClose={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
          isDark={isDark}
        />
      )}
      {showPresets && (
        <PresetSelectionModal
          onSelect={handleSelectPreset}
          onClose={() => setShowPresets(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
