import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Question } from '../../types';
import { StatsBar } from './StatsBar';
import { FilterBar } from './FilterBar';
import { QuestionGrid } from './QuestionGrid';
import { NoteModal } from './NoteModal';
import { ReviewModal } from './ReviewModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface TrackerViewProps {
  onNavigateToManagement: () => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({ onNavigateToManagement }) => {
  const {
    workbooks,
    subjects,
    activeWorkbook,
    activeWorkbookId,
    setActiveWorkbookId,
    filterOptions,
    filteredQuestions,
    setStatusFilter,
    setSearchQuery,
    setQuestionStatus,
    toggleQuestionStatus,
    setQuestionNote,
    batchSetQuestions,
    getWorkbookStats,
    deleteWorkbook,
    duplicateWorkbook,
  } = useApp();

  // モーダル管理ステート
  const [selectedQuestionForNote, setSelectedQuestionForNote] = useState<Question | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 選択中問題集の紐づく教科情報
  const activeSubject = subjects.find((s) => s.id === activeWorkbook?.subjectId);
  const stats = activeWorkbook ? getWorkbookStats(activeWorkbook) : null;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. 問題集クイックセレクター (横スクロール対応カルーセル) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              問題集を選択
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({workbooks.length}冊登録済み)
            </span>
          </div>
          <button
            onClick={onNavigateToManagement}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline"
          >
            <span>+ 新規問題集を作成</span>
          </button>
        </div>

        {/* 問題集チップ一覧 */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {workbooks.map((wb) => {
            const isSelected = wb.id === activeWorkbookId;
            const wbSubject = subjects.find((s) => s.id === wb.subjectId);
            const wbStats = getWorkbookStats(wb);

            return (
              <button
                key={wb.id}
                onClick={() => setActiveWorkbookId(wb.id)}
                className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 border text-left ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {/* 教科カラーバッジ */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: wbSubject?.color || '#3B82F6' }}
                  title={wbSubject?.name}
                />

                <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[180px]">
                  <span className="truncate font-semibold text-xs leading-tight">
                    {wb.title}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {wbSubject?.name} • {wbStats.progressRate}%
                  </span>
                </div>

                {/* ✕ の件数バッジ */}
                {wbStats.incorrect > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                      isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                    title={`要復習の✕が ${wbStats.incorrect}問 あります`}
                  >
                    ✕ {wbStats.incorrect}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 問題集未選択時のプレースホルダー */}
      {/* ======================================================== */}
      {!activeWorkbook || !stats ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              問題集が選択されていません
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              上部のリストから問題集を選択するか、新しい問題集を作成して100問の正否記録を始めましょう。
            </p>
          </div>
          <button
            onClick={onNavigateToManagement}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-95"
          >
            <span>問題集を作成・管理する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* 3. 選択中問題集のメインコンテンツ */
        /* ======================================================== */
        <div className="space-y-6">
          {/* 問題集タイトル & ヘッダー情報 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* 教科アイコン / バッジ */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{
                  backgroundColor: `${activeSubject?.color || '#3B82F6'}18`,
                  color: activeSubject?.color || '#3B82F6',
                }}
              >
                {activeSubject?.icon || '📚'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeWorkbook.title}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${activeSubject?.color || '#3B82F6'}20`,
                      color: activeSubject?.color || '#3B82F6',
                    }}
                  >
                    {activeSubject?.name || '未分類'}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    全{activeWorkbook.totalQuestions}問
                  </span>
                </div>
                {activeWorkbook.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {activeWorkbook.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>更新: {new Date(activeWorkbook.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => duplicateWorkbook(activeWorkbook.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="この問題集を複製 (2周目学習用)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="この問題集を削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 統計バー (StatsBar) */}
          <StatsBar stats={stats} />

          {/* フィルターバー (FilterBar - ✕のみ抽出ボタン等) */}
          <FilterBar
            currentStatus={filterOptions.status}
            searchQuery={filterOptions.searchQuery}
            onStatusChange={setStatusFilter}
            onSearchChange={setSearchQuery}
            stats={stats}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onBatchSetStatus={(st) => batchSetQuestions(activeWorkbook.id, st)}
          />

          {/* 100問グリッドビュー (QuestionGrid) */}
          <QuestionGrid
            questions={filteredQuestions}
            allQuestionsCount={activeWorkbook.questions.length}
            isFiltered={filterOptions.status !== 'all' || Boolean(filterOptions.searchQuery)}
            onToggleStatus={(num) => toggleQuestionStatus(activeWorkbook.id, num)}
            onSetStatus={(num, st) => setQuestionStatus(activeWorkbook.id, num, st)}
            onOpenNoteModal={(q) => setSelectedQuestionForNote(q)}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. メモモーダル */}
      {/* ======================================================== */}
      <NoteModal
        question={selectedQuestionForNote}
        isOpen={Boolean(selectedQuestionForNote)}
        onClose={() => setSelectedQuestionForNote(null)}
        onSaveNote={(num, note) => {
          if (activeWorkbook) {
            setQuestionNote(activeWorkbook.id, num, note);
          }
        }}
        onChangeStatus={(num, st) => {
          if (activeWorkbook) {
            setQuestionStatus(activeWorkbook.id, num, st);
            // 現在のモーダル表示中のQuestionも更新
            setSelectedQuestionForNote((prev) =>
              prev ? { ...prev, status: st } : null
            );
          }
        }}
      />

      {/* ======================================================== */}
      {/* 5. ✕集中復習モードモーダル */}
      {/* ======================================================== */}
      {activeWorkbook && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          workbook={activeWorkbook}
          onUpdateStatus={(num, st) => setQuestionStatus(activeWorkbook.id, num, st)}
          onUpdateNote={(num, note) => setQuestionNote(activeWorkbook.id, num, note)}
        />
      )}

      {/* 問題集削除の確認モーダル */}
      {activeWorkbook && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="この問題集を削除しますか？"
          message={`「${activeWorkbook.title}」を完全に削除します。`}
          detail="記録されたすべての解答（◯/✕）、メモ、学習履歴が削除されます。この操作は取り消せません。"
          confirmText="問題集を完全に削除する"
          cancelText="キャンセル"
          variant="danger"
          onConfirm={() => {
            deleteWorkbook(activeWorkbook.id);
            setIsDeleteModalOpen(false);
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};
