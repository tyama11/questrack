import React from 'react';
import { Target, FolderKanban, Database, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ActiveTab = 'tracker' | 'management' | 'data';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { workbooks, activeWorkbook, getWorkbookStats } = useApp();

  // 現在選択中の問題集の統計
  const activeStats = activeWorkbook ? getWorkbookStats(activeWorkbook) : null;

  // 全体の総不正解(✕)数
  const totalIncorrectAll = workbooks.reduce((acc, wb) => {
    return acc + wb.questions.filter((q) => q.status === 'incorrect').length;
  }, 0);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ & ブランド */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
              <Target className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Questrack
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                100問追跡 & ✕克服特化アプリ
              </p>
            </div>
          </div>

          {/* 3つのメインタブ切り替え */}
          <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            {/* タブ 1: 問題追跡 */}
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === 'tracker'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm shadow-slate-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>問題追跡</span>
              {activeStats && activeStats.incorrect > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full animate-pulse-subtle">
                  {activeStats.incorrect}
                </span>
              )}
            </button>

            {/* タブ 2: マネジメント */}
            <button
              onClick={() => setActiveTab('management')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === 'management'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm shadow-slate-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>マネジメント</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium">
                {workbooks.length}
              </span>
            </button>

            {/* タブ 3: データ移行・初期化 */}
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === 'data'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm shadow-slate-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>データ移行・初期化</span>
            </button>
          </nav>

          {/* 右側: 状況インジケーター */}
          <div className="hidden md:flex items-center gap-3">
            {totalIncorrectAll > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>要復習 ✕ 合計:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{totalIncorrectAll}問</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>✕ なし (全問クリア)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
