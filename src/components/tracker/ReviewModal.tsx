import React, { useState } from 'react';
import {
  X,
  Target,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit3,
  Save,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { Workbook } from '../../types';
import { useI18n } from '../../context';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: Workbook;
  onUpdateStatus: (questionNumber: number, status: 'correct' | 'incorrect') => void;
  onUpdateNote: (questionNumber: number, note: string) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  workbook,
  onUpdateStatus,
  onUpdateNote,
}) => {
  const { dict, currentLanguage, t } = useI18n();

  // 初期時点で✕となっている問題番号のリストをセッション対象として保持
  const [reviewQuestionNumbers, setReviewQuestionNumbers] = useState<number[]>(() =>
    workbook.questions.filter((q) => q.status === 'incorrect').map((q) => q.number)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [conqueredCount, setConqueredCount] = useState(0);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // モーダルが閉じられている場合は何も表示しない
  if (!isOpen) return null;

  const currentNumber = reviewQuestionNumbers[currentIndex];
  const currentQuestion =
    currentNumber !== undefined
      ? workbook.questions.find((q) => q.number === currentNumber)
      : undefined;

  const handleNext = () => {
    if (currentIndex < reviewQuestionNumbers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsEditingNote(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsEditingNote(false);
    }
  };

  const handleConquered = () => {
    if (!currentQuestion) return;
    onUpdateStatus(currentQuestion.number, 'correct');
    setConqueredCount((prev) => prev + 1);
    handleNext();
  };

  const handleStillIncorrect = () => {
    if (!currentQuestion) return;
    onUpdateStatus(currentQuestion.number, 'incorrect');
    handleNext();
  };

  const handleStartEditNote = () => {
    if (!currentQuestion) return;
    setCurrentNote(currentQuestion.note || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (!currentQuestion) return;
    onUpdateNote(currentQuestion.number, currentNote.trim());
    setIsEditingNote(false);
  };

  const handleRestart = () => {
    const remaining = workbook.questions.filter((q) => q.status === 'incorrect').map((q) => q.number);
    setReviewQuestionNumbers(remaining);
    setCurrentIndex(0);
    setConqueredCount(0);
    setIsCompleted(false);
    setIsEditingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30">
              <Target className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{dict.review.title}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({workbook.title})
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダル本体 */}
        {reviewQuestionNumbers.length === 0 || isCompleted || !currentQuestion ? (
          /* 完了画面 */
          <div className="p-8 text-center space-y-6 my-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/25 ring-4 ring-amber-100 dark:ring-amber-950/50 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {currentLanguage === 'ja' ? '復習セッション完了！' : 'Review Session Completed!'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {conqueredCount > 0 ? (
                  currentLanguage === 'ja' ? (
                    <>
                      今回の復習で <strong className="text-emerald-600 dark:text-emerald-400 text-base">{conqueredCount}問</strong> 克服し「◯」に更新されました！🎉
                    </>
                  ) : (
                    <>
                      Overcame <strong className="text-emerald-600 dark:text-emerald-400 text-base">{conqueredCount} questions</strong> and updated them to "◯"! 🎉
                    </>
                  )
                ) : (
                  currentLanguage === 'ja'
                    ? 'すべての✕問題の確認が終了しました。次回も継続して定着を目指しましょう！'
                    : 'Finished reviewing all incorrect questions. Keep going and master them next time!'
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {workbook.questions.some((q) => q.status === 'incorrect') && (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{currentLanguage === 'ja' ? 'もう一度復習する' : 'Review Again'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-95"
              >
                <span>{currentLanguage === 'ja' ? 'トラッカーに戻る' : 'Back to Tracker'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 学習カード画面 */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* プログレスバー & カウンター */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-600 dark:text-rose-400">
                  {t('review.currentProgress', { current: currentIndex + 1, total: reviewQuestionNumbers.length })}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {currentLanguage === 'ja' ? `克服済み: ${conqueredCount} 問` : `Overcome: ${conqueredCount}`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / reviewQuestionNumbers.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* 問題カード */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              {/* カード上部 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    #{currentQuestion.number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    {dict.stats.incorrectLegend} {dict.stats.reviewBadge}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={dict.review.prevReviewQuestion}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={dict.review.nextReviewQuestion}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* メモ表示・編集エリア */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{dict.review.memoTitle}</span>
                  </span>
                  {!isEditingNote ? (
                    <button
                      onClick={handleStartEditNote}
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{dict.common.edit}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveNote}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Save className="w-3 h-3" />
                      <span>{dict.common.save}</span>
                    </button>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    rows={4}
                    placeholder={dict.review.memoPlaceholder}
                    className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                ) : currentQuestion.note ? (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-2xs font-sans">
                    {currentQuestion.note}
                  </div>
                ) : (
                  <div
                    onClick={handleStartEditNote}
                    className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 cursor-pointer transition-colors"
                  >
                    {currentLanguage === 'ja'
                      ? 'メモはまだありません。クリックして追加できます。'
                      : 'No notes yet. Click to add study note.'}
                  </div>
                )}
              </div>
            </div>

            {/* 判定ボタン (◯ 克服 / ✕ 未克服) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleStillIncorrect}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 font-bold text-xs transition-all active:scale-98"
              >
                <XCircle className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                <span>{dict.review.keepIncorrect}</span>
              </button>

              <button
                type="button"
                onClick={handleConquered}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{dict.review.changeToCorrect}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
