import React, { createContext, useEffect, useState } from 'react';
import { Language, translations } from '../i18n/translations';
import { LanguageMode, I18nContextType } from '../types';

export type { LanguageMode, Language };

const I18N_STORAGE_KEY = 'questrack_language_mode_v1';

export function detectSystemLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const langs = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const lang of langs) {
    if (!lang) continue;
    if (lang.toLowerCase().startsWith('ja')) {
      return 'ja';
    }
  }
  return 'en';
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageMode, setLanguageModeState] = useState<LanguageMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(I18N_STORAGE_KEY) as LanguageMode | null;
      if (saved === 'system' || saved === 'ja' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemLanguage, setSystemLanguage] = useState<Language>(() => detectSystemLanguage());

  // OS の言語変更イベント監視 (ブラウザの言語設定変更時)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleLanguageChange = () => {
      setSystemLanguage(detectSystemLanguage());
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  const currentLanguage: Language = languageMode === 'system' ? systemLanguage : languageMode;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = currentLanguage;
    document.title =
      currentLanguage === 'ja'
        ? 'Questrack - 問題追跡・復習アプリ'
        : 'Questrack - Question Tracker & Review App';
  }, [currentLanguage]);

  const setLanguageMode = (mode: LanguageMode) => {
    setLanguageModeState(mode);
    try {
      localStorage.setItem(I18N_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const dict = translations[currentLanguage] as typeof translations.ja;

  // 翻訳関数: "tracker.registeredCount", { count: 5 }
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: unknown = translations[currentLanguage];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // フォールバック (ja)
        let fallback: unknown = translations.ja;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = (fallback as Record<string, unknown>)[fbKey];
          } else {
            fallback = path;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }
    return result;
  };

  return (
    <I18nContext.Provider
      value={{
        languageMode,
        currentLanguage,
        setLanguageMode,
        t,
        dict,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export { useI18n } from './useI18n';

