import { AppLanguage, TranslationSet } from './types';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { zh } from './zh';

export * from './types';

export const TRANSLATIONS: Record<AppLanguage, TranslationSet> = {
  en,
  es,
  fr,
  de,
  zh
};

export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('gloko_app_language');
  if (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'de' || saved === 'zh') {
    return saved as AppLanguage;
  }
  return 'en';
}

export function getTranslation(): TranslationSet {
  const lang = getAppLanguage();
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

export function getTranslatedOcean(name: string, lang: AppLanguage): string {
  const translations: Record<string, Record<Exclude<AppLanguage, 'en'>, string>> = {
    'Arctic Ocean': {
      es: 'Océano Ártico',
      fr: 'Océan Arctique',
      de: 'Arktischer Ozean',
      zh: '北冰洋'
    },
    'Pacific Ocean': {
      es: 'Océano Pacífico',
      fr: 'Océan Pacifique',
      de: 'Pazifischer Ozean',
      zh: '太平洋'
    },
    'Atlantic Ocean': {
      es: 'Océano Atlántico',
      fr: 'Océan Atlantique',
      de: 'Atlantischer Ozean',
      zh: '大西洋'
    },
    'Indian Ocean': {
      es: 'Océano Índico',
      fr: 'Océan Indien',
      de: 'Indischer Ozean',
      zh: '印度洋'
    },
    'Southern Ocean': {
      es: 'Océano Antártico',
      fr: 'Océan Austral',
      de: 'Südlicher Ozean',
      zh: '南冰洋'
    }
  };
  if (lang === 'en') return name;
  return translations[name]?.[lang as Exclude<AppLanguage, 'en'>] || name;
}
