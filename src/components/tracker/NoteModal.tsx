import React, { useState } from 'react';
import { X, FileText, CheckCircle2, XCircle, HelpCircle, Save, Tag } from 'lucide-react';
import { Question, QuestionStatus } from '../../types';
import { useI18n } from '../../context';

interface NoteModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (questionNumber: number, note: string) => void;
  onChangeStatus?: (questionNumber: number, status: QuestionStatus) => void;
}

const COMMON_NOTE_TAGS_JA = [
  '計算ミス',
  '公式ど忘れ',
  '問題文の読み間違い',
  '解法パターン未習得',
  '時間配分ミス',
  '符号のミス',
  '定義の確認要',
];

const COMMON_NOTE_TAGS_EN = [
  'Calc Error',
  'Formula Forgotten',
  'Misread Question',
  'Pattern Not Mastered',
  'Time Management',
  'Sign Error (+/-)',
  'Review Definition',
];

export const NoteModal: React.FC<NoteModalProps> = ({
  question,
  isOpen,
  onClose,
  onSaveNote,
  onChangeStatus,
}) => {
  const { dict, currentLanguage } = useI18n();
  const [noteText, setNoteText] = useState('');

  const commonTags = currentLanguage === 'ja' ? COMMON_NOTE_TAGS_JA : COMMON_NOTE_TAGS_EN;

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);

  if (question && question.id !== prevQuestionId) {
    setPrevQuestionId(question.id);
    setNoteText(question.note || '');
  }

  if (!isOpen || !question) return null;

  const handleSave = () => {
    onSaveNote(question.number, noteText.trim());
    onClose();
  };

  const handleAddTag = (tag: string) => {
    const prefix = noteText.trim() ? `${noteText.trim()}\n` : '';
    setNoteText(`${prefix}[${tag}] `);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {currentLanguage === 'ja' ? `第 ${question.number} 問のメモ` : `Notes for Q#${question.number}`}
                </h3>
                {/* 現在のステータスバッジ */}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shrink-0 ${
                    question.status === 'correct'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : question.status === 'incorrect'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {question.status === 'correct' && <CheckCircle2 className="w-3 h-3" />}
                  {question.status === 'incorrect' && <XCircle className="w-3 h-3" />}
                  {question.status === 'unanswered' && <HelpCircle className="w-3 h-3" />}
                  {question.status === 'correct'
                    ? dict.stats.correctLegend
                    : question.status === 'incorrect'
                    ? dict.stats.incorrectLegend
                    : dict.stats.unansweredLegend}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {dict.tracker.notePlaceholder}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダル本文 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* クイックステータス変更 */}
          {onChangeStatus && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-0 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {currentLanguage === 'ja' ? 'ステータスを変更:' : 'Change Status:'}
              </span>
              <div className="grid grid-cols-3 sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeStatus(question.number, 'correct')}
                  className={`min-h-[40px] sm:min-h-0 flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-all ${
                    question.status === 'correct'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{dict.stats.correctLegend}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeStatus(question.number, 'incorrect')}
                  className={`min-h-[40px] sm:min-h-0 flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-all ${
                    question.status === 'incorrect'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{dict.stats.incorrectLegend}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeStatus(question.number, 'unanswered')}
                  className={`min-h-[40px] sm:min-h-0 flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition-all ${
                    question.status === 'unanswered'
                      ? 'bg-slate-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span className="truncate">{dict.stats.unansweredLegend}</span>
                </button>
              </div>
            </div>
          )}

          {/* クイックタグ挿入 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'ja' ? 'クイック挿入タグ:' : 'Quick Tags:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="min-h-[40px] sm:min-h-0 inline-flex items-center px-2.5 py-1.5 sm:py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* メモ入力エリア */}
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={dict.tracker.notePlaceholder}
              rows={6}
              className="w-full p-3.5 text-base sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans leading-relaxed"
              autoFocus
            />
          </div>
        </div>

        {/* モーダルフッター */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setNoteText('')}
            className="min-h-[40px] sm:min-h-0 py-2 sm:py-0 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center justify-center sm:justify-start"
          >
            {currentLanguage === 'ja' ? 'メモをクリア' : 'Clear Note'}
          </button>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[40px] sm:min-h-0 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/30 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{dict.tracker.saveNote}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
