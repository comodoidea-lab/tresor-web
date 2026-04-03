'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, getFirebaseMessaging } from '@/lib/firebase';
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

  // Handle redirect result after Google login
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('Google login successful:', result.user);
        }
      })
      .catch((error) => {
        console.error('Redirect login error:', error);
        setError('Googleログインに失敗しました');
      });
  }, []);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ポップアップを許可してください');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('ログインがキャンセルされました');
      } else {
        setError(`Googleログインに失敗しました: ${err.message || '不明なエラー'}`);
      }
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container rounded-2xl mb-4 shadow-lg overflow-hidden">
            <svg viewBox="0 0 512 512" className="w-12 h-12">
              <rect width="512" height="512" rx="24" fill="#F59D0A"/>
              <g transform="translate(64 64) scale(16 16)">
                <g fill="none" stroke="#333333" strokeWidth="1.5">
                  <path strokeLinecap="square" d="M16.263 10.5H7.737c-2.581 0-3.872 0-4.466.853c-.593.852-.152 2.073.73 4.514l1.084 3c.46 1.273.69 1.91 1.204 2.271c.513.362 1.186.362 2.532.362h6.358c1.346 0 2.019 0 2.532-.362c.514-.362.744-.998 1.204-2.271l1.084-3c.882-2.441 1.323-3.662.73-4.514c-.594-.853-1.885-.853-4.466-.853Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 8c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077h-11c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C5 7.301 5 7.534 5 8m11.5-4c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54C15.699 2.5 15.466 2.5 15 2.5H9c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C7.5 3.301 7.5 3.534 7.5 4"/>
                </g>
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-primary font-headline tracking-tight">trésor</h1>
          <p className="text-secondary/60 mt-2 text-sm font-medium">管理を、もっとシンプルに。</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-elevated border border-outline-variant/10 p-6">
          <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-outline-variant/20 rounded-xl font-bold text-on-surface hover:bg-surface-container transition-all active:scale-[0.98] disabled:opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Googleでログイン
          </button>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span className="text-secondary/40 text-xs font-medium">または</span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>
          <div className="flex bg-surface-container-low rounded-xl p-1 mb-4">
            <button onClick={() => setTab('signin')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tab === 'signin' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary/60'}`}>ログイン</button>
            <button onClick={() => setTab('signup')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tab === 'signup' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary/60'}`}>新規登録</button>
          </div>
          <div className="space-y-3">
            <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmail()} className="w-full px-4 py-3.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
            <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmail()} className="w-full px-4 py-3.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
            {error && <p className="text-error text-sm font-medium px-1">{error}</p>}
            <button onClick={handleEmail} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-primary hover:shadow-elevated active:shadow-press active:scale-[0.98]">
              {loading ? '処理中...' : tab === 'signin' ? 'ログイン' : 'アカウント作成'}
            </button>
          </div>
        </div>
        <p className="text-center text-secondary/40 text-xs mt-6">© 2024 trésor — あなただけの宝箱</p>
      </div>
    </div>
  );
}

