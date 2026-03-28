'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  BookOpen,
  Layers,
  Settings as SettingsIcon,
  Plus,
  Search,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Edit3,
  Package,
  Bell,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertTriangle,
  Tag,
} from 'lucide-react';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'おはようございます';
  if (h < 18) return 'こんにちは';
  return 'こんばんは';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
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

function exportToCSV(templates: Template[], items: Item[]) {
  const header = ['id', 'templateId', 'templateName', 'name', 'quantity', 'subLocation', 'attributes', 'createdAt', 'updatedAt'];
  const rows = items.map((item) => {
    const tpl = templates.find((t) => t.id === item.templateId);
    return [
      item.id,
      item.templateId,
      tpl?.name ?? '',
      item.name,
      item.quantity,
      item.subLocation,
      JSON.stringify(item.attributes),
      new Date(item.createdAt).toISOString(),
      new Date(item.updatedAt).toISOString(),
    ];
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
    } catch (e: unknown) {
      setError('Googleログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">t</span>
          </div>
          <h1 className="text-4xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">trésor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">管理を、もっとシンプルに。</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            <span className="text-slate-400 text-xs font-medium">または</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-2xl p-1 mb-4">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'signin' ? 'bg-white dark:bg-slate-600 text-amber-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'signup' ? 'bg-white dark:bg-slate-600 text-amber-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              新規登録
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            />
            {error && <p className="text-red-500 text-xs font-medium px-1">{error}</p>}
            <button
              onClick={handleEmail}
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
            >
              {loading ? '処理中...' : tab === 'signin' ? 'ログイン' : 'アカウント作成'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2024 trésor — あなただけの宝箱
        </p>
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

  const template = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (!item && template && !subLocation) {
      setSubLocation(template.subLocations[0] ?? '');
    }
  }, [templateId]);

  const handleSave = () => {
    if (!name.trim()) return;
    const now = Date.now();
    onSave({
      id: item?.id ?? generateId(),
      templateId,
      name: name.trim(),
      quantity,
      subLocation,
      attributes,
      createdAt: item?.createdAt ?? now,
      updatedAt: now,
      sortOrder: item?.sortOrder,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-inherit rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {item ? 'アイテムを編集' : 'アイテムを追加'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">アイテム名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="アイテム名を入力"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              autoFocus
            />
          </div>

          {/* Template */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">テンプレート</label>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                const tpl = templates.find((t) => t.id === e.target.value);
                setSubLocation(tpl?.subLocations[0] ?? '');
                setAttributes({});
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">数量</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 text-center px-2 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 font-bold text-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Sub Location */}
          {template && template.subLocations.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">保管場所</label>
              <div className="flex flex-wrap gap-2">
                {template.subLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSubLocation(loc)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${subLocation === loc ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          {template && template.attributes.length > 0 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">属性</label>
              {template.attributes.map((attr) => (
                <div key={attr.name}>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">{attr.name}</label>
                  {attr.type === 'text' || attr.type === 'number' ? (
                    <input
                      type={attr.type === 'number' ? 'number' : 'text'}
                      value={attributes[attr.name] ?? ''}
                      onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })}
                      placeholder={attr.name}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                    />
                  ) : attr.type === 'date' ? (
                    <input
                      type="date"
                      value={attributes[attr.name] ?? ''}
                      onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                    />
                  ) : attr.type === 'url' ? (
                    <input
                      type="url"
                      value={attributes[attr.name] ?? ''}
                      onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                    />
                  ) : attr.type === 'tag' ? (
                    <input
                      type="text"
                      value={attributes[attr.name] ?? ''}
                      onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })}
                      placeholder="タグを入力"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                    />
                  ) : attr.type === 'checkbox' ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setAttributes({ ...attributes, [attr.name]: attributes[attr.name] === 'true' ? 'false' : 'true' })}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${attributes[attr.name] === 'true' ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {attributes[attr.name] === 'true' && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{attr.name}</span>
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 px-6 pb-6 pt-4 bg-inherit border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
          >
            {item ? '保存する' : '追加する'}
          </button>
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
  onClose: () => void;
  isDark: boolean;
}

function TemplateEditorModal({ template, onSave, onClose, isDark }: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [subLocations, setSubLocations] = useState<string[]>(template?.subLocations ?? ['']);
  const [attributes, setAttributes] = useState<Template['attributes']>(template?.attributes ?? []);

  const addSubLocation = () => setSubLocations([...subLocations, '']);
  const updateSubLocation = (i: number, val: string) => {
    const updated = [...subLocations];
    updated[i] = val;
    setSubLocations(updated);
  };
  const removeSubLocation = (i: number) => setSubLocations(subLocations.filter((_, idx) => idx !== i));

  const addAttribute = () => setAttributes([...attributes, { name: '', type: 'text' }]);
  const updateAttribute = (i: number, field: 'name' | 'type', val: string) => {
    const updated = [...attributes];
    if (field === 'type') {
      updated[i] = { ...updated[i], type: val as Template['attributes'][0]['type'] };
    } else {
      updated[i] = { ...updated[i], name: val };
    }
    setAttributes(updated);
  };
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!name.trim()) return;
    const now = Date.now();
    onSave({
      id: template?.id ?? generateId(),
      name: name.trim(),
      subLocations: subLocations.filter((s) => s.trim()),
      attributes: attributes.filter((a) => a.name.trim()),
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
      sortOrder: template?.sortOrder,
    });
  };

  const attrTypeLabels: Record<string, string> = {
    text: 'テキスト',
    number: '数値',
    date: '日付',
    tag: 'タグ',
    url: 'URL',
    checkbox: 'チェック',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-inherit rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {template ? 'テンプレートを編集' : 'テンプレートを作成'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">テンプレート名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 冷蔵庫"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              autoFocus
            />
          </div>

          {/* Sub Locations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">保管場所</label>
              <button onClick={addSubLocation} className="text-xs text-amber-600 font-bold hover:text-amber-700">+ 追加</button>
            </div>
            <div className="space-y-2">
              {subLocations.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={loc}
                    onChange={(e) => updateSubLocation(i, e.target.value)}
                    placeholder={`場所 ${i + 1}`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm"
                  />
                  <button onClick={() => removeSubLocation(i)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">属性</label>
              <button onClick={addAttribute} className="text-xs text-amber-600 font-bold hover:text-amber-700">+ 追加</button>
            </div>
            <div className="space-y-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={attr.name}
                    onChange={(e) => updateAttribute(i, 'name', e.target.value)}
                    placeholder="属性名"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm"
                  />
                  <select
                    value={attr.type}
                    onChange={(e) => updateAttribute(i, 'type', e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm"
                  >
                    {Object.entries(attrTypeLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => removeAttribute(i)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 px-6 pb-6 pt-4 bg-inherit border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
          >
            {template ? '保存する' : '作成する'}
          </button>
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
  const icons: Record<string, string> = {
    '冷蔵庫': '🧊',
    '引き出し・棚': '📦',
    '商品在庫': '🏷️',
    '本棚': '📚',
    'デジタル資産': '💻',
    '買い物リスト': '🛒',
    'アイデアノート': '💡',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-inherit rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">プリセットから選択</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelect(preset)}
              className={`flex flex-col items-start p-4 rounded-2xl border-2 border-transparent hover:border-amber-400 transition-all text-left ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-50 hover:bg-amber-50'}`}
            >
              <span className="text-2xl mb-2">{icons[preset.name] ?? '📋'}</span>
              <span className="font-bold text-slate-800 dark:text-white text-sm">{preset.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{preset.attributes.length}つの属性</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ITEM CARD COMPONENT
// ============================================================

interface ItemCardProps {
  item: Item;
  template: Template | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onQuantityChange: (delta: number) => void;
  isDark: boolean;
}

function ItemCard({ item, template, onEdit, onDelete, onQuantityChange, isDark }: ItemCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  // Check for expiring attributes
  const expiringAttrs = template?.attributes
    .filter((a) => a.type === 'date')
    .map((a) => ({ name: a.name, value: item.attributes[a.name], days: getDaysUntil(item.attributes[a.name] ?? '') }))
    .filter((a) => a.days !== null && a.days <= 7) ?? [];

  return (
    <div className={`rounded-2xl shadow-sm border p-4 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} ${expiringAttrs.length > 0 ? 'border-l-4 border-l-amber-400' : ''}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-white truncate">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {template && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                {template.name}
              </span>
            )}
            {item.subLocation && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.subLocation}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Edit3 size={15} className="text-slate-400" />
          </button>
          {showDelete ? (
            <button onClick={onDelete} className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors">
              <Trash2 size={15} className="text-red-500" />
            </button>
          ) : (
            <button onClick={() => setShowDelete(true)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 size={15} className="text-slate-400 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => onQuantityChange(-1)}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          −
        </button>
        <span className="font-bold text-slate-800 dark:text-white min-w-[2rem] text-center">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(1)}
          className="w-8 h-8 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        >
          +
        </button>
      </div>

      {/* Attributes */}
      {template && template.attributes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {template.attributes.map((attr) => {
            const val = item.attributes[attr.name];
            if (!val) return null;

            if (attr.type === 'checkbox') {
              return (
                <span key={attr.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${val === 'true' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {val === 'true' ? <Check size={10} /> : null}
                  {attr.name}
                </span>
              );
            }

            if (attr.type === 'url') {
              return (
                <button
                  key={attr.name}
                  onClick={() => window.open(val, '_blank')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold hover:bg-blue-200 transition-colors"
                >
                  <ExternalLink size={10} />
                  {attr.name}
                </button>
              );
            }

            if (attr.type === 'tag') {
              return (
                <span key={attr.name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
                  <Tag size={10} />
                  {val}
                </span>
              );
            }

            if (attr.type === 'date') {
              const days = getDaysUntil(val);
              const isExpiring = days !== null && days <= 7;
              const isExpired = days !== null && days < 0;
              return (
                <span key={attr.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isExpired ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : isExpiring ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {isExpiring && <AlertTriangle size={10} />}
                  {attr.name}: {formatDate(val)}
                  {days !== null && days >= 0 && days <= 7 && ` (あと${days}日)`}
                  {isExpired && ' (期限切れ)'}
                </span>
              );
            }

            return (
              <span key={attr.name} className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold">
                {attr.name}: {val}
              </span>
            );
          })}
        </div>
      )}

      {/* Expiry warning */}
      {expiringAttrs.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Bell size={12} />
          <span className="text-xs font-bold">
            {expiringAttrs[0].days === 0 ? '今日期限' : expiringAttrs[0].days! < 0 ? `${Math.abs(expiringAttrs[0].days!)}日超過` : `あと${expiringAttrs[0].days}日`}
          </span>
        </div>
      )}
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
  isDark: boolean;
  notifyDaysBefore: number;
}

function DashboardTab({ templates, items, onAddItem, isDark, notifyDaysBefore }: DashboardTabProps) {
  const greeting = getGreeting();

  // Alert items (within notifyDaysBefore days)
  const alertItems = items.filter((item) => {
    const tpl = templates.find((t) => t.id === item.templateId);
    if (!tpl) return false;
    return tpl.attributes.some((attr) => {
      if (attr.type !== 'date') return false;
      const val = item.attributes[attr.name];
      const days = getDaysUntil(val ?? '');
      return days !== null && days <= notifyDaysBefore;
    });
  });

  // Recent items (last 6)
  const recentItems = [...items]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className={`rounded-3xl p-6 bg-gradient-to-br from-amber-400 to-amber-600`}>
        <p className="text-amber-100 font-medium text-sm">{greeting}</p>
        <h2 className="text-white text-2xl font-bold mt-1">trésor へようこそ</h2>
        <p className="text-amber-100 text-sm mt-2">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">アイテム総数</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{items.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">個のアイテム</p>
        </div>
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">テンプレート数</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{templates.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">種類</p>
        </div>
      </div>

      {/* Alert items */}
      {alertItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">期限アラート</h3>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">{alertItems.length}</span>
          </div>
          <div className="space-y-2">
            {alertItems.slice(0, 3).map((item) => {
              const tpl = templates.find((t) => t.id === item.templateId);
              const dateAttr = tpl?.attributes.find((a) => a.type === 'date');
              const val = dateAttr ? item.attributes[dateAttr.name] : null;
              const days = val ? getDaysUntil(val) : null;
              return (
                <div key={item.id} className={`flex items-center justify-between px-4 py-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm border-l-4 border-amber-400`}>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tpl?.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${days !== null && days < 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {days !== null && days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? '今日' : `あと${days}日`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick add */}
      <button
        onClick={onAddItem}
        className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors shadow-sm"
      >
        <Plus size={20} />
        アイテムを追加
      </button>

      {/* Recent items */}
      {recentItems.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">最近のアイテム</h3>
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map((item) => {
              const tpl = templates.find((t) => t.id === item.templateId);
              return (
                <div key={item.id} className={`rounded-2xl p-3 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">{tpl?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">数量: {item.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">アイテムがまだありません</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">「アイテムを追加」から始めましょう</p>
        </div>
      )}
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
  onAddItem: (templateId?: string) => void;
  isDark: boolean;
}

function LibraryTab({ templates, items, onEditItem, onDeleteItem, onQuantityChange, onAddItem, isDark }: LibraryTabProps) {
  const [search, setSearch] = useState('');
  const [filterTemplateId, setFilterTemplateId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subLocation.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(item.attributes).some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchTemplate = !filterTemplateId || item.templateId === filterTemplateId;
    return matchSearch && matchTemplate;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
        <Search size={18} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="アイテムを検索..."
          className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 font-medium focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Template filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterTemplateId(null)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${!filterTemplateId ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm'}`}
        >
          すべて
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTemplateId(filterTemplateId === t.id ? null : t.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filterTemplateId === t.id ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {filtered.length}件のアイテム
        </p>
        <button
          onClick={() => onAddItem(filterTemplateId ?? undefined)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full text-sm transition-colors"
        >
          <Plus size={14} />
          追加
        </button>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {search ? '検索結果がありません' : 'アイテムがありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const template = templates.find((t) => t.id === item.templateId);
            return (
              <ItemCard
                key={item.id}
                item={item}
                template={template}
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item.id)}
                onQuantityChange={(delta) => onQuantityChange(item.id, delta)}
                isDark={isDark}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TEMPLATES TAB
// ============================================================

interface TemplatesTabProps {
  templates: Template[];
  items: Item[];
  onCreateTemplate: () => void;
  onEditTemplate: (t: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onShowPresets: () => void;
  isDark: boolean;
}

function TemplatesTab({ templates, items, onCreateTemplate, onEditTemplate, onDeleteTemplate, onShowPresets, isDark }: TemplatesTabProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onShowPresets}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-amber-400 text-amber-600 dark:text-amber-400 font-bold text-sm transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/10`}
        >
          <Layers size={16} />
          プリセット
        </button>
        <button
          onClick={onCreateTemplate}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-colors"
        >
          <Plus size={16} />
          新規作成
        </button>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <Layers size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">テンプレートがありません</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">プリセットか新規作成から始めましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const itemCount = items.filter((i) => i.templateId === template.id).length;
            return (
              <div key={template.id} className={`rounded-2xl p-4 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{template.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{itemCount}個のアイテム</span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{template.subLocations.length}場所</span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{template.attributes.length}属性</span>
                    </div>
                    {template.subLocations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.subLocations.slice(0, 4).map((loc) => (
                          <span key={loc} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium">{loc}</span>
                        ))}
                        {template.subLocations.length > 4 && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium">+{template.subLocations.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => onEditTemplate(template)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                      <Edit3 size={15} className="text-slate-400" />
                    </button>
                    {deleteConfirm === template.id ? (
                      <button
                        onClick={() => { onDeleteTemplate(template.id); setDeleteConfirm(null); }}
                        className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl transition-colors"
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={15} className="text-slate-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                {deleteConfirm === template.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2">
                      削除すると関連する{itemCount}個のアイテムも削除されます。本当に削除しますか？
                    </p>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-500 font-bold hover:text-slate-700">キャンセル</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      alert(`CSVファイル「${file.name}」を読み込みました。\nインポート機能は近日公開予定です。`);
    };
    reader.readAsText(file, 'utf-8');
  };

  const themeOptions: { value: Settings['theme']; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'ライト', icon: <Sun size={16} /> },
    { value: 'dark', label: 'ダーク', icon: <Moon size={16} /> },
    { value: 'system', label: 'システム', icon: <Monitor size={16} /> },
  ];

  const dayOptions = [1, 3, 5, 7];
  const hourOptions = [7, 9, 12, 18, 20];

  return (
    <div className="space-y-6">
      {/* Account */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">アカウント</h3>
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              {userName && <p className="font-bold text-slate-800 dark:text-white">{userName}</p>}
              <p className="text-sm text-slate-500 dark:text-slate-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-colors"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">テーマ</h3>
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdateSettings({ theme: opt.value })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors font-bold text-sm ${settings.theme === opt.value ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">通知設定</h3>
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm space-y-4`}>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">期限の何日前に通知</label>
            <div className="flex gap-2">
              {dayOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => onUpdateSettings({ notificationDaysBefore: d })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${settings.notificationDaysBefore === d ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  {d}日
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">通知時刻</label>
            <div className="flex gap-2 flex-wrap">
              {hourOptions.map((h) => (
                <button
                  key={h}
                  onClick={() => onUpdateSettings({ notificationHour: h })}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${settings.notificationHour === h ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  {h}:00
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">データ管理</h3>
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm space-y-3`}>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{items.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">アイテム</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{templates.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">テンプレート</p>
            </div>
          </div>

          <button
            onClick={() => exportToCSV(templates, items)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors"
          >
            <Download size={16} />
            CSVでエクスポート
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors"
          >
            <Upload size={16} />
            CSVからインポート
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 font-bold rounded-2xl transition-colors"
            >
              <RefreshCw size={16} />
              データをすべて削除
            </button>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-bold text-center">本当にすべてのデータを削除しますか？</p>
              <p className="text-xs text-red-500 text-center">この操作は取り消せません</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">キャンセル</button>
                <button onClick={() => { onDeleteAllData(); setShowDeleteConfirm(false); }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600">削除する</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

type Tab = 'dashboard' | 'library' | 'templates' | 'settings';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { templates, items, loading: dataLoading, saveTemplate, deleteTemplate, saveItem, deleteItem, updateQuantity, deleteAllData } = useData(user?.uid ?? null);

  // Settings (local)
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    notificationDaysBefore: 7,
    notificationHour: 9,
  });

  // Active tab
  const [tab, setTab] = useState<Tab>('dashboard');

  // Modals
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | undefined>(undefined);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tresor-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Apply theme
  useEffect(() => {
    const apply = (dark: boolean) => {
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };

    if (settings.theme === 'dark') {
      apply(true);
    } else if (settings.theme === 'light') {
      apply(false);
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('tresor-settings', JSON.stringify(next));
      return next;
    });
  };

  const handleSaveItem = async (item: Item) => {
    await saveItem(item);
    setShowItemEditor(false);
    setEditingItem(null);
  };

  const handleSaveTemplate = async (template: Template) => {
    await saveTemplate(template);
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const handleSelectPreset = async (preset: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    await saveTemplate({
      id: generateId(),
      ...preset,
      createdAt: now,
      updatedAt: now,
      sortOrder: templates.length,
    });
    setShowPresets(false);
  };

  const openAddItem = (templateId?: string) => {
    setEditingItem(null);
    setDefaultTemplateId(templateId);
    setShowItemEditor(true);
  };

  const openEditItem = (item: Item) => {
    setEditingItem(item);
    setDefaultTemplateId(undefined);
    setShowItemEditor(true);
  };

  const openEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  // Loading
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-amber-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">t</span>
          </div>
          <p className="text-slate-500 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <LayoutDashboard size={22} /> },
    { id: 'library', label: 'ライブラリ', icon: <BookOpen size={22} /> },
    { id: 'templates', label: 'テンプレート', icon: <Layers size={22} /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon size={22} /> },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Sidebar (desktop) */}
      <aside className={`hidden md:flex flex-col w-64 flex-shrink-0 border-r ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">t</span>
            </div>
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400">trésor</h1>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">あなただけの宝箱</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-bold text-sm ${tab === item.id ? 'bg-amber-500 text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
              </span>
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
        <header className={`md:hidden flex items-center justify-between px-4 py-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">t</span>
            </div>
            <h1 className="text-xl font-bold text-amber-600 dark:text-amber-400">trésor</h1>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <LogOut size={18} className="text-slate-400" />
          </button>
        </header>

        {/* Desktop page title */}
        <div className={`hidden md:block px-8 py-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100 bg-white'}`}>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {navItems.find((n) => n.id === tab)?.label}
          </h2>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-2xl mx-auto px-4 py-6 md:px-8">
            {tab === 'dashboard' && (
              <DashboardTab
                templates={templates}
                items={items}
                onAddItem={() => openAddItem()}
                isDark={isDark}
                notifyDaysBefore={settings.notificationDaysBefore}
              />
            )}
            {tab === 'library' && (
              <LibraryTab
                templates={templates}
                items={items}
                onEditItem={openEditItem}
                onDeleteItem={deleteItem}
                onQuantityChange={(id, delta) => updateQuantity(id, delta)}
                onAddItem={openAddItem}
                isDark={isDark}
              />
            )}
            {tab === 'templates' && (
              <TemplatesTab
                templates={templates}
                items={items}
                onCreateTemplate={openCreateTemplate}
                onEditTemplate={openEditTemplate}
                onDeleteTemplate={deleteTemplate}
                onShowPresets={() => setShowPresets(true)}
                isDark={isDark}
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

        {/* Mobile bottom nav */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-lg`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${tab === item.id ? 'text-amber-500' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {item.icon}
              <span className={`text-xs font-bold ${tab === item.id ? 'text-amber-500' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Modals */}
      {showItemEditor && templates.length > 0 && (
        <ItemEditorModal
          item={editingItem}
          templates={templates}
          defaultTemplateId={defaultTemplateId}
          onSave={handleSaveItem}
          onClose={() => { setShowItemEditor(false); setEditingItem(null); }}
          isDark={isDark}
        />
      )}

      {showItemEditor && templates.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowItemEditor(false)} />
          <div className={`relative rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <Layers size={40} className="text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">テンプレートが必要です</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">アイテムを追加する前に、テンプレートを作成してください</p>
            <button
              onClick={() => { setShowItemEditor(false); setTab('templates'); }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl"
            >
              テンプレートを作成
            </button>
          </div>
        </div>
      )}

      {showTemplateEditor && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
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
