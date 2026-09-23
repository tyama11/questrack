import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  FileText,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Question, QuestionStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface QuestionGridProps {
  questions: Question[];
  allQuestionsCount: number;
  isFiltered: boolean;
  onToggleStatus: (questionNumber: number) => void;
  onSetStatus: (questionNumber: number, status: QuestionStatus) => void;
  onOpenNoteModal: (question: Question) => void;
}

export const QuestionGrid: React.FC<QuestionGridProps> = ({
  questions,
  allQuestionsCount,
  isFiltered,
  onToggleStatus,
  onSetStatus,
  onOpenNoteModal,
}) => {
  const { dict, t } = useI18n();

  // キーボードフォーカス用の選択中問題番号
  const [focusedNumber, setFocusedNumber] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初回マウント時、または問題変更時に先頭にフォーカスを設定
  useEffect(() => {
    if (questions.length > 0 && focusedNumber === null) {
      setFocusedNumber(questions[0].number);
    }
  }, [questions, focusedNumber]);

  // キーボード操作ハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フォームやモーダルが開いている場合は無視
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (focusedNumber === null || questions.length === 0) return;

      const currentIdx = questions.findIndex((q) => q.number === focusedNumber);
      if (currentIdx === -1) return;

      const key = e.key.toLowerCase();

      // 1. 矢印キー移動 (ArrowRight, ArrowLeft, ArrowDown, ArrowUp)
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (currentIdx + 1) % questions.length;
        setFocusedNumber(questions[nextIdx].number);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = (currentIdx - 1 + questions.length) % questions.length;
        setFocusedNumber(questions[prevIdx].number);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRowIdx = Math.min(currentIdx + 10, questions.length - 1);
        setFocusedNumber(questions[nextRowIdx].number);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRowIdx = Math.max(currentIdx - 10, 0);
        setFocusedNumber(questions[prevRowIdx].number);
      }

      // 2. ステータス変更ショートカット (O: 正解, X: 不正解, U: 未解答, Space: トグル)
      else if (key === 'o') {
        e.preventDefault();
        onSetStatus(focusedNumber, 'correct');
      } else if (key === 'x') {
        e.preventDefault();
        onSetStatus(focusedNumber, 'incorrect');
      } else if (key === 'u') {
        e.preventDefault();
        onSetStatus(focusedNumber, 'unanswered');
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleStatus(focusedNumber);
      }

      // 3. メモモーダルショートカット (M または Enter)
      else if (key === 'm' || e.key === 'Enter') {
        e.preventDefault();
        const targetQ = questions.find((q) => q.number === focusedNumber);
        if (targetQ) {
          onOpenNoteModal(targetQ);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedNumber, questions, onSetStatus, onToggleStatus, onOpenNoteModal]);

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {dict.tracker.noMatchingQuestions}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isFiltered
              ? dict.tracker.noMatchingDesc
              : dict.tracker.noWorkbookDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800"
    >
      {/* グリッドヘッダー・件数 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {t('tracker.gridShowing', { showing: questions.length, total: allQuestionsCount })}
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {dict.tracker.clickToCycle}
        </span>
      </div>

      {/* 10列レスポンシブグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
        {questions.map((q) => {
          const isFocused = focusedNumber === q.number;
          const hasNote = Boolean(q.note && q.note.trim().length > 0);

          return (
            <div
              key={q.id}
              onClick={() => setFocusedNumber(q.number)}
              className={`group relative flex flex-col rounded-2xl p-2.5 transition-all duration-150 select-none ${
                isFocused
                  ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md scale-102 z-10'
                  : 'hover:shadow-md hover:scale-101 border'
              } ${
                q.status === 'correct'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                  : q.status === 'incorrect'
                  ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-100 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              {/* セル上部: 問題番号 & メモアイコン */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold tracking-tight">
                  #{q.number}
                </span>

                {/* メモボタン & インジケーター */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNoteModal(q);
                  }}
                  className={`p-1 rounded-lg transition-all ${
                    hasNote
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 opacity-60 group-hover:opacity-100'
                  }`}
                  title={hasNote ? t('tracker.noteTooltip', { note: q.note }) : dict.tracker.addNote}
                >
                  <MessageSquare className={`w-3 h-3 ${hasNote ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* セル中央: メインステータス表示 (クリックでトグル) */}
              <button
                type="button"
                onClick={() => onToggleStatus(q.number)}
                className="flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={dict.tracker.clickToCycle}
              >
                {q.status === 'correct' && (
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                      {dict.stats.correctLegend}
                    </span>
                  </div>
                )}

                {q.status === 'incorrect' && (
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <X className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mt-1">
                      {dict.stats.incorrectLegend}
                    </span>
                  </div>
                )}

                {q.status === 'unanswered' && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
                      <span className="text-xs font-bold leading-none">-</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">{dict.stats.unansweredLegend}</span>
                  </div>
                )}
              </button>

              {/* セル下部: ◯ / ✕ クイックダイレクトボタン */}
              <div className="flex items-center gap-1 mt-1 pt-1.5 border-t border-black/5 dark:border-white/5 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(q.number, 'correct');
                  }}
                  className={`flex-1 py-0.5 text-[10px] font-bold rounded flex items-center justify-center transition-colors ${
                    q.status === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                  }`}
                  title={dict.stats.correctLegend}
                >
                  ◯
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(q.number, 'incorrect');
                  }}
                  className={`flex-1 py-0.5 text-[10px] font-bold rounded flex items-center justify-center transition-colors ${
                    q.status === 'incorrect'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                  }`}
                  title={dict.stats.incorrectLegend}
                >
                  ✕
                </button>
              </div>

              {/* メモがある場合のホバープレビューツールチップ */}
              {hasNote && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-[11px] leading-snug shadow-xl z-30 pointer-events-none border border-slate-700 font-sans">
                  <div className="font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{dict.tracker.addNote}</span>
                  </div>
                  <p className="line-clamp-3">{q.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
