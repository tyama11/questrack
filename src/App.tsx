import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './types';
import { TrackerView } from './components/tracker/TrackerView';
import { ManagementView } from './components/management/ManagementView';
import { DataView } from './components/data/DataView';
import { useApp, useI18n } from './context';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');
  const { setActiveWorkbookId } = useApp();
  const { dict } = useI18n();

  // マネジメント画面から問題集を指定してトラッカーへジャンプ
  const handleOpenWorkbookInTracker = (workbookId: string) => {
    setActiveWorkbookId(workbookId);
    setActiveTab('tracker');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* グローバルヘッダー & ナビゲーションバー */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* メインコンテンツ領域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'tracker' && (
          <TrackerView onNavigateToManagement={() => setActiveTab('management')} />
        )}

        {activeTab === 'management' && (
          <ManagementView onOpenWorkbook={handleOpenWorkbookInTracker} />
        )}

        {activeTab === 'data' && <DataView />}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{dict.app.title}</span>
            <span>—</span>
            <span>{dict.app.footerDesc}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{dict.app.frameworkInfo}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
