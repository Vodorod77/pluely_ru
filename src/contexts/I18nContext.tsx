import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Locale, Translation } from "@/types/i18n";

// Import translation files
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  translations: Translation;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, Translation> = {
  en: en as Translation,
  ru: ru as Translation,
};

const LOCALE_STORAGE_KEY = "pluely_locale";

// Browser language detection
const getBrowserLocale = (): Locale => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ru")) return "ru";
  return "en"; // Default to English
};

// Get stored locale or detect from browser
const getInitialLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "ru")) {
      return stored;
    }
  } catch (error) {
    console.error("Failed to get stored locale:", error);
  }
  return getBrowserLocale();
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch (error) {
      console.error("Failed to save locale:", error);
    }
  };

  // Translation function with dot notation support
  const t = (key: string): string => {
    try {
      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = translations[locale];

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      return typeof result === "string" ? result : key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  return (
    <I18nContext.Provider
      value={{ locale, setLocale, t, translations: translations[locale] }}
    >
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

// Helper hook for simple translation
export const useTranslation = () => {
  const { t, locale } = useI18n();
  return { t, locale };
};
