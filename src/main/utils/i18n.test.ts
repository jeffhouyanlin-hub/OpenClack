/**
 * feat-089-090: Localization / i18n tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  t,
  setLocale,
  getLocale,
  getAvailableLocales,
  isLocaleSupported,
} from './i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('en');
  });

  describe('t (translate)', () => {
    it('should return English string by default', () => {
      expect(t('app.title')).toBe('OpenClack');
    });

    it('should return translated string for known key', () => {
      expect(t('button.install')).toBe('Install OpenClaw');
    });

    it('should return the key itself for unknown keys', () => {
      expect(t('unknown.key.here')).toBe('unknown.key.here');
    });

    it('should return translated string in different locale', () => {
      setLocale('es');
      expect(t('button.install')).toBe('Instalar OpenClaw');
    });

    it('should fall back to English for missing keys in other locales', () => {
      setLocale('es');
      expect(t('button.launch')).toBe('Launch OpenClaw');
    });

    it('should support French locale', () => {
      setLocale('fr');
      expect(t('button.install')).toBe('Installer OpenClaw');
    });

    it('should support German locale', () => {
      setLocale('de');
      expect(t('button.install')).toBe('OpenClaw installieren');
    });
  });

  describe('setLocale / getLocale', () => {
    it('should default to en', () => {
      expect(getLocale()).toBe('en');
    });

    it('should change locale', () => {
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });
  });

  describe('getAvailableLocales', () => {
    it('should return array of locales', () => {
      const locales = getAvailableLocales();
      expect(Array.isArray(locales)).toBe(true);
      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('fr');
      expect(locales).toContain('de');
    });

    it('should include at least 4 locales', () => {
      const locales = getAvailableLocales();
      expect(locales.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('isLocaleSupported', () => {
    it('should return true for supported locales', () => {
      expect(isLocaleSupported('en')).toBe(true);
      expect(isLocaleSupported('es')).toBe(true);
      expect(isLocaleSupported('fr')).toBe(true);
    });

    it('should return false for unsupported locales', () => {
      expect(isLocaleSupported('xx')).toBe(false);
      expect(isLocaleSupported('klingon')).toBe(false);
    });
  });
});
