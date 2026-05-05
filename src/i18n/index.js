// src/i18n/index.js
// Hệ thống đa ngôn ngữ — thêm ngôn ngữ mới chỉ cần thêm file mới vào thư mục này

import vi from './vi.js';
import en from './en.js';

const LANGUAGES = { vi, en };

// Lấy ngôn ngữ đang dùng (lưu trong localStorage)
export function getLang() {
  return localStorage.getItem('app_lang') || 'vi';
}

// Đổi ngôn ngữ
export function setLang(lang) {
  localStorage.setItem('app_lang', lang);
  window.dispatchEvent(new Event('langChanged'));
}

// Lấy text theo key, hỗ trợ nested key kiểu "nav.overview"
export function t(key, lang = getLang()) {
  const dict = LANGUAGES[lang] || LANGUAGES['vi'];
  const keys = key.split('.');
  let val = dict;
  for (const k of keys) {
    val = val?.[k];
    if (val === undefined) break;
  }
  // Fallback sang tiếng Việt nếu không tìm thấy
  if (val === undefined) {
    let fallback = vi;
    for (const k of keys) { fallback = fallback?.[k]; }
    return fallback ?? key;
  }
  return val;
}

// Danh sách ngôn ngữ hỗ trợ
export const SUPPORTED_LANGS = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  // Thêm ngôn ngữ mới ở đây, ví dụ:
  // { code: 'zh', label: '中文', flag: '🇨🇳' },
  // { code: 'ja', label: '日本語', flag: '🇯🇵' },
  // { code: 'ko', label: '한국어', flag: '🇰🇷' },
];
