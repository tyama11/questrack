import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ArrowUpRight,
  TrendingUp,
  XCircle,
  CheckCircle2,
  X,
  Palette,
  Check,
  AlertTriangle,
  Globe,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { Subject, Workbook } from '../../types';
import { calculateOverallStats } from '../../utils/storage';
import { ConfirmModal } from '../common/ConfirmModal';

interface ManagementViewProps {
  onOpenWorkbook: (workbookId: string) => void;
}

// プリセットカラー
const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

// プリセットアイコン絵文字
const ICON_PRESETS = ['📚', '📐', '🔤', '📖', '🔬', '🌍', '💻', '📝', '🎯', '🧪', '💡', '📊'];

export const ManagementView: React.FC<ManagementViewProps> = ({ onOpenWorkbook }) => {
  const {
    workbooks,
    subjects,
    createWorkbook,
    updateWorkbook,
    deleteWorkbook,
    duplicateWorkbook,
    createSubject,
    updateSubject,
    deleteSubject,
    getWorkbookStats,
  } = useApp();

  const { dict, t, currentLanguage } = useI18n();

  // 実行環境が Tauri か Webブラウザかを判定
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  // ----------------------------------------------------
  // モーダル管理ステート
  // ----------------------------------------------------
  // 削除確認モーダル用ステート
  const [wbToDelete, setWbToDelete] = useState<Workbook | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // 問題集作成モーダル
  const [isCreateWbOpen, setIsCreateWbOpen] = useState(false);
  const [wbTitle, setWbTitle] = useState('');
  const [wbSubjectId, setWbSubjectId] = useState(subjects[0]?.id || '');
  const [wbTotalQuestions, setWbTotalQuestions] = useState(100);
  const [wbDescription, setWbDescription] = useState('');

  // 問題集編集モーダル
  const [editingWb, setEditingWb] = useState<Workbook | null>(null);
  const [editWbTitle, setEditWbTitle] = useState('');
  const [editWbSubjectId, setEditWbSubjectId] = useState('');
  const [editWbTotalQuestions, setEditWbTotalQuestions] = useState(100);
  const [editWbDescription, setEditWbDescription] = useState('');

  // 教科作成・編集モーダル
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState(COLOR_PRESETS[0]);
  const [subjectIcon, setSubjectIcon] = useState(ICON_PRESETS[0]);
  const [subjectDescription, setSubjectDescription] = useState('');

  // ----------------------------------------------------
  // 全体横断の統計計算
  // ----------------------------------------------------
  const overallStats = React.useMemo(() => {
    return calculateOverallStats(workbooks);
  }, [workbooks]);

  // ----------------------------------------------------
  // 問題集作成ハンドラー
  // ----------------------------------------------------
  const handleOpenCreateWb = () => {
    setWbTitle('');
    setWbSubjectId(subjects[0]?.id || '');
    setWbTotalQuestions(100);
    setWbDescription('');
    setIsCreateWbOpen(true);
  };

  const handleCreateWorkbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wbTitle.trim()) return;

    createWorkbook(wbTitle.trim(), wbSubjectId, wbTotalQuestions, wbDescription.trim());
    setIsCreateWbOpen(false);
  };

  // ----------------------------------------------------
  // 問題集編集ハンドラー
  // ----------------------------------------------------
  const handleStartEditWb = (wb: Workbook) => {
    setEditingWb(wb);
    setEditWbTitle(wb.title);
    setEditWbSubjectId(wb.subjectId);
    setEditWbTotalQuestions(wb.totalQuestions);
    setEditWbDescription(wb.description || '');
  };

  const handleSaveEditWb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWb || !editWbTitle.trim()) return;

    updateWorkbook(editingWb.id, {
      title: editWbTitle.trim(),
      subjectId: editWbSubjectId,
      totalQuestions: editWbTotalQuestions,
      description: editWbDescription.trim(),
    });
    setEditingWb(null);
  };

  // ----------------------------------------------------
  // 教科作成・編集ハンドラー
  // ----------------------------------------------------
  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectColor(COLOR_PRESETS[0]);
    setSubjectIcon(ICON_PRESETS[0]);
    setSubjectDescription('');
    setIsSubjectModalOpen(true);
  };

  const handleStartEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectColor(subject.color);
    setSubjectIcon(subject.icon || '📚');
    setSubjectDescription(subject.description || '');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: subjectName.trim(),
        color: subjectColor,
        icon: subjectIcon,
        description: subjectDescription.trim(),
      });
    } else {
      createSubject({
        name: subjectName.trim(),
        color: subjectColor,
        icon: subjectIcon,
        description: subjectDescription.trim(),
      });
    }
    setIsSubjectModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ======================================================== */}
      {/* 1. 全体進捗統計カード (全教科横断ダッシュボード) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {dict.management.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dict.management.totalWorkbooksCard}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {workbooks.length}
              </span>
              <span className="text-xs text-slate-400">{dict.management.booksUnit} / {subjects.length} sub</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              {dict.management.totalQuestionsCard}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {overallStats.totalQuestions}
              </span>
              <span className="text-xs text-blue-600/70 dark:text-blue-400/70">
                {dict.management.questionsUnit} {t('management.answeredRatio', { answered: overallStats.totalAnswered })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                {dict.management.totalUnansweredCard}
              </span>
              <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-1 py-0.2 rounded font-extrabold">
                {overallStats.unansweredRate}%
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                {overallStats.totalUnanswered}
              </span>
              <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                {dict.management.questionsUnit}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {dict.management.overallAccuracyCard}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {overallStats.accuracyRate}%
              </span>
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                (◯ {overallStats.totalCorrect})
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                {dict.management.totalIncorrectCard}
              </span>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-100 px-1 py-0.2 rounded font-extrabold">
                {dict.management.needReviewBadge}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {overallStats.totalIncorrect}
              </span>
              <span className="text-xs text-rose-500/80">{dict.management.questionsUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ⚠️ ウェブ版データ消失リスク注意喚起 & バックアップ案内 */}
      {/* ======================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
        !isTauri
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-300 dark:border-amber-700/60'
          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 shadow-sm ${
            !isTauri ? 'bg-amber-500' : 'bg-slate-600 dark:bg-slate-700'
          }`}>
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  {dict.management.webWarningTitle}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  !isTauri
                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {!isTauri ? 'Web Browser' : 'Desktop App'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {dict.management.webWarningDesc}
            </p>
            <div className="pt-1 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
              <a
                href="https://github.com/tyama11/questrack/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <span>{dict.management.downloadAppAction}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 問題集管理セクション */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {dict.management.workbooksSection}
            </h2>
            <span className="text-xs text-slate-400">({workbooks.length})</span>
          </div>

          <button
            onClick={handleOpenCreateWb}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{dict.management.createNewWorkbook}</span>
          </button>
        </div>

        {/* 問題集テーブル / カード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workbooks.map((wb) => {
            const subject = subjects.find((s) => s.id === wb.subjectId);
            const stats = getWorkbookStats(wb);

            return (
              <div
                key={wb.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* 教科バッジ & 複製・編集・削除メニュー */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${subject?.color || '#3B82F6'}18`,
                        color: subject?.color || '#3B82F6',
                      }}
                    >
                      <span>{subject?.icon || '📚'}</span>
                      <span>{subject?.name || dict.tracker.unclassified}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicateWorkbook(wb.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={dict.common.duplicate}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEditWb(wb)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={dict.common.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setWbToDelete(wb)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={dict.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* タイトル & 説明 */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 mb-1">
                    {wb.title}
                  </h3>
                  {wb.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {wb.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mb-3">
                      {currentLanguage === 'ja' ? '説明なし' : 'No description'}
                    </p>
                  )}

                  {/* 進捗と統計 */}
                  <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {t('tracker.allQuestions', { count: wb.totalQuestions })} ({stats.progressRate}%)
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {dict.stats.accuracyRate} {stats.accuracyRate}%
                      </span>
                    </div>

                    {/* ミニプログレスバー */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${(stats.correct / wb.totalQuestions) * 100}%` }}
                        className="bg-emerald-500"
                      />
                      <div
                        style={{ width: `${(stats.incorrect / wb.totalQuestions) * 100}%` }}
                        className="bg-rose-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> {stats.correct}
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                        <XCircle className="w-3 h-3" /> {stats.incorrect}
                      </span>
                      <span className="text-slate-400">{dict.stats.unansweredLegend}: {stats.unanswered}</span>
                    </div>
                  </div>
                </div>

                {/* トラッカーで開くボタン */}
                <button
                  onClick={() => onOpenWorkbook(wb.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  <span>{dict.management.openInTracker}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 教科管理セクション */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {dict.management.subjectsSection}
            </h2>
            <span className="text-xs text-slate-400">({subjects.length})</span>
          </div>

          <button
            onClick={handleOpenCreateSubject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{dict.management.createNewSubject}</span>
          </button>
        </div>

        {/* 教科一覧グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjects.map((sub) => {
            const relatedWorkbooks = workbooks.filter((wb) => wb.subjectId === sub.id);

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                  >
                    {sub.icon || '📚'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {sub.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {t('tracker.registeredCount', { count: relatedWorkbooks.length })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEditSubject(sub)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={dict.common.edit}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (subjects.length <= 1) {
                        return;
                      }
                      setSubjectToDelete(sub);
                    }}
                    disabled={subjects.length <= 1}
                    className={`p-1 rounded-lg transition-colors ${
                      subjects.length <= 1
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                    title={dict.common.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. 新規問題集作成モーダル */}
      {/* ======================================================== */}
      {isCreateWbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {dict.management.createWbModalTitle}
              </h3>
              <button
                onClick={() => setIsCreateWbOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkbook} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={wbTitle}
                  onChange={(e) => setWbTitle(e.target.value)}
                  placeholder={dict.management.wbTitlePlaceholder}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbSubjectLabel}
                </label>
                <select
                  value={wbSubjectId}
                  onChange={(e) => setWbSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbTotalQuestionsLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={wbTotalQuestions}
                    onChange={(e) => setWbTotalQuestions(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex gap-1">
                    {[50, 100, 150].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setWbTotalQuestions(count)}
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          wbTotalQuestions === count
                            ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbDescLabel}
                </label>
                <textarea
                  rows={3}
                  value={wbDescription}
                  onChange={(e) => setWbDescription(e.target.value)}
                  placeholder={dict.management.wbDescPlaceholder}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateWbOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {dict.management.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/30"
                >
                  {dict.management.createButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. 問題集編集モーダル */}
      {/* ======================================================== */}
      {editingWb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {dict.management.editWbModalTitle}
              </h3>
              <button
                onClick={() => setEditingWb(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditWb} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={editWbTitle}
                  onChange={(e) => setEditWbTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbSubjectLabel}
                </label>
                <select
                  value={editWbSubjectId}
                  onChange={(e) => setEditWbSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbTotalQuestionsLabel}
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={editWbTotalQuestions}
                  onChange={(e) => setEditWbTotalQuestions(Number(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {dict.management.wbTotalQuestionsHelp}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.wbDescLabel}
                </label>
                <textarea
                  rows={3}
                  value={editWbDescription}
                  onChange={(e) => setEditWbDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWb(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {dict.management.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/30"
                >
                  {dict.management.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. 教科作成・編集モーダル */}
      {/* ======================================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? dict.management.editSubjectModalTitle : dict.management.createSubjectModalTitle}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.subjectNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder={dict.management.subjectNamePlaceholder}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              {/* カラー選択 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.subjectColorLabel}
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSubjectColor(color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        subjectColor === color ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {subjectColor === color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* アイコン絵文字選択 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.subjectIconLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_PRESETS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSubjectIcon(icon)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border transition-all ${
                        subjectIcon === icon
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 scale-110'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.management.subjectDescLabel}
                </label>
                <input
                  type="text"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder={dict.management.subjectDescPlaceholder}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {dict.management.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/30"
                >
                  {dict.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 問題集削除の確認モーダル */}
      <ConfirmModal
        isOpen={wbToDelete !== null}
        title={dict.management.deleteWbTitle}
        message={t('management.deleteWbMsg', { title: wbToDelete?.title || '' })}
        detail={dict.management.deleteWbDetail}
        confirmText={dict.common.delete}
        cancelText={dict.common.cancel}
        variant="danger"
        onConfirm={() => {
          if (wbToDelete) {
            deleteWorkbook(wbToDelete.id);
            setWbToDelete(null);
          }
        }}
        onCancel={() => setWbToDelete(null)}
      />

      {/* 教科削除の確認モーダル */}
      <ConfirmModal
        isOpen={subjectToDelete !== null}
        title={dict.management.deleteSubjectTitle}
        message={t('management.deleteSubjectMsg', { name: subjectToDelete?.name || '' })}
        detail={dict.management.deleteSubjectDetail}
        confirmText={dict.common.delete}
        cancelText={dict.common.cancel}
        variant="danger"
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete.id);
            setSubjectToDelete(null);
          }
        }}
        onCancel={() => setSubjectToDelete(null)}
      />
    </div>
  );
};
