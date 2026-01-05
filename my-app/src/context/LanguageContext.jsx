import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Check local storage or default to 'en'
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');

  const switchLanguage = (code) => {
    setLang(code);
    localStorage.setItem('app_lang', code);
  };

  const t = translations[lang]; // The active dictionary

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);