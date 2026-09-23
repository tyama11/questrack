import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { TrackerView } from './components/tracker/TrackerView';
import { ManagementView } from './components/management/ManagementView';
import { DataView } from './components/data/DataView';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');
  const { setActiveWorkbookId } = useApp();

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
            <span className="font-semibold text-slate-600 dark:text-slate-300">Questrack</span>
            <span>—</span>
            <span>100問追跡 & ✕克服特化デスクトップアプリ</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Tauri v2 + React 18 + TailwindCSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
