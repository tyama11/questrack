import { Language } from '../i18n/translations';

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
