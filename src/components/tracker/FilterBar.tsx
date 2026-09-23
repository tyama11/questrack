import React, { useState } from 'react';
import {
  XCircle,
  CheckCircle2,
  ListFilter,
  Search,
  X,
  Target,
  MoreHorizontal,
  RotateCcw,
  CheckCheck,
  HelpCircle,
} from 'lucide-react';
import { FilterStatus, WorkbookStats } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { useI18n } from '../../context';

interface FilterBarProps {
  currentStatus: FilterStatus;
  searchQuery: string;
  onStatusChange: (status: FilterStatus) => void;
  onSearchChange: (query: string) => void;
  stats: WorkbookStats;
  onOpenReviewModal: () => void;
  onBatchSetStatus: (status: 'correct' | 'unanswered') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentStatus,
  searchQuery,
  onStatusChange,
  onSearchChange,
  stats,
  onOpenReviewModal,
  onBatchSetStatus,
}) => {
  const { dict } = useI18n();
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [confirmBatchType, setConfirmBatchType] = useState<'correct' | 'unanswered' | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
      {/* 上段: フィルタートグル & 復習モード起動ボタン */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ステータスフィルターボタン群 */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {/* 【最重要】 ✕ (不正解) のみ抽出ボタン */}
          <button
            onClick={() =>
              onStatusChange(currentStatus === 'incorrect_only' ? 'all' : 'incorrect_only')
            }
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 shadow-sm ${
              currentStatus === 'incorrect_only'
                ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400 dark:ring-rose-500'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60'
            }`}
            title={dict.tracker.filterIncorrectTooltip}
          >
            <XCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{dict.tracker.filterIncorrectOnly}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                currentStatus === 'incorrect_only'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              {stats.incorrect}
            </span>
          </button>

          {/* すべて */}
          <button
            onClick={() => onStatusChange('all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentStatus === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>{dict.tracker.filterAll}</span>
            <span className="text-[11px] text-slate-400 font-normal">({stats.total})</span>
          </button>

          {/* ◯ (正解) のみ */}
          <button
            onClick={() => onStatusChange('correct_only')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentStatus === 'correct_only'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{dict.tracker.filterCorrectOnly}</span>
            <span className="text-[11px] opacity-80">({stats.correct})</span>
          </button>

          {/* 未解答のみ */}
          <button
            onClick={() => onStatusChange('unanswered_only')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentStatus === 'unanswered_only'
                ? 'bg-slate-700 text-white dark:bg-slate-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{dict.tracker.filterUnansweredOnly}</span>
            <span className="text-[11px] opacity-80">({stats.unanswered})</span>
          </button>
        </div>

        {/* 右側アクション: 集中復習モード & 一括操作メニュー */}
        <div className="flex items-center gap-2">
          {/* 🎯 ✕のみ集中復習モード */}
          <button
            onClick={onOpenReviewModal}
            disabled={stats.incorrect === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
              stats.incorrect > 0
                ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/25 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800'
            }`}
            title={dict.tracker.reviewModeTooltip}
          >
            <Target className="w-4 h-4 stroke-[2.5]" />
            <span>{dict.tracker.startReview}</span>
            {stats.incorrect > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                {stats.incorrect}{dict.stats.questionsUnit}
              </span>
            )}
          </button>

          {/* 一括操作ドロップダウン */}
          <div className="relative">
            <button
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title={dict.tracker.batchMenu}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showBatchMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowBatchMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-30 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
                    {dict.tracker.batchMenu}
                  </div>
                  <button
                    onClick={() => {
                      setConfirmBatchType('correct');
                      setShowBatchMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{dict.tracker.markAllCorrect}</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfirmBatchType('unanswered');
                      setShowBatchMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span>{dict.tracker.markAllUnanswered}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 下段: 検索バー & 案内 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* 検索入力フィールド */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.tracker.searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* キーボード操作ヒント */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Shortcuts:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
            O
          </kbd>
          <span>{dict.stats.correctLegend}</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
            X
          </kbd>
          <span>{dict.stats.incorrectLegend}</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
            U
          </kbd>
          <span>{dict.stats.unansweredLegend}</span>
        </div>
      </div>

      {/* 一括操作の確認モーダル */}
      <ConfirmModal
        isOpen={confirmBatchType !== null}
        title={
          confirmBatchType === 'correct'
            ? dict.tracker.batchConfirmCorrectTitle
            : dict.tracker.batchConfirmResetTitle
        }
        message={
          confirmBatchType === 'correct'
            ? dict.tracker.batchConfirmCorrectMsg
            : dict.tracker.batchConfirmResetMsg
        }
        confirmText={
          confirmBatchType === 'correct'
            ? dict.tracker.markAllCorrect
            : dict.tracker.markAllUnanswered
        }
        cancelText={dict.common.cancel}
        variant={confirmBatchType === 'correct' ? 'primary' : 'warning'}
        onConfirm={() => {
          if (confirmBatchType) {
            onBatchSetStatus(confirmBatchType);
            setConfirmBatchType(null);
          }
        }}
        onCancel={() => setConfirmBatchType(null)}
      />
    </div>
  );
};
