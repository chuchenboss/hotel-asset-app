// src/i18n/useTranslation.js
// Hook dùng trong mọi component — tự động re-render khi đổi ngôn ngữ

import { useState, useEffect, useCallback } from 'react';
import { getLang, setLang, t, SUPPORTED_LANGS } from './index.js';

export function useTranslation() {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    const handler = () => setLangState(getLang());
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    setLangState(newLang);
  }, []);

  // Trả về hàm translate đã bind sẵn ngôn ngữ hiện tại
  const translate = useCallback((key) => t(key, lang), [lang]);

  return { t: translate, lang, changeLang, SUPPORTED_LANGS };
}


// ---- Language Switcher Component ----
// Dùng được ở bất kỳ chỗ nào trong app
export function LanguageSwitcher({ style = {} }) {
  const { lang, changeLang, SUPPORTED_LANGS } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', ...style }}>
      {SUPPORTED_LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          title={l.label}
          style={{
            padding: '4px 10px',
            borderRadius: 7,
            border: '1px solid',
            borderColor: lang === l.code ? '#1D9E75' : 'var(--border)',
            background: lang === l.code ? '#E1F5EE' : 'var(--white)',
            color: lang === l.code ? '#0F6E56' : 'var(--text2)',
            fontWeight: lang === l.code ? 600 : 400,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          <span>{l.flag}</span>
          <span>{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
