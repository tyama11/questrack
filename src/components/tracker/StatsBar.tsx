import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, TrendingUp, Award } from 'lucide-react';
import { WorkbookStats } from '../../types';
import { useI18n } from '../../context/I18nContext';

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
      {/* 上段: 数値サマリーカードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 正答率 */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {dict.stats.accuracyRate}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.accuracyRate}%
              </span>
              <span className="text-[11px] text-slate-400">
                {t('stats.correctUnit', { correct: stats.correct, answered: stats.answered })}
              </span>
            </div>
          </div>
        </div>

        {/* 正解 (◯) */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {dict.stats.correctLabel}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {stats.correct}
              </span>
              <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                {t('stats.totalUnit', { total: stats.total })}
              </span>
            </div>
          </div>
        </div>

        {/* 不正解 (✕) - 最重要強調 */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-sm shadow-rose-500/5">
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-2 ring-rose-200 dark:ring-rose-800">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {dict.stats.incorrectLabel}
              </p>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-1 py-0.2 rounded font-bold">
                {dict.stats.reviewBadge}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {stats.incorrect}
              </span>
              <span className="text-[11px] text-rose-500/80 dark:text-rose-400/80">
                {dict.stats.questionsUnit}
              </span>
            </div>
          </div>
        </div>

        {/* 未解答 */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {dict.stats.unansweredLabel}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
                {stats.unanswered}
              </span>
              <span className="text-[11px] text-slate-400">
                {t('stats.unansweredRemain', { percent: 100 - stats.progressRate })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 下段: マルチセグメント プログレスバー */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            <span>
              {dict.stats.progressRate}{' '}
              <strong className="text-slate-800 dark:text-slate-200">{stats.progressRate}%</strong>{' '}
              {t('stats.progressCompleted', { answered: stats.answered, total: stats.total })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ◯ {correctPercent.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ✕ {incorrectPercent.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
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
