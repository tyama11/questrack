import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  detail,
  confirmText,
  cancelText,
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { dict } = useI18n();

  if (!isOpen) return null;

  const actualConfirmText = confirmText || dict.common.confirm;
  const actualCancelText = cancelText || dict.common.cancel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
            }`}
          >
            {variant === 'danger' && <Trash2 className="w-6 h-6" />}
            {variant === 'warning' && <AlertTriangle className="w-6 h-6" />}
            {variant === 'primary' && <CheckCircle2 className="w-6 h-6" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-snug">
              {message}
            </p>
            {detail && (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {detail}
              </p>
            )}
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            {actualCancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'
            }`}
          >
            {actualConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
