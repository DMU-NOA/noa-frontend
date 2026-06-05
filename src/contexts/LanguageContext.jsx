// src/contexts/LanguageContext.jsx
import { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // 로컬 스토리지에 저장된 언어가 있으면 가져오고, 없으면 기본값 'ko'
  const [lang, setLang] = useState(localStorage.getItem('noa_lang') || 'ko');

  const toggleLang = () => {
    const newLang = lang === 'ko' ? 'en' : 'ko';
    setLang(newLang);
    localStorage.setItem('noa_lang', newLang); // 새로고침해도 유지되게 저장!
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);