import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, TrendingUp, Award } from 'lucide-react';
import { WorkbookStats } from '../../types';
import { useI18n } from '../../context';

interface StatsBarProps {
  stats: WorkbookStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const { dict, t } = useI18n();

  // 正解・不正解・未解答のパーセンテージ計算 (プログレスバー用)
  const correctPercent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  const incorrectPercent = stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0;
  const unansweredPercent = stats.total > 0 ? (stats.unanswered / stats.total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
      {/* 上段: 数値サマリーカードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 正答率 */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {dict.stats.accuracyRate}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.accuracyRate}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {t('stats.correctUnit', { correct: stats.correct, answered: stats.answered })}
              </span>
            </div>
          </div>
        </div>

        {/* 正解 (◯) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
              {dict.stats.correctLabel}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {stats.correct}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-600/70 dark:text-emerald-400/70 truncate">
                {t('stats.totalUnit', { total: stats.total })}
              </span>
            </div>
          </div>
        </div>

        {/* 不正解 (✕) - 最重要強調 */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-sm shadow-rose-500/5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-2 ring-rose-200 dark:ring-rose-800">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <p className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider truncate">
                {dict.stats.incorrectLabel}
              </p>
              <span className="text-[9px] sm:text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-1 py-0.2 rounded font-bold shrink-0">
                {dict.stats.reviewBadge}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {stats.incorrect}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-500/80 dark:text-rose-400/80 truncate">
                {dict.stats.questionsUnit}
              </span>
            </div>
          </div>
        </div>

        {/* 未解答 */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {dict.stats.unansweredLabel}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300">
                {stats.unanswered}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {t('stats.unansweredRemain', { percent: 100 - stats.progressRate })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 下段: マルチセグメント プログレスバー */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span>
              {dict.stats.progressRate}{' '}
              <strong className="text-slate-800 dark:text-slate-200">{stats.progressRate}%</strong>{' '}
              <span className="text-[11px] sm:text-xs">
                {t('stats.progressCompleted', { answered: stats.answered, total: stats.total })}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px]">
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ◯ {correctPercent.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ✕ {incorrectPercent.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> {dict.stats.unansweredLegend} {unansweredPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* バー本体 */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${correctPercent}%` }}
            className="bg-emerald-500 transition-all duration-300 ease-out"
            title={`${dict.stats.correctLegend}: ${stats.correct} (${correctPercent.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${incorrectPercent}%` }}
            className="bg-rose-500 transition-all duration-300 ease-out"
            title={`${dict.stats.incorrectLegend}: ${stats.incorrect} (${incorrectPercent.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${unansweredPercent}%` }}
            className="bg-slate-200 dark:bg-slate-700 transition-all duration-300 ease-out"
            title={`${dict.stats.unansweredLegend}: ${stats.unanswered} (${unansweredPercent.toFixed(1)}%)`}
          />
        </div>
      </div>
    </div>
  );
};
