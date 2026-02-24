import { createContext, useContext, useState, ReactNode } from "react";
import { Language, t as translate } from "@/lib/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem("riskradar-lang");
    return (stored === "en" ? "en" : "sv") as Language;
  });

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("riskradar-lang", newLang);
  };

  const t = (key: string) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
