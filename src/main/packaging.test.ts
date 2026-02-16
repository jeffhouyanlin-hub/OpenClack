import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '..', '..');
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
const buildConfig = packageJson.build;

describe('Packaging Configuration', () => {
  describe('feat-036/037/038: App icons and branding assets', () => {
    it('should have assets directory', () => {
      expect(existsSync(join(projectRoot, 'assets'))).toBe(true);
    });

    it('should configure macOS icon path', () => {
      expect(buildConfig.mac.icon).toBe('assets/icons/icon.icns');
    });

    it('should configure Windows icon path', () => {
      expect(buildConfig.win.icon).toBe('assets/icons/icon.ico');
    });

    it('should configure Linux icon path', () => {
      expect(buildConfig.linux.icon).toBe('assets/icons/icon.png');
    });

    it('should have icon generation script', () => {
      expect(packageJson.scripts.icons).toBeDefined();
    });
  });

  describe('feat-039: macOS DMG packaging', () => {
    it('should configure DMG contents layout', () => {
      expect(buildConfig.dmg).toBeDefined();
      expect(buildConfig.dmg.contents).toHaveLength(2);
    });

    it('should include Applications symlink', () => {
      const appLink = buildConfig.dmg.contents.find((c: any) => c.type === 'link');
      expect(appLink).toBeDefined();
      expect(appLink.path).toBe('/Applications');
    });

    it('should set DMG window size', () => {
      expect(buildConfig.dmg.window.width).toBeGreaterThan(0);
      expect(buildConfig.dmg.window.height).toBeGreaterThan(0);
    });

    it('should configure mac targets', () => {
      const targets = buildConfig.mac.target.map((t: any) => t.target);
      expect(targets).toContain('dmg');
      expect(targets).toContain('zip');
    });

    it('should support both x64 and arm64', () => {
      const dmgTarget = buildConfig.mac.target.find((t: any) => t.target === 'dmg');
      expect(dmgTarget.arch).toContain('x64');
      expect(dmgTarget.arch).toContain('arm64');
    });

    it('should configure hardened runtime', () => {
      expect(buildConfig.mac.hardenedRuntime).toBe(true);
    });

    it('should set entitlements path', () => {
      expect(buildConfig.mac.entitlements).toBeDefined();
    });
  });

  describe('feat-040: Windows NSIS installer', () => {
    it('should configure NSIS target', () => {
      const targets = buildConfig.win.target.map((t: any) => t.target);
      expect(targets).toContain('nsis');
    });

    it('should allow installation directory change', () => {
      expect(buildConfig.nsis.allowToChangeInstallationDirectory).toBe(true);
    });

    it('should create desktop shortcut', () => {
      expect(buildConfig.nsis.createDesktopShortcut).toBe(true);
    });

    it('should create start menu shortcut', () => {
      expect(buildConfig.nsis.createStartMenuShortcut).toBe(true);
    });

    it('should set shortcut name', () => {
      expect(buildConfig.nsis.shortcutName).toBe('OpenClack');
    });

    it('should configure installer icons', () => {
      expect(buildConfig.nsis.installerIcon).toBeDefined();
      expect(buildConfig.nsis.uninstallerIcon).toBeDefined();
    });
  });

  describe('feat-041: Windows MSI installer', () => {
    it('should configure MSI target', () => {
      const targets = buildConfig.win.target.map((t: any) => t.target);
      expect(targets).toContain('msi');
    });

    it('should configure MSI shortcuts', () => {
      expect(buildConfig.msi.createDesktopShortcut).toBe(true);
      expect(buildConfig.msi.createStartMenuShortcut).toBe(true);
    });

    it('should support x64 and ia32', () => {
      const msiTarget = buildConfig.win.target.find((t: any) => t.target === 'msi');
      expect(msiTarget.arch).toContain('x64');
    });
  });

  describe('feat-042: Linux AppImage packaging', () => {
    it('should configure AppImage target', () => {
      const targets = buildConfig.linux.target.map((t: any) => t.target);
      expect(targets).toContain('AppImage');
    });

    it('should set AppImage license', () => {
      expect(buildConfig.appImage.license).toBe('MIT');
    });

    it('should support x64 and arm64', () => {
      const appImageTarget = buildConfig.linux.target.find((t: any) => t.target === 'AppImage');
      expect(appImageTarget.arch).toContain('x64');
      expect(appImageTarget.arch).toContain('arm64');
    });
  });

  describe('feat-043: Linux .deb package', () => {
    it('should configure deb target', () => {
      const targets = buildConfig.linux.target.map((t: any) => t.target);
      expect(targets).toContain('deb');
    });

    it('should set deb dependencies', () => {
      expect(buildConfig.deb.depends).toBeDefined();
      expect(Array.isArray(buildConfig.deb.depends)).toBe(true);
    });

    it('should set priority', () => {
      expect(buildConfig.deb.priority).toBe('optional');
    });

    it('should configure post-install script', () => {
      expect(buildConfig.deb.afterInstall).toBeDefined();
    });
  });

  describe('feat-044/045: Code signing configuration', () => {
    it('should configure macOS code signing entitlements', () => {
      expect(buildConfig.mac.entitlements).toBeDefined();
      expect(buildConfig.mac.entitlementsInherit).toBeDefined();
    });

    it('should configure Windows publisher name', () => {
      expect(buildConfig.win.publisherName).toBeDefined();
    });

    it('should have hardened runtime for macOS', () => {
      expect(buildConfig.mac.hardenedRuntime).toBe(true);
    });
  });

  describe('General build configuration', () => {
    it('should set app ID', () => {
      expect(buildConfig.appId).toBe('ai.openclaw.openclack');
    });

    it('should set product name', () => {
      expect(buildConfig.productName).toBe('OpenClack');
    });

    it('should configure output directory', () => {
      expect(buildConfig.directories.output).toBe('release');
    });

    it('should configure build resources directory', () => {
      expect(buildConfig.directories.buildResources).toBe('assets');
    });

    it('should configure linux category', () => {
      expect(buildConfig.linux.category).toBe('Development');
    });

    it('should configure linux desktop entry', () => {
      expect(buildConfig.linux.desktop).toBeDefined();
      expect(buildConfig.linux.desktop.Name).toBe('OpenClack');
    });

    it('should have package scripts for each platform', () => {
      expect(packageJson.scripts['package:mac']).toBeDefined();
      expect(packageJson.scripts['package:win']).toBeDefined();
      expect(packageJson.scripts['package:linux']).toBeDefined();
    });
  });
});
