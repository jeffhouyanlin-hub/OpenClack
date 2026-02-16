/**
 * feat-013: Responsive layout and styling system test
 * feat-059: Screen transitions test
 * feat-087-088: Dark mode test
 * Verifies CSS variables, responsive breakpoints, transitions, and dark mode exist in styles.css
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('styles.css - Design System', () => {
  const css = readFileSync(join(__dirname, './styles.css'), 'utf-8');

  describe('CSS Variables (feat-013)', () => {
    it('should define color palette variables', () => {
      expect(css).toContain('--color-primary:');
      expect(css).toContain('--color-secondary:');
      expect(css).toContain('--color-primary-dark:');
      expect(css).toContain('--color-primary-light:');
    });

    it('should define gradient variable', () => {
      expect(css).toContain('--gradient-primary:');
    });

    it('should define background color variables', () => {
      expect(css).toContain('--bg-primary:');
      expect(css).toContain('--bg-secondary:');
      expect(css).toContain('--bg-tertiary:');
      expect(css).toContain('--bg-dark:');
    });

    it('should define text color variables', () => {
      expect(css).toContain('--text-primary:');
      expect(css).toContain('--text-secondary:');
      expect(css).toContain('--text-muted:');
      expect(css).toContain('--text-light:');
    });

    it('should define status color variables', () => {
      expect(css).toContain('--color-success:');
      expect(css).toContain('--color-warning:');
      expect(css).toContain('--color-error:');
      expect(css).toContain('--color-info:');
    });

    it('should define spacing scale', () => {
      expect(css).toContain('--space-xs:');
      expect(css).toContain('--space-sm:');
      expect(css).toContain('--space-md:');
      expect(css).toContain('--space-lg:');
      expect(css).toContain('--space-xl:');
      expect(css).toContain('--space-2xl:');
    });

    it('should define font size scale', () => {
      expect(css).toContain('--font-xs:');
      expect(css).toContain('--font-sm:');
      expect(css).toContain('--font-md:');
      expect(css).toContain('--font-lg:');
      expect(css).toContain('--font-xl:');
      expect(css).toContain('--font-2xl:');
      expect(css).toContain('--font-3xl:');
      expect(css).toContain('--font-4xl:');
    });

    it('should define border radius scale', () => {
      expect(css).toContain('--radius-sm:');
      expect(css).toContain('--radius-md:');
      expect(css).toContain('--radius-lg:');
      expect(css).toContain('--radius-xl:');
      expect(css).toContain('--radius-round:');
    });

    it('should define shadow scale', () => {
      expect(css).toContain('--shadow-sm:');
      expect(css).toContain('--shadow-md:');
      expect(css).toContain('--shadow-lg:');
      expect(css).toContain('--shadow-xl:');
    });

    it('should define transition variables', () => {
      expect(css).toContain('--transition-fast:');
      expect(css).toContain('--transition-normal:');
      expect(css).toContain('--transition-slow:');
      expect(css).toContain('--transition-screen:');
    });

    it('should define z-index scale', () => {
      expect(css).toContain('--z-base:');
      expect(css).toContain('--z-above:');
      expect(css).toContain('--z-tooltip:');
      expect(css).toContain('--z-modal:');
      expect(css).toContain('--z-overlay:');
    });

    it('should define border color variables', () => {
      expect(css).toContain('--border-light:');
      expect(css).toContain('--border-default:');
      expect(css).toContain('--border-focus:');
    });
  });

  describe('Responsive Breakpoints (feat-013)', () => {
    it('should define 480px breakpoint', () => {
      expect(css).toContain('@media (max-width: 480px)');
    });

    it('should define 640px breakpoint', () => {
      expect(css).toContain('@media (max-width: 640px)');
    });

    it('should define 768px breakpoint', () => {
      expect(css).toContain('@media (max-width: 768px)');
    });

    it('should document breakpoint values', () => {
      expect(css).toContain('--breakpoint-sm: 480px');
      expect(css).toContain('--breakpoint-md: 640px');
      expect(css).toContain('--breakpoint-lg: 768px');
    });
  });

  describe('Screen Transitions (feat-059)', () => {
    it('should define screen-enter class', () => {
      expect(css).toContain('.screen-enter');
    });

    it('should define screen-enter-active class', () => {
      expect(css).toContain('.screen-enter-active');
    });

    it('should define screen-exit class', () => {
      expect(css).toContain('.screen-exit');
    });

    it('should define screen-exit-active class', () => {
      expect(css).toContain('.screen-exit-active');
    });

    it('should define fade transition classes', () => {
      expect(css).toContain('.fade-enter');
      expect(css).toContain('.fade-enter-active');
      expect(css).toContain('.fade-exit');
      expect(css).toContain('.fade-exit-active');
    });

    it('should use transition-screen variable in transition classes', () => {
      expect(css).toContain('var(--transition-screen)');
    });
  });

  describe('Dark Mode (feat-087-088)', () => {
    it('should define prefers-color-scheme dark media query', () => {
      expect(css).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should define .dark-mode class for manual toggle', () => {
      expect(css).toContain('.dark-mode');
    });

    it('should override bg-primary in dark mode', () => {
      // Check that dark mode section overrides bg variables
      const darkModeSection = css.substring(css.indexOf('.dark-mode'));
      expect(darkModeSection).toContain('--bg-primary:');
      expect(darkModeSection).toContain('--text-primary:');
    });
  });

  describe('Base Styles', () => {
    it('should have box-sizing border-box reset', () => {
      expect(css).toContain('box-sizing: border-box');
    });

    it('should set body font family', () => {
      expect(css).toContain('font-family:');
      expect(css).toContain('-apple-system');
    });

    it('should set #root to full viewport', () => {
      expect(css).toContain('width: 100vw');
      expect(css).toContain('height: 100vh');
    });

    it('should set .app to flex layout', () => {
      expect(css).toContain('.app');
      expect(css).toContain('display: flex');
    });
  });
});
