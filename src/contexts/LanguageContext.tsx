// import React, { createContext, useContext, useState } from 'react';
// import { Language, DICTIONARY, Dictionary } from '@/data/translations';

// interface LanguageContextType {
//   language: Language;
//   setLanguage: (lang: Language) => void;
//   t: Dictionary;
// }

// const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [language, setLanguage] = useState<Language>('en');

//   const value = {
//     language,
//     setLanguage,
//     t: DICTIONARY[language]
//   };

//   return (
//     <LanguageContext.Provider value={value}>
//       {children}
//     </LanguageContext.Provider>
//   );
// };

// export const useLanguage = () => {
//   const context = useContext(LanguageContext);
//   if (!context) {
//     throw new Error('useLanguage must be used within a LanguageProvider');
//   }
//   return context;
// };






import React, { createContext, useContext, useState } from 'react';
import { Language, DICTIONARY, Dictionary } from '@/data/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: DICTIONARY[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
