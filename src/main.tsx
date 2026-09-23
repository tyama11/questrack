import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider, ThemeProvider, I18nProvider } from './context';
import './index.css';

// 初期ロード時のFOUC（スタイルちらつき）防止
try {
  const savedTheme = localStorage.getItem('questrack_theme_mode_v1');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark) || (savedTheme === 'system' && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch {
  // ignore
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
