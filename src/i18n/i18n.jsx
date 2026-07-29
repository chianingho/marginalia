// src/i18n/i18n.jsx
// 極簡執行時 i18n(方案 C):無外部套件,一個 context + t() + 切換。
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { strings, LOCALES, DEFAULT_LOCALE } from './strings';

const STORAGE_KEY = 'marginalia.locale';
const LocaleContext = createContext(null);

// 初始 locale:localStorage > 瀏覽器語言(zh* → zh)> 預設 en
function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.includes(saved)) return saved;
  } catch (_) { /* 隱私模式等,忽略 */ }
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : DEFAULT_LOCALE;
}

// 依 'a.b.c' 取值;找不到回 undefined
function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// {name} 內插
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch (_) { /* 忽略 */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (LOCALES.includes(next)) setLocaleState(next);
  }, []);

  // t('login.tagline') / t('shelf.count', { n: 3 });找不到 key 回退 en,再回退 key 本身
  const t = useCallback((key, vars) => {
    let val = resolve(strings[locale], key);
    if (val == null) val = resolve(strings[DEFAULT_LOCALE], key);
    if (val == null) {
      if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    return interpolate(val, vars);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within <LocaleProvider>');
  return ctx;
}

// 便利:只要 t
export function useT() {
  return useLocale().t;
}

// 語言切換(可放 header 或設定;樣式自行接 token)
export function LocaleToggle({ className }) {
  const { locale, setLocale } = useLocale();
  return (
    <button
      type="button"
      className={className}
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
      aria-label={locale === 'zh' ? 'Switch to English' : '切換為中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  );
}
