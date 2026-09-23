import React, { useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  HardDrive,
  FileJson,
  AlertTriangle,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportMode } from '../../types';

export const DataView: React.FC = () => {
  const {
    exportData,
    importData,
    resetToSampleData,
    clearAllData,
    getStorageUsageSummary,
  } = useApp();

  // インポート設定
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // 全データ完全初期化用の二重確認モーダル
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  // サンプルデータ復元の確認モーダル
  const [isSampleResetModalOpen, setIsSampleResetModalOpen] = useState(false);

  // ストレージ使用状況
  const storageSummary = getStorageUsageSummary();

  // ----------------------------------------------------
  // エクスポート: JSONダウンロード
  // ----------------------------------------------------
  const handleDownloadJson = () => {
    try {
      const jsonString = exportData();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `questrack-backup-${dateStr}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('エクスポートに失敗しました。');
    }
  };


  // ----------------------------------------------------
  // インポート: テキスト貼り付けから実行
  // ----------------------------------------------------
  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportStatus({
        type: 'error',
        message: 'JSONデータが入力されていません。',
      });
      return;
    }

    const res = importData(importText.trim(), importMode);
    if (res.success) {
      setImportStatus({
        type: 'success',
        message: `データのインポートが完了しました！（${res.count ?? 0}冊の問題集を取り込みました）`,
      });
      setImportText('');
    } else {
      setImportStatus({
        type: 'error',
        message: res.error || 'JSONデータのパースに失敗しました。',
      });
    }
  };

  // ----------------------------------------------------
  // インポート: ファイル選択 / ドロップ
  // ----------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const res = importData(content, importMode);
        if (res.success) {
          setImportStatus({
            type: 'success',
            message: `ファイル「${file.name}」から正常にインポートしました！（${res.count ?? 0}冊の問題集）`,
          });
          setImportText('');
        } else {
          setImportStatus({
            type: 'error',
            message: res.error || 'ファイルの読み込みに失敗しました。',
          });
        }
      }
    };
    reader.readAsText(file);
    // リセットして同じファイルを再度選択可能にする
    e.target.value = '';
  };

  // ----------------------------------------------------
  // サンプルデータ復元
  // ----------------------------------------------------
  const handleRestoreSample = () => {
    resetToSampleData();
    setIsSampleResetModalOpen(false);
    setImportStatus({
      type: 'success',
      message: '高校数学100問などの初期サンプルデータを正常に復元しました。',
    });
  };

  // ----------------------------------------------------
  // 全データ完全消去
  // ----------------------------------------------------
  const handleClearAll = () => {
    if (resetConfirmInput !== '初期化') return;
    clearAllData();
    setIsResetModalOpen(false);
    setResetConfirmInput('');
    setImportStatus({
      type: 'success',
      message: 'すべての問題集データを完全に消去・初期化しました。',
    });
  };

  // 容量表示ヘルパー (KB または MB)
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ======================================================== */}
      {/* 1. ストレージ利用状況カード */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            ストレージ & データ状態サマリー
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              登録問題集数
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.workbookCount}
              </span>
              <span className="text-xs text-slate-400">冊</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              登録問題総数
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.questionCount}
              </span>
              <span className="text-xs text-slate-400">問</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              登録教科数
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.subjectCount}
              </span>
              <span className="text-xs text-slate-400">教科</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              使用ストレージ容量
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                {formatBytes(storageSummary.storageSizeBytes)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            最終更新日時: {new Date(storageSummary.lastUpdated).toLocaleString()}
          </span>
          <span>データ保存先: ローカル安全ストレージ (LocalStorage)</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. データ移行 (Export / Import) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* エクスポート (バックアップ) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                データのエクスポート (バックアップ)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              現在のすべての教科、問題集、問題の◯/✕ステータス、メモを完全なJSON形式で保存します。PCの移行や定期的なバックアップにご利用ください。
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownloadJson}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-98"
            >
              <FileJson className="w-4 h-4" />
              <span>JSONファイルをダウンロード</span>
            </button>
          </div>
        </div>

        {/* インポート (復元・移行) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                データのインポート (復元・移行)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              過去のバックアップJSONファイルや他PCからエクスポートしたデータを取り込みます。
            </p>

            {/* インポートモード選択 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 mb-3">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                取り込みモードを選択:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    importMode === 'merge'
                      ? 'bg-white dark:bg-slate-700 border-brand-500 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/40'
                  }`}
                >
                  <div className="font-semibold">追加 (マージ)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    現在のデータを残して追加
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    importMode === 'replace'
                      ? 'bg-white dark:bg-slate-700 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/40'
                  }`}
                >
                  <div className="font-semibold">完全置き換え</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    既存を破棄して上書き
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* ファイル選択インプット */}
            <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
              <Upload className="w-4 h-4" />
              <span>JSONファイルを選択してインポート</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* テキスト入力トグルまたはテキストエリア */}
            <textarea
              rows={2}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="またはJSON文字列を直接貼り付け..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            {importText && (
              <button
                onClick={handleImportSubmit}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                貼り付けたテキストからインポート実行
              </button>
            )}
          </div>
        </div>
      </div>

      {/* インポート結果アラート */}
      {importStatus.type && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            importStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{importStatus.message}</span>
          <button
            onClick={() => setImportStatus({ type: null, message: '' })}
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. 初期化・リセット (Reset & Initialization) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            初期化・リセット設定
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* サンプルデータ復元 */}
          <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>サンプルデータの復元</span>
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                初回インストール時の「高校数学 基礎100選」などのサンプル問題集と標準教科セットを再投入します。
              </p>
            </div>
            <button
              onClick={() => setIsSampleResetModalOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/70 hover:bg-amber-300/80 dark:bg-amber-900/60 dark:hover:bg-amber-800 transition-colors"
            >
              サンプルデータへ戻す
            </button>
          </div>

          {/* 全データ完全初期化 (安全ガード付き) */}
          <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                <Trash2 className="w-3.5 h-3.5" />
                <span>全データ完全初期化 (危険)</span>
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-400/90 leading-relaxed">
                登録されているすべての問題集・問題の回答・メモを完全に消去します。この操作は取り消せません。
              </p>
            </div>
            <button
              onClick={() => {
                setResetConfirmInput('');
                setIsResetModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all active:scale-98"
            >
              全データを完全初期化
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. サンプル復元確認モーダル */}
      {/* ======================================================== */}
      {isSampleResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                サンプルデータに復元しますか？
              </h3>
              <p className="text-xs text-slate-500">
                現在の問題集データが初期シードデータ（高校数学100選）で上書きされます。
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSampleResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRestoreSample}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                復元を実行する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. 全データ完全初期化 二重確認モーダル */}
      {/* ======================================================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto ring-4 ring-rose-50 dark:ring-rose-900/40">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                警告: 全データを完全に消去します
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                この操作を実行すると、登録済みの全問題集、◯/✕の回答履歴、すべてのメモが永久に消去され、復旧できなくなります。
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                確認のため、下の枠に「<strong className="text-rose-600">初期化</strong>」と入力してください:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="初期化"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold tracking-widest text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={resetConfirmInput !== '初期化'}
                onClick={handleClearAll}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-600/30 transition-all active:scale-95"
              >
                完全に消去する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