// ============================================================
// DELETE CONFIRMATION MODAL
// ============================================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div 
        className="relative z-10 w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-elevated border border-outline-variant/10 p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-error-container/50 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} className="text-error" />
          </div>
          <h3 className="text-lg font-bold text-on-surface font-headline">{title}</h3>
        </div>
        <p className="text-sm text-secondary/70 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-secondary font-bold rounded-xl transition-all active:scale-95"
          >
            キャンセル
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-error hover:bg-error/90 text-white font-bold rounded-xl shadow-press transition-all active:scale-95 active:shadow-none"
          >
            削除する
          </button>
        </div>
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
    { title: 'trésor（トレゾール）へようこそ', desc: '身の回りのあらゆるモノを「あなた専用の型」で管理できる魔法の宝箱です。', icon: <Sparkles size={48} className="text-primary-container" /> },
    { title: '1. テンプレート（型）を作る', desc: '「テンプレート」タブから、管理したいモノの型を作ります。項目を自由に決められます。', icon: <Layers size={48} className="text-primary-container" /> },
    { title: '2. モノを登録する', desc: '「ライブラリ」から、モノを登録します。型を選ぶだけで、最適な入力欄が現れます。', icon: <PlusCircle size={48} className="text-primary-container" /> },
    { title: '3. タグで賢く整理', desc: '「#仕事」などのタグを付けると、一覧からワンタップで絞り込めます。', icon: <Hash size={48} className="text-primary-container" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-surface-container-lowest w-full max-w-sm rounded-2xl p-8 shadow-elevated border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center py-4">{steps[step].icon}</div>
        <div className="space-y-2 text-center mt-2">
          <h2 className="text-xl font-black text-on-surface font-headline">{steps[step].title}</h2>
          <p className="text-sm text-secondary/70 leading-relaxed">{steps[step].desc}</p>
        </div>
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary-container' : 'w-2 bg-surface-container'}`} />
          ))}
        </div>
        <div className="flex gap-4 pt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 bg-surface-container hover:bg-surface-container-high rounded-2xl font-bold text-secondary transition-all active:scale-95">
              戻る
            </button>
          )}
          <button
            onClick={() => { if (step < steps.length - 1) setStep(step + 1); else onClose(); }}
            className="flex-1 py-3.5 bg-primary-container hover:bg-primary-container/90 rounded-2xl font-bold text-white shadow-primary transition-all active:scale-95 active:shadow-press"
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
      <div className="relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl bg-surface-container-lowest" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20 bg-inherit rounded-t-3xl">
          <h2 className="text-lg font-bold text-on-surface">{item ? 'アイテム編集' : 'モノを登録'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors"><X size={20} className="text-secondary" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wide mb-2 block">テンプレート</label>
            <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); const tpl = templates.find((t) => t.id === e.target.value); setSubLocation(tpl?.subLocations[0] ?? ''); setAttributes({}); }} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/20 rounded-2xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wide mb-2 block">アイテム名 *</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="アイテム名を入力" className="w-full px-4 py-3 bg-surface-container border border-outline-variant/20 rounded-2xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wide mb-2 block">数量</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-secondary font-bold text-lg hover:bg-surface-container-high transition-colors">−</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 text-center px-2 py-2 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-primary-container/20 rounded-full text-primary font-bold text-lg hover:bg-primary-container/30 transition-colors">+</button>
            </div>
          </div>
          {template && template.subLocations.length > 0 && (
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wide mb-2 block">保管場所</label>
              <div className="flex flex-wrap gap-2">
                {template.subLocations.map((loc) => (
                  <button key={loc} onClick={() => setSubLocation(loc)} className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${subLocation === loc ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>{loc}</button>
                ))}
              </div>
            </div>
          )}
          {template && template.attributes.length > 0 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-secondary uppercase tracking-wide block">属性</label>
              {template.attributes.map((attr) => (
                <div key={attr.name}>
                  <label className="text-sm font-bold text-on-surface mb-1.5 block">{attr.name}</label>
                  {(attr.type === 'text' || attr.type === 'number' || attr.type === 'tag') ? (
                    <input type={attr.type === 'number' ? 'number' : 'text'} value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} placeholder={attr.name} className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                  ) : attr.type === 'date' ? (
                    <input type="date" value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} className="w-full max-w-full min-w-0 px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                  ) : attr.type === 'url' ? (
                    <input type="url" value={attributes[attr.name] ?? ''} onChange={(e) => setAttributes({ ...attributes, [attr.name]: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                  ) : attr.type === 'checkbox' ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setAttributes({ ...attributes, [attr.name]: attributes[attr.name] === 'true' ? 'false' : 'true' })} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${attributes[attr.name] === 'true' ? 'bg-primary border-primary' : 'border-outline'}`}>
                        {attributes[attr.name] === 'true' && <Check size={14} className="text-on-primary" />}
                      </div>
                      <span className="text-sm font-medium text-on-surface">{attr.name}</span>
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {/* Note field — always visible, multiline */}
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wide mb-2 block">ノート</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="自由にメモを記入できます（改行可）"
              rows={4}
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant/20 rounded-2xl text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm resize-none leading-relaxed"
            />
          </div>
        </div>
        {error && <p className="px-6 pb-2 text-error text-sm font-bold">{error}</p>}
        <div className="sticky bottom-0 flex gap-3 px-6 pb-6 pt-4 bg-inherit border-t border-outline-variant/20">
          <button onClick={onClose} className="flex-1 py-3 bg-surface-container text-secondary font-bold rounded-2xl hover:bg-surface-container-high transition-colors">キャンセル</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary-container hover:bg-primary text-on-primary-container font-bold rounded-2xl transition-colors disabled:opacity-60">{saving ? '保存中...' : item ? '保存する' : '追加する'}</button>
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
      <div className="relative z-10 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl bg-surface-container-lowest" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 pt-6 pb-5 border-b border-outline-variant/20 bg-inherit rounded-t-[2.5rem]">
          <h2 className="text-xl font-bold text-on-surface">{template ? 'テンプレート編集' : 'テンプレート作成'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors"><X size={20} className="text-secondary" /></button>
        </div>
        <div className="px-8 py-6 space-y-6">
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="名称 (例: 冷蔵庫)" className="w-full px-5 py-4 bg-surface-container border border-outline-variant/20 rounded-2xl text-sm font-bold text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20" autoFocus />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-secondary">階層オプション</span>
              <button onClick={addSubLocation} className="text-primary text-[10px] font-bold hover:text-primary-container">+ 追加</button>
            </div>
            <div className="space-y-3">
              {subLocations.map((loc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={loc} onChange={(e) => updateSubLocation(i, e.target.value)} className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant/20 rounded-xl text-sm font-bold text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <button onClick={() => removeSubLocation(i)} className="p-2 text-secondary/40 hover:text-error transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-secondary">デフォルト属性</span>
              <button onClick={addAttribute} className="text-primary text-[10px] font-bold hover:text-primary-container">+ 追加</button>
            </div>
            <div className="space-y-3">
              {attributes.map((attr, i) => (
                <div key={i} className="bg-surface-container p-3 rounded-2xl border border-outline-variant/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={attr.name} onChange={(e) => updateAttribute(i, 'name', e.target.value)} placeholder="項目名" className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm font-bold text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={() => removeAttribute(i)} className="p-2 text-secondary/40 hover:text-error transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <select value={attr.type} onChange={(e) => updateAttribute(i, 'type', e.target.value)} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm">
                    {Object.entries(attrTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="px-8 pb-2 text-error text-sm font-bold">{error}</p>}
        <div className="px-8 pb-8 space-y-4">
          <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-primary-container hover:bg-primary text-on-primary-container font-bold rounded-3xl shadow-sm transition-colors disabled:opacity-60">
            {saving ? '保存中...' : '保存する'}
          </button>
          {template && onDelete && (
            <button onClick={handleDelete} className="w-full py-2 text-center text-xs font-bold text-secondary/50 hover:text-error transition-colors">
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
}

function PresetSelectionModal({ onSelect, onClose }: PresetSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      <div className="relative z-10 w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl bg-surface-container-lowest" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-inherit rounded-t-[2.5rem]">
          <h2 className="text-lg font-bold text-on-surface">プリセット</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors"><X size={20} className="text-secondary" /></button>
        </div>
        <div className="p-4 space-y-3">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelect(preset)}
              className="w-full text-left p-5 rounded-3xl font-bold text-on-surface text-base hover:opacity-80 transition-opacity bg-surface-container"
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
      {/* Hero Summary Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Card */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-tonal border border-outline-variant/20 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          <div className="relative z-10">
            <span className="font-bold text-xs uppercase tracking-widest text-secondary/70 mb-2 block">
              {greeting}
            </span>
            <h2 className="font-headline font-black text-4xl leading-tight text-on-surface tracking-tight">
              {items.length}<span className="text-secondary/50 text-xl align-baseline ml-2">アイテム</span>
            </h2>
            <p className="text-secondary/70 font-medium mt-2">現在の管理状況をお知らせします。</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <span className="block text-xs text-secondary/60 mb-1 font-bold">テンプレート</span>
              <span className="font-headline text-3xl font-black text-primary">{templates.length}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onShowTutorial}
                className="px-5 py-3 rounded-xl font-bold text-sm border border-outline-variant/30 hover:bg-surface-container transition-colors flex-1 sm:flex-initial"
              >
                使い方
              </button>
              <button
                onClick={onAddItem}
                className="bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-primary hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex-1 sm:flex-initial"
              >
                <Plus size={20} />
                アイテムを追加
              </button>
            </div>
          </div>
          {/* Decorative Accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-container/10 rounded-full -mr-16 -mt-16" />
        </div>

        {/* Side Stats Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-primary-container/10 flex items-center justify-center rounded-xl">
                <Box size={20} className="text-primary-container" />
              </div>
              <span className="text-[10px] font-bold text-primary-container bg-primary-fixed/30 px-2 py-1 rounded-full">
                総数
              </span>
            </div>
            <div>
              <span className="block text-sm text-secondary/60 mb-1 font-bold">アイテム総数</span>
              <span className="font-headline text-2xl font-black text-on-surface">{items.length}</span>
            </div>
          </div>
          <div className="bg-secondary text-white p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center rounded-xl">
                <Layers size={20} className="text-primary-container" />
              </div>
            </div>
            <div>
              <span className="block text-sm text-white/60 mb-1 font-bold">テンプレート</span>
              <span className="font-headline text-2xl font-black">{templates.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome card (when no templates) */}
      {templates.length === 0 && (
        <div className="bg-gradient-to-br from-primary-container to-primary p-6 rounded-2xl shadow-elevated overflow-hidden relative">
          <div className="absolute -right-2 -top-2 opacity-20 pointer-events-none">
            <Sparkles size={80} className="text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-white" />
            <p className="text-lg font-bold text-white font-headline">使い方はかんたんです！</p>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <p className="text-sm font-bold text-white">「テンプレート」で型を作る</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <p className="text-sm font-bold text-white">「ライブラリ」から登録する</p>
            </div>
          </div>
          <button
            onClick={onShowTutorial}
            className="w-full bg-white py-3 rounded-xl font-bold text-primary text-sm shadow-md hover:shadow-lg hover:scale-[1.01] transition-all active:scale-[0.98]"
          >
            はじめてガイドを見る
          </button>
        </div>
      )}

      {/* Alert items */}
      {alertItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-error-container/50 rounded-lg flex items-center justify-center">
              <AlertCircle size={18} className="text-error" />
            </div>
            <h3 className="font-bold text-lg font-headline text-on-surface">期限間近のアラート</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onEditItem(item)}
                className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 hover:border-primary-container/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-error-container/30 rounded-xl flex items-center justify-center">
                    <Clock size={18} className="text-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{item.name}</p>
                    <p className="text-xs text-secondary/60 mt-0.5">期限が近づいています</p>
                  </div>
                  <ChevronRight size={16} className="text-outline-variant group-hover:text-primary-container transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-surface-container rounded-lg flex items-center justify-center">
              <Library size={18} className="text-secondary" />
            </div>
            <h3 className="font-bold text-lg font-headline text-on-surface">最近のアクティビティ</h3>
          </div>
          <button
            onClick={onGoToLibrary}
            className="flex items-center gap-1 text-primary font-bold text-sm hover:underline"
          >
            すべて見る
            <ArrowRight size={14} />
          </button>
        </div>
        {recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onEditItem(item)}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-tonal hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 text-left group"
              >
                <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-container/10 transition-colors">
                  <Box size={24} className="text-secondary/40 group-hover:text-primary-container transition-colors" />
                </div>
                <p className="font-bold text-on-surface text-sm line-clamp-2 mb-2">{item.name}</p>
                <p className="text-xs font-bold text-secondary/50">{templates.find((t) => t.id === item.templateId)?.name || '未分類'}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <Box size={48} className="text-outline-variant/50 mx-auto mb-3" strokeWidth={1} />
            <p className="text-secondary/60 font-bold text-sm">アイテムがまだありません</p>
            <button
              onClick={onAddItem}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white font-bold rounded-xl text-sm shadow-primary hover:shadow-lg transition-all"
            >
              最初のアイテムを追加
            </button>
          </div>
        )}
      </section>
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

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({
    isOpen: false,
    itemId: null,
    itemName: '',
  });

  // Filter items
  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesTemplate = !filterTemplateId || item.templateId === filterTemplateId;
      return matchesSearch && matchesTemplate;
    });
    if (activeAttributeFilter) {
      list = list.filter((item) => item.attributes && item.attributes[activeAttributeFilter.key] === activeAttributeFilter.value);
    }
    return list;
  }, [items, search, filterTemplateId, activeAttributeFilter]);

  // Drag sort state with physics-based animation
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const dragFromIdx = useRef(0);
  const dragItemH = useRef(88);
  const dragVelocity = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const origCenters = useRef<number[]>([]);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);
    onReorderItems(newItems);
  };

  const initDrag = (e: React.PointerEvent, item: Item, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const pid = e.pointerId;
    dragStartY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = Date.now();
    dragVelocity.current = 0;
    const el = rowRefs.current.get(item.id);
    dragItemH.current = (el?.getBoundingClientRect().height ?? 80) + 12;
    origCenters.current = filtered.map((it) => {
      const r = rowRefs.current.get(it.id);
      return r ? r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2 : 0;
    });
    dragFromIdx.current = idx;
    didDrag.current = true;
    try {
      listRef.current?.setPointerCapture(pid);
    } catch { /* */ }
    setActiveDragId(item.id);
    setDropIndex(idx);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(30);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!activeDragId) return;

    // Calculate velocity for physics
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      dragVelocity.current = (e.clientY - lastY.current) / dt;
    }
    lastY.current = e.clientY;
    lastTime.current = now;

    const delta = e.clientY - dragStartY.current;
    setDragDeltaY(delta);

    const currentCY = (origCenters.current[dragFromIdx.current] ?? 0) + delta;
    let bestIdx = dragFromIdx.current;
    let bestDist = Infinity;
    origCenters.current.forEach((cy, i) => {
      const d = Math.abs(currentCY - cy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    if (bestIdx !== dropIndex) setDropIndex(bestIdx);
  };

  const endDrag = () => {
    if (activeDragId) {
      // Apply inertia/over shoot animation
      const velocity = dragVelocity.current;
      const overshoot = velocity * 50; // pixels based on velocity

      if (dropIndex !== null && dropIndex !== dragFromIdx.current) {
        handleReorder(dragFromIdx.current, dropIndex);
      }

      // Spring back animation
      const springBack = () => {
        setDragDeltaY((prev) => {
          const target = 0;
          const stiffness = 0.3;
          const damping = 0.8;
          const diff = target - prev;
          return prev + diff * stiffness;
        });
      };

      setTimeout(() => {
        didDrag.current = false;
      }, 300);
    } else {
      didDrag.current = false;
    }
    setActiveDragId(null);
    setDragDeltaY(0);
    setDropIndex(null);
  };

  const getRowStyle = (id: string, index: number): React.CSSProperties => {
    if (id === activeDragId) {
      return {
        transform: `translateY(${dragDeltaY}px) scale(1.02)`,
        zIndex: 50,
        position: 'relative',
        transition: 'transform 0.1s ease-out',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      };
    }
    if (activeDragId !== null && dropIndex !== null) {
      const h = dragItemH.current;
      const from = dragFromIdx.current;
      if (from < dropIndex && index > from && index <= dropIndex)
        return { transform: `translateY(-${h}px)`, transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
      if (from > dropIndex && index >= dropIndex && index < from)
        return { transform: `translateY(${h}px)`, transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
    }
    return { transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
  };

  const openDeleteModal = (itemId: string, itemName: string) => {
    setDeleteModal({ isOpen: true, itemId, itemName });
  };

  const confirmDelete = () => {
    if (deleteModal.itemId) {
      onDeleteItem(deleteModal.itemId);
    }
    setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="アイテムを削除"
        message={`「${deleteModal.itemName}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center">
            <Library size={20} className="text-primary-container" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface">ライブラリ</h2>
            <p className="text-sm text-secondary/60">全 <span className="text-primary font-bold">{filtered.length}</span> アイテム</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex items-center">
        <Search size={18} className="absolute left-4 text-secondary/50 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="アイテムを検索..."
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all active:scale-[0.99]"
        />
      </div>

      {/* Template filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFilterTemplateId(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            !filterTemplateId
              ? 'bg-primary-container text-white shadow-sm'
              : 'bg-surface-container-low border border-outline-variant/20 text-secondary hover:bg-surface-container'
          }`}
        >
          すべて
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTemplateId(filterTemplateId === t.id ? null : t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              filterTemplateId === t.id
                ? 'bg-primary-container text-white shadow-sm'
                : 'bg-surface-container-low border border-outline-variant/20 text-secondary hover:bg-surface-container'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Attribute filter pill */}
      {activeAttributeFilter && (
        <div className="flex items-center bg-primary-fixed/30 border border-primary-container/20 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <Filter size={14} className="text-primary flex-shrink-0" />
          <p className="text-sm font-bold text-primary ml-2 flex-1 truncate">絞り込み中: {activeAttributeFilter.value}</p>
          <button onClick={() => setActiveAttributeFilter(null)} className="ml-2 p-1 hover:bg-primary/10 rounded-lg transition-colors active:scale-90">
            <X size={16} className="text-primary" />
          </button>
        </div>
      )}

      {/* Sort / Delete mode toolbar */}
      <div className="flex items-center justify-end gap-2 bg-surface-container-low p-2 rounded-xl">
        <button
          onClick={() => { setSortMode(!sortMode); setDeleteMode(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
            sortMode
              ? 'bg-primary-container text-white shadow-sm'
              : 'text-secondary hover:bg-surface-container-lowest'
          }`}
        >
          <GripVertical size={14} />
          並べ替え
        </button>
        <button
          onClick={() => { setDeleteMode(!deleteMode); setSortMode(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
            deleteMode
              ? 'bg-error text-white'
              : 'text-secondary hover:bg-surface-container-lowest'
          }`}
        >
          <Trash2 size={14} />
          削除
        </button>
      </div>

      {/* Items List */}
      <div
        ref={listRef}
        className="space-y-3"
        style={{ userSelect: 'none' }}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {filtered.map((item, index) => {
          const template = templates.find((t) => t.id === item.templateId);
          const isDragging = activeDragId === item.id;
          const isInEditMode = sortMode || deleteMode;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) rowRefs.current.set(item.id, el);
                else rowRefs.current.delete(item.id);
              }}
              style={getRowStyle(item.id, index)}
              className="relative rounded-2xl"
            >
              {/* Card */}
              <div
                className={`bg-surface-container-lowest p-4 rounded-2xl shadow-tonal border cursor-pointer select-none transition-all
                  ${isDragging ? 'border-primary-container scale-[1.02] z-50 shadow-elevated' : 'border-outline-variant/10 hover:shadow-elevated hover:-translate-y-0.5'}
                  ${deleteMode ? 'border-error/50 bg-error-container/10' : ''}
                  ${sortMode ? 'border-primary/40' : ''}
                `}
                onClick={(e) => {
                  if (sortMode || didDrag.current) {
                    e.preventDefault();
                    return;
                  }
                  onEditItem(item);
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${sortMode ? 'bg-primary-container/20 animate-pulse' : 'bg-surface-container'
                      }`}
                  >
                    <Box size={24} className={`transition-colors ${sortMode ? 'text-primary-container' : 'text-secondary/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-bold text-on-surface text-sm">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="bg-surface-container px-2 py-1 rounded-md text-[10px] text-secondary/70 font-bold">{template?.name || '未分類'}</span>
                      {item.subLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-primary" />
                          <span className="text-[10px] text-primary font-bold">{item.subLocation}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Quantity controls — hidden in sort/delete mode */}
                  {!sortMode && !deleteMode && (
                    <div className="flex items-center bg-surface-container rounded-xl p-1 self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, -1); }}
                        className="p-1.5 hover:bg-surface-container-lowest rounded-lg transition-all active:scale-90 active:bg-primary/10"
                      >
                        <MinusCircle size={18} className="text-secondary/50" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-on-surface">{item.quantity || 0}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, 1); }}
                        className="p-1.5 hover:bg-surface-container-lowest rounded-lg transition-all active:scale-90 active:bg-primary/10"
                      >
                        <PlusCircle size={18} className="text-secondary/50" />
                      </button>
                    </div>
                  )}
                  {/* Delete mode button with bounce animation */}
                  {deleteMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(item.id, item.name); }}
                      className="p-2 self-center flex-shrink-0 bg-error-container/50 rounded-xl transition-all hover:bg-error-container active:scale-90 hover:scale-105"
                    >
                      <Trash2 size={18} className="text-error" />
                    </button>
                  )}
                  {/* Sort mode grip handle with pulse */}
                  {sortMode && (
                    <div
                      style={{ touchAction: 'none' }}
                      className="p-2 self-center flex-shrink-0 cursor-grab active:cursor-grabbing transition-transform active:scale-95"
                      onPointerDown={(e) => initDrag(e, item, index)}
                    >
                      <GripVertical size={22} className={isDragging ? 'text-primary-container' : 'text-secondary/30'} />
                    </div>
                  )}
                </div>
                {/* Attribute chips */}
                {item.attributes && Object.keys(item.attributes).some((k) => item.attributes[k]) && (
                  <div className="flex flex-wrap gap-2 border-t border-outline-variant/10 pt-3 mt-3">
                    {Object.entries(item.attributes).map(([key, val]) => {
                      if (!val && val !== 'false') return null;
                      const isCheckbox = val === 'true' || val === 'false';
                      const isTag = !isCheckbox && (val.toString().startsWith('#') || key.toLowerCase().includes('タグ'));
                      const isUrl = !isCheckbox && val.toString().startsWith('http');
                      if (isCheckbox) {
                        return (
                          <span key={key} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface-container transition-transform hover:scale-105">
                            {val === 'true' ? <CheckSquare size={10} className="text-primary-container" /> : <Square size={10} className="text-secondary/40" />}
                            <span className={`text-[10px] font-bold ${val === 'true' ? 'text-primary' : 'text-secondary/40'}`}>{key}</span>
                          </span>
                        );
                      }
                      return (
                        <button
                          key={key}
                          onClick={(e) => { e.stopPropagation(); isUrl ? window.open(val, '_blank') : setActiveAttributeFilter({ key, value: val }); }}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 ${isTag ? 'bg-primary-fixed/30' : isUrl ? 'bg-blue-50' : 'bg-surface-container'
                            }`}
                        >
                          {isTag ? <Hash size={9} className="text-primary" /> : isUrl ? <ExternalLink size={9} className="text-blue-500" /> : <Tag size={9} className="text-secondary/50" />}
                          <span className={`text-[10px] font-bold ${isTag ? 'text-primary' : isUrl ? 'text-blue-500' : 'text-secondary/60'}`}>{isUrl ? key : val}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Note */}
                {item.note && (
                  <div className="border-t border-outline-variant/10 pt-3 mt-3">
                    <p className="text-xs text-secondary/60 whitespace-pre-wrap leading-relaxed">{item.note}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 animate-in fade-in duration-500">
            <Library size={48} className="text-outline-variant/30" strokeWidth={1} />
            <p className="text-sm font-bold text-secondary/40 mt-2">アイテムが見つかりませんでした</p>
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
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; templateId: string | null; templateName: string }>({ 
    isOpen: false, 
    templateId: null, 
    templateName: '' 
  });

  // Drag sort state with physics-based animation
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const dragFromIdx = useRef(0);
  const dragItemH = useRef(88);
  const dragVelocity = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const origCenters = useRef<number[]>([]);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newTemplates = [...templates];
    const [moved] = newTemplates.splice(fromIdx, 1);
    newTemplates.splice(toIdx, 0, moved);
    onReorderTemplates(newTemplates);
  };

  const initDrag = (e: React.PointerEvent, t: Template, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const pid = e.pointerId;
    dragStartY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = Date.now();
    dragVelocity.current = 0;
    const el = rowRefs.current.get(t.id);
    dragItemH.current = (el?.getBoundingClientRect().height ?? 80) + 16;
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
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!activeDragId) return;
    e.preventDefault();
    
    // Calculate velocity for physics
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      dragVelocity.current = (e.clientY - lastY.current) / dt;
    }
    lastY.current = e.clientY;
    lastTime.current = now;
    
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
      return { 
        transform: `translateY(${dragDeltaY}px) scale(1.02)`, 
        zIndex: 50, 
        position: 'relative',
        transition: 'transform 0.1s ease-out',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      };
    }
    if (activeDragId !== null && dropIndex !== null) {
      const h = dragItemH.current;
      const from = dragFromIdx.current;
      if (from < dropIndex && index > from && index <= dropIndex) return { transform: `translateY(-${h}px)`, transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
      if (from > dropIndex && index >= dropIndex && index < from) return { transform: `translateY(${h}px)`, transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
    }
    return { transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' };
  };

  const openDeleteModal = (templateId: string, templateName: string) => {
    setDeleteModal({ isOpen: true, templateId, templateName });
  };

  const confirmDelete = () => {
    if (deleteModal.templateId) {
      onDeleteTemplate(deleteModal.templateId);
    }
    setDeleteModal({ isOpen: false, templateId: null, templateName: '' });
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="テンプレートを削除"
        message={`「${deleteModal.templateName}」を削除しますか？関連するアイテムもすべて削除されます。この操作は元に戻せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, templateId: null, templateName: '' })}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center">
            <Layers size={20} className="text-primary-container" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface">テンプレート管理</h2>
            <p className="text-sm text-secondary/60">全 <span className="text-primary font-bold">{templates.length}</span> テンプレート</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onShowPresets}
            className="flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant/20 px-4 py-2.5 rounded-xl text-secondary text-sm font-bold hover:bg-surface-container transition-all active:scale-95 flex-1 sm:flex-initial"
          >
            <Sparkles size={16} className="text-primary-container" />
            プリセット
          </button>
          <button
            onClick={onCreateTemplate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-primary hover:shadow-elevated active:shadow-press active:scale-95 transition-all flex-1 sm:flex-initial"
          >
            <Plus size={16} />
            作成
          </button>
        </div>
      </div>

      {/* Sort / Delete mode toolbar */}
      <div className="flex items-center justify-end gap-2 bg-surface-container-low p-2 rounded-xl">
        <button
          onClick={() => { setSortMode(!sortMode); setDeleteMode(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
            sortMode
              ? 'bg-primary-container text-white shadow-sm'
              : 'text-secondary hover:bg-surface-container-lowest'
          }`}
        >
          <GripVertical size={14} />
          並べ替え
        </button>
        <button
          onClick={() => { setDeleteMode(!deleteMode); setSortMode(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
            deleteMode
              ? 'bg-error text-white'
              : 'text-secondary hover:bg-surface-container-lowest'
          }`}
        >
          <Trash2 size={14} />
          削除
        </button>
      </div>

      {/* Templates list */}
      <div
        ref={listRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        style={{ userSelect: 'none' }}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {templates.map((template, index) => {
          const isDragging = activeDragId === template.id;
          const isInEditMode = sortMode || deleteMode;
          return (
            <div
              key={template.id}
              ref={(el) => { if (el) rowRefs.current.set(template.id, el); else rowRefs.current.delete(template.id); }}
              style={getRowStyle(template.id, index)}
              className="relative rounded-2xl"
            >
              {/* Card */}
              <button
                className={`w-full h-full bg-surface-container-lowest p-5 rounded-2xl border select-none flex flex-col justify-between transition-all text-left
                  ${isDragging ? 'border-primary-container scale-[1.02] z-50 shadow-elevated' : 'border-outline-variant/10 shadow-tonal hover:shadow-elevated hover:-translate-y-0.5'}
                  ${deleteMode ? 'border-error/50 bg-error-container/10' : ''}
                  ${sortMode ? 'border-primary/40' : ''}
                `}
                onClick={() => {
                  if (sortMode || didDrag.current) return;
                  onEditTemplate(template);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl flex-shrink-0 transition-all ${sortMode ? 'bg-primary-container/20 animate-pulse' : 'bg-primary-container/10'}`}>
                    <Layers size={24} className={`transition-colors ${sortMode ? 'text-primary-container' : 'text-primary-container'}`} />
                  </div>
                  {deleteMode ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(template.id, template.name); }}
                      className="p-2 bg-error-container/50 rounded-xl transition-all hover:bg-error-container active:scale-90 hover:scale-105"
                    >
                      <Trash2 size={18} className="text-error" />
                    </button>
                  ) : sortMode ? (
                    <div
                      style={{ touchAction: 'none' }}
                      className="p-2 cursor-grab active:cursor-grabbing transition-transform active:scale-95"
                      onPointerDown={(e) => initDrag(e, template, index)}
                    >
                      <GripVertical size={22} className={isDragging ? 'text-primary-container' : 'text-secondary/30'} />
                    </div>
                  ) : (
                    <ChevronRight size={20} className="text-outline-variant/50" />
                  )}
                </div>
                <div className="mt-4">
                  <p className="font-bold text-on-surface text-lg truncate">{template.name}</p>
                  <p className="text-xs text-secondary/60 font-bold mt-1">{template.subLocations?.length || 0} 階層 / {template.attributes?.length || 0} 属性</p>
                </div>
              </button>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 bg-surface-container-low rounded-2xl border border-outline-variant/20 animate-in fade-in duration-500">
            <Layers size={48} className="text-outline-variant/40 mx-auto mb-3" strokeWidth={1} />
            <p className="font-bold text-secondary/50">テンプレートがありません</p>
            <p className="text-secondary/40 text-sm mt-1">プリセットか新規作成から始めましょう</p>
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
  userId?: string;
  onSaveFcmToken: (token: string) => Promise<void>;
  onDeleteFcmToken: (token: string) => Promise<void>;
}

function SettingsTab({ settings, onUpdateSettings, templates, items, onDeleteAllData, isDark, userEmail, userName, onSaveFcmToken, onDeleteFcmToken }: SettingsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifPermission, setNotifPermission] = useState<'default' | 'granted' | 'denied' | 'loading'>(() => {
    if (typeof Notification !== 'undefined') {
      return Notification.permission as 'default' | 'granted' | 'denied';
    }
    return 'default';
  });
  const [currentFcmToken, setCurrentFcmToken] = useState<string | null>(null);
  
  // Delete confirmation modal state for reset
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`CSVファイル「${file.name}」を読み込みました。\nインポート機能は近日公開予定です。`);
  };

  const confirmReset = () => {
    onDeleteAllData();
    setResetModalOpen(false);
  };

  const handleEnableNotifications = async () => {
    setNotifPermission('loading');
    try {
      const { getToken } = await import('firebase/messaging');
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        setNotifPermission('default');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifPermission(permission as 'denied' | 'default');
        return;
      }
      setNotifPermission('granted');
      const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (token) {
        setCurrentFcmToken(token);
        await onSaveFcmToken(token);
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      setNotifPermission('default');
    }
  };

  const handleDisableNotifications = async () => {
    if (currentFcmToken) {
      try {
        await onDeleteFcmToken(currentFcmToken);
      } catch (err) {
        console.error('Failed to delete FCM token:', err);
      }
      setCurrentFcmToken(null);
    }
    setNotifPermission('default');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Reset Data Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={resetModalOpen}
        title="全データをリセット"
        message="🚨 登録したアイテムとテンプレートがすべて削除されます。元に戻せません。本当に実行しますか？"
        onConfirm={confirmReset}
        onCancel={() => setResetModalOpen(false)}
      />

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary-container" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-on-surface">設定</h2>
          <p className="text-sm text-secondary/60">アプリの設定を管理します</p>
        </div>
      </div>

      {/* Account Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-secondary/50 uppercase tracking-wider ml-1">アカウント</h3>
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-tonal">
          <div className="p-5 flex items-center gap-4 border-b border-outline-variant/10">
            <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              {userName && <p className="font-bold text-on-surface truncate">{userName}</p>}
              <p className="text-sm text-secondary/60 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center p-4 gap-3 text-secondary hover:bg-surface-container transition-colors active:scale-[0.99]"
          >
            <LogOut size={20} className="text-secondary/50" />
            <span className="font-bold">ログアウト</span>
          </button>
        </div>
      </section>

      {/* Push Notifications */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-secondary/50 uppercase tracking-wider ml-1">通知</h3>
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-tonal p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-fixed/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-on-surface">プッシュ通知</p>
              <p className="text-sm text-secondary/60 mt-1 leading-relaxed">
                期限が近づいたアイテムをお知らせします。
              </p>
            </div>
          </div>
          {notifPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              className="w-full py-3 bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white font-bold rounded-xl text-sm shadow-primary hover:shadow-elevated active:shadow-press active:scale-[0.98] transition-all"
            >
              通知を有効にする
            </button>
          )}
          {notifPermission === 'loading' && (
            <button disabled className="w-full py-3 bg-primary-container/50 text-white font-bold rounded-xl text-sm opacity-70 cursor-wait">
              設定中...
            </button>
          )}
          {notifPermission === 'granted' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Check size={16} className="text-green-500" />
                <span className="text-sm font-bold text-green-600">通知が有効です</span>
              </div>
              <button
                onClick={handleDisableNotifications}
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-secondary font-bold rounded-xl text-sm transition-all active:scale-[0.98]"
              >
                無効にする
              </button>
            </div>
          )}
          {notifPermission === 'denied' && (
            <div className="flex items-center gap-2 px-1 py-2 bg-error-container/30 rounded-lg">
              <AlertCircle size={16} className="text-error flex-shrink-0" />
              <p className="text-xs text-error font-medium">ブラウザの設定から通知を許可してください</p>
            </div>
          )}
        </div>
      </section>

      {/* Theme */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-secondary/50 uppercase tracking-wider ml-1">カラーテーマ</h3>
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-tonal">
          <button onClick={() => onUpdateSettings({ colorTheme: 'amber' })} className="w-full flex items-center justify-between p-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <span className="font-bold text-on-surface">アンバー</span>
            </div>
            {settings.colorTheme === 'amber' && <div className="w-3 h-3 rounded-full bg-primary-container animate-in zoom-in duration-200" />}
          </button>
          <button onClick={() => onUpdateSettings({ colorTheme: 'botanical' })} className="w-full flex items-center justify-between p-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#316342] rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <span className="font-bold text-on-surface">ボタニカル</span>
            </div>
            {settings.colorTheme === 'botanical' && <div className="w-3 h-3 rounded-full bg-primary-container animate-in zoom-in duration-200" />}
          </button>
          <button onClick={() => onUpdateSettings({ colorTheme: 'midnight' })} className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <span className="font-bold text-on-surface">ミッドナイト</span>
            </div>
            {settings.colorTheme === 'midnight' && <div className="w-3 h-3 rounded-full bg-primary-container animate-in zoom-in duration-200" />}
          </button>
        </div>
      </section>

      {/* Notification Timing */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-secondary/50 uppercase tracking-wider ml-1">通知設定</h3>
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-tonal">
          <div className="p-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-fixed/30 rounded-lg flex items-center justify-center">
                <Bell size={16} className="text-primary" />
              </div>
              <p className="text-sm font-bold text-secondary">期限の何日前に通知するか</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 7].map((days) => (
                <button key={days} onClick={() => onUpdateSettings({ notificationDaysBefore: days })} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${settings.notificationDaysBefore === days ? 'bg-primary-container border-primary-container text-white shadow-primary' : 'bg-surface-container border-outline-variant/20 text-secondary hover:bg-surface-container-high'}`}>
                  {days}日前
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-secondary mb-3">通知時刻</p>
            <div className="flex flex-wrap gap-2">
              {[7, 9, 12, 18, 20].map((hour) => (
                <button key={hour} onClick={() => onUpdateSettings({ notificationHour: hour })} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${settings.notificationHour === hour ? 'bg-primary-container border-primary-container text-white shadow-primary' : 'bg-surface-container border-outline-variant/20 text-secondary hover:bg-surface-container-high'}`}>
                  {hour}時
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data management */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-secondary/50 uppercase tracking-wider ml-1">データ管理 (バックアップ)</h3>
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-tonal">
          <button onClick={() => exportToCSV(templates, items)} className="w-full flex items-center p-4 gap-3 border-b border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-[0.99]">
            <div className="w-8 h-8 bg-primary-fixed/30 rounded-lg flex items-center justify-center">
              <Download size={18} className="text-primary" />
            </div>
            <span className="font-bold text-on-surface">CSVバックアップを出力</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center p-4 gap-3 hover:bg-surface-container transition-colors active:scale-[0.99]">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Upload size={18} className="text-blue-500" />
            </div>
            <span className="font-bold text-on-surface">CSVファイルから復元</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
        </div>
      </section>

      {/* Reset */}
      <section>
        <button onClick={() => setResetModalOpen(true)} className="w-full bg-error-container/30 hover:bg-error-container/50 rounded-2xl flex items-center p-4 gap-3 border border-error/20 transition-all active:scale-[0.98]">
          <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
            <Trash2 size={18} className="text-error" />
          </div>
          <span className="font-bold text-error">全データをリセット</span>
        </button>
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
  const { templates, items, loading: dataLoading, settings: firestoreSettings, saveTemplate, deleteTemplate, saveItem, deleteItem, updateQuantity, reorderItems, reorderTemplates, deleteAllData, saveSettings, saveFcmToken, deleteFcmToken } = useData(user?.uid ?? null);

  const DEFAULT_SETTINGS: Settings = { colorTheme: 'amber', notificationDaysBefore: 7, notificationHour: 9 };
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
    if (!dataLoading && user && templates.length === 0) {
      const done = localStorage.getItem('tresor-tutorial-done');
      if (!done) setShowTutorial(true);
    }
  }, [dataLoading, templates.length, user]);

  // Apply color theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.colorTheme);
  }, [settings.colorTheme]);

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
    await saveTemplate({ id: generateId(), ...preset, createdAt: now, updatedAt: now, sortOrder: -Date.now() });
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
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse overflow-hidden">
            <svg viewBox="0 0 512 512" className="w-10 h-10">
              <rect width="512" height="512" rx="24" fill="#F59D0A"/>
              <g transform="translate(64 64) scale(16 16)">
                <g fill="none" stroke="#333333" strokeWidth="1.5">
                  <path strokeLinecap="square" d="M16.263 10.5H7.737c-2.581 0-3.872 0-4.466.853c-.593.852-.152 2.073.73 4.514l1.084 3c.46 1.273.69 1.91 1.204 2.271c.513.362 1.186.362 2.532.362h6.358c1.346 0 2.019 0 2.532-.362c.514-.362.744-.998 1.204-2.271l1.084-3c.882-2.441 1.323-3.662.73-4.514c-.594-.853-1.885-.853-4.466-.853Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 8c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077h-11c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C5 7.301 5 7.534 5 8m11.5-4c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54C15.699 2.5 15.466 2.5 15 2.5H9c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C7.5 3.301 7.5 3.534 7.5 4"/>
                </g>
              </g>
            </svg>
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
    <div className="min-h-screen flex bg-surface font-body">
      {/* Dark Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-secondary fixed left-0 top-0 h-screen z-50">
        {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <g fill="none" stroke="#333333" strokeWidth="1.5">
                  <path strokeLinecap="square" d="M16.263 10.5H7.737c-2.581 0-3.872 0-4.466.853c-.593.852-.152 2.073.73 4.514l1.084 3c.46 1.273.69 1.91 1.204 2.271c.513.362 1.186.362 2.532.362h6.358c1.346 0 2.019 0 2.532-.362c.514-.362.744-.998 1.204-2.271l1.084-3c.882-2.441 1.323-3.662.73-4.514c-.594-.853-1.885-.853-4.466-.853Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 8c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077h-11c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C5 7.301 5 7.534 5 8m11.5-4c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54C15.699 2.5 15.466 2.5 15 2.5H9c-.466 0-.699 0-.883.076a1 1 0 0 0-.54.541C7.5 3.301 7.5 3.534 7.5 4"/>
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight font-headline">trésor</h1>
              <p className="text-xs text-white/50">あなただけの宝箱</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                tab === item.id
                  ? 'text-primary-container bg-white/10 border-r-2 border-primary-container'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="font-headline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <span className="text-secondary font-bold">{user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-white/40">Manager</p>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="ログアウト"
            >
              <LogOut size={18} className="text-white/60" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header with backdrop blur */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <g fill="none" stroke="#333333" strokeWidth="1.5">
                    <path strokeLinecap="square" d="M16.263 10.5H7.737c-2.581 0-3.872 0-4.466.853c-.593.852-.152 2.073.73 4.514l1.084 3c.46 1.273.69 1.91 1.204 2.271c.513.362 1.186.362 2.532.362h6.358c1.346 0 2.019 0 2.532-.362c.514-.362.744-.998 1.204-2.271l1.084-3c.882-2.441 1.323-3.662.73-4.514c-.594-.853-1.885-.853-4.466-.853Z"/>
                  </g>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-primary font-headline">trésor</h1>
            </div>

            {/* Search bar (desktop) */}
            <div className="hidden md:flex items-center bg-surface-container-low px-4 py-2.5 rounded-xl w-96 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search size={18} className="text-secondary mr-3" />
              <input
                type="text"
                placeholder="アイテムを検索..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-body"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut(auth)}
                className="hidden sm:flex items-center gap-2 text-primary font-bold text-sm px-4 py-2.5 hover:bg-primary/5 rounded-xl transition-colors active:scale-95"
              >
                <LogOut size={18} />
                ログアウト
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-6 py-8">
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
                userId={user.uid}
                onSaveFcmToken={saveFcmToken}
                onDeleteFcmToken={deleteFcmToken}
              />
            )}
          </div>
        </main>

        {/* FAB (library tab only) */}
        {tab === 'library' && (
          <button
            onClick={() => openAddItem()}
            className="fixed right-6 bottom-24 lg:bottom-8 w-14 h-14 bg-gradient-to-r from-primary-container to-primary-fixed-dim text-white rounded-full shadow-primary hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center z-20 transition-all duration-200"
          >
            <Plus size={28} />
          </button>
        )}

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 z-10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  tab === item.id ? 'text-primary-container' : 'text-secondary/60'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-bold font-headline">{item.label}</span>
              </button>
            ))}
          </div>
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
        />
      )}
    </div>
  );
}
