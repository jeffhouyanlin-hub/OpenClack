/**
 * i18n - feat-089-090: Localization stub
 * Simple internationalization support with string lookup
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface TranslationStrings {
  [key: string]: string;
}

const translations: Record<Locale, TranslationStrings> = {
  en: {
    'app.title': 'OpenClack',
    'app.tagline': 'Silent installer for OpenClaw',
    'app.description': 'The easiest way to install OpenClaw on your system.',
    'button.install': 'Install OpenClaw',
    'button.cancel': 'Cancel Installation',
    'button.retry': 'Retry Installation',
    'button.launch': 'Launch OpenClaw',
    'button.close': 'Close',
    'button.settings': 'Configure API Keys',
    'button.save': 'Save Configuration',
    'button.skip': 'Skip for Now',
    'button.back': 'Back',
    'status.installing': 'Installing...',
    'status.complete': 'Installation Complete!',
    'status.failed': 'Installation Failed',
    'status.loading': 'Loading...',
    'log.title': 'Installation Log',
    'log.preparing': 'Preparing installation...',
  },
  es: {
    'app.title': 'OpenClack',
    'app.tagline': 'Instalador silencioso para OpenClaw',
    'button.install': 'Instalar OpenClaw',
    'button.cancel': 'Cancelar instalacion',
    'status.installing': 'Instalando...',
    'status.complete': 'Instalacion completada!',
  },
  fr: {
    'app.title': 'OpenClack',
    'app.tagline': 'Installateur silencieux pour OpenClaw',
    'button.install': 'Installer OpenClaw',
    'button.cancel': "Annuler l'installation",
    'status.installing': 'Installation en cours...',
    'status.complete': 'Installation terminee!',
  },
  de: {
    'app.title': 'OpenClack',
    'app.tagline': 'Stiller Installer fuer OpenClaw',
    'button.install': 'OpenClaw installieren',
    'button.cancel': 'Installation abbrechen',
    'status.installing': 'Wird installiert...',
    'status.complete': 'Installation abgeschlossen!',
  },
  ja: {
    'app.title': 'OpenClack',
    'button.install': 'OpenClaw をインストール',
    'status.installing': 'インストール中...',
  },
  zh: {
    'app.title': 'OpenClack',
    'button.install': '安装 OpenClaw',
    'status.installing': '正在安装...',
  },
};

let currentLocale: Locale = 'en';

/**
 * Sets the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Gets the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Gets a translated string for the given key
 * Falls back to English if key not found in current locale
 */
export function t(key: string): string {
  const localeStrings = translations[currentLocale];
  if (localeStrings && localeStrings[key]) {
    return localeStrings[key];
  }
  // Fallback to English
  const enStrings = translations['en'];
  if (enStrings && enStrings[key]) {
    return enStrings[key];
  }
  // Return the key itself as last resort
  return key;
}

/**
 * Gets all available locales
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Checks if a locale is supported
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return locale in translations;
}
