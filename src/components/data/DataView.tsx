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
import { useI18n } from '../../context/I18nContext';
import { ImportMode } from '../../types';

export const DataView: React.FC = () => {
  const {
    exportData,
    importData,
    resetToSampleData,
    clearAllData,
    getStorageUsageSummary,
  } = useApp();

  const { dict, t, currentLanguage } = useI18n();

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

  const expectedKeyword = currentLanguage === 'ja' ? '初期化' : 'RESET';

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
    } catch {
      alert(currentLanguage === 'ja' ? 'エクスポートに失敗しました。' : 'Export failed.');
    }
  };

  // ----------------------------------------------------
  // インポート: テキスト貼り付けから実行
  // ----------------------------------------------------
  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportStatus({
        type: 'error',
        message: dict.data.noJsonInput,
      });
      return;
    }

    const res = importData(importText.trim(), importMode);
    if (res.success) {
      setImportStatus({
        type: 'success',
        message: t('data.importSuccess', { count: res.count ?? 0 }),
      });
      setImportText('');
    } else {
      setImportStatus({
        type: 'error',
        message: res.error || dict.data.importError,
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
            message: t('data.importFileSuccess', { name: file.name, count: res.count ?? 0 }),
          });
          setImportText('');
        } else {
          setImportStatus({
            type: 'error',
            message: res.error || dict.data.importError,
          });
        }
      }
    };
    reader.readAsText(file);
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
      message: dict.data.sampleRestoreSuccess,
    });
  };

  // ----------------------------------------------------
  // 全データ完全消去
  // ----------------------------------------------------
  const handleClearAll = () => {
    const normalized = resetConfirmInput.trim().toUpperCase();
    if (normalized !== '初期化' && normalized !== 'RESET') return;
    clearAllData();
    setIsResetModalOpen(false);
    setResetConfirmInput('');
    setImportStatus({
      type: 'success',
      message: dict.data.clearAllSuccess,
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
            {dict.data.storageSummaryTitle}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dict.data.registeredWorkbooks}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.workbookCount}
              </span>
              <span className="text-xs text-slate-400">{dict.data.booksUnit}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dict.data.registeredQuestions}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.questionCount}
              </span>
              <span className="text-xs text-slate-400">{dict.data.questionsUnit}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dict.data.registeredSubjects}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {storageSummary.subjectCount}
              </span>
              <span className="text-xs text-slate-400">{dict.data.subjectsUnit}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dict.data.storageUsage}
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
            {t('data.lastUpdated', { date: new Date(storageSummary.lastUpdated).toLocaleString() })}
          </span>
          <span>{dict.data.storageLocation}</span>
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
                {dict.data.exportTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {dict.data.exportDesc}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownloadJson}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-98"
            >
              <FileJson className="w-4 h-4" />
              <span>{dict.data.downloadJson}</span>
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
                {dict.data.importTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {dict.data.importDesc}
            </p>

            {/* インポートモード選択 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 mb-3">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {dict.data.importModeTitle}
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
                  <div className="font-semibold">{dict.data.modeMerge}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {dict.data.modeMergeDesc}
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
                  <div className="font-semibold">{dict.data.modeReplace}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {dict.data.modeReplaceDesc}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* ファイル選択インプット */}
            <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
              <Upload className="w-4 h-4" />
              <span>{dict.data.selectFile}</span>
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
              placeholder={dict.data.orPasteText}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            {importText && (
              <button
                onClick={handleImportSubmit}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                {dict.data.runImport}
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
            {dict.data.sampleResetSection}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* サンプルデータ復元 */}
          <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{dict.data.sampleRestoreCardTitle}</span>
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                {dict.data.sampleRestoreCardDesc}
              </p>
            </div>
            <button
              onClick={() => setIsSampleResetModalOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/70 hover:bg-amber-300/80 dark:bg-amber-900/60 dark:hover:bg-amber-800 transition-colors"
            >
              {dict.data.restoreSampleBtn}
            </button>
          </div>

          {/* 全データ完全初期化 (安全ガード付き) */}
          <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dict.data.clearAllCardTitle}</span>
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-400/90 leading-relaxed">
                {dict.data.clearAllCardDesc}
              </p>
            </div>
            <button
              onClick={() => {
                setResetConfirmInput('');
                setIsResetModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all active:scale-98"
            >
              {dict.data.clearAllBtn}
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
                {dict.data.sampleModalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {dict.data.sampleModalDesc}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSampleResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                {dict.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleRestoreSample}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                {dict.data.sampleModalConfirm}
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
                {dict.data.clearAllModalTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {dict.data.clearAllModalDesc}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('data.clearAllInputPrompt', { keyword: expectedKeyword })}
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder={expectedKeyword}
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
                {dict.common.cancel}
              </button>
              <button
                type="button"
                disabled={
                  resetConfirmInput.trim().toUpperCase() !== '初期化' &&
                  resetConfirmInput.trim().toUpperCase() !== 'RESET'
                }
                onClick={handleClearAll}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-600/30 transition-all active:scale-95"
              >
                {dict.data.clearAllConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
