/**
 * feat-036 to feat-045: Packaging configuration tests
 * Verifies electron-builder config exists and is correct in package.json
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Packaging Configuration (feat-036 to feat-045)', () => {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf-8')
  );
  const buildConfig = packageJson.build;

  describe('feat-036: Application identity', () => {
    it('should have appId configured', () => {
      expect(buildConfig.appId).toBe('ai.openclaw.openclack');
    });

    it('should have productName configured', () => {
      expect(buildConfig.productName).toBe('OpenClack');
    });

    it('should have version in package.json', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('feat-037: Build output configuration', () => {
    it('should have output directory configured', () => {
      expect(buildConfig.directories.output).toBe('release');
    });

    it('should have buildResources directory configured', () => {
      expect(buildConfig.directories.buildResources).toBe('assets');
    });

    it('should include dist files', () => {
      expect(buildConfig.files).toContain('dist/**/*');
    });

    it('should include package.json', () => {
      expect(buildConfig.files).toContain('package.json');
    });

    it('should have correct main entry point in extraMetadata', () => {
      expect(buildConfig.extraMetadata.main).toBe('dist/main/main.js');
    });
  });

  describe('feat-038: macOS packaging', () => {
    it('should have macOS config', () => {
      expect(buildConfig.mac).toBeDefined();
    });

    it('should target DMG', () => {
      const dmgTarget = buildConfig.mac.target.find((t: any) => t.target === 'dmg');
      expect(dmgTarget).toBeDefined();
    });

    it('should target ZIP', () => {
      const zipTarget = buildConfig.mac.target.find((t: any) => t.target === 'zip');
      expect(zipTarget).toBeDefined();
    });

    it('should support x64 and arm64 for macOS', () => {
      const dmgTarget = buildConfig.mac.target.find((t: any) => t.target === 'dmg');
      expect(dmgTarget.arch).toContain('x64');
      expect(dmgTarget.arch).toContain('arm64');
    });

    it('should have macOS icon configured', () => {
      expect(buildConfig.mac.icon).toBe('assets/icons/icon.icns');
    });

    it('should have hardened runtime enabled', () => {
      expect(buildConfig.mac.hardenedRuntime).toBe(true);
    });

    it('should have entitlements configured', () => {
      expect(buildConfig.mac.entitlements).toBeDefined();
    });
  });

  describe('feat-039: Windows packaging', () => {
    it('should have Windows config', () => {
      expect(buildConfig.win).toBeDefined();
    });

    it('should target NSIS', () => {
      const nsisTarget = buildConfig.win.target.find((t: any) => t.target === 'nsis');
      expect(nsisTarget).toBeDefined();
    });

    it('should target MSI', () => {
      const msiTarget = buildConfig.win.target.find((t: any) => t.target === 'msi');
      expect(msiTarget).toBeDefined();
    });

    it('should support x64 and ia32 for Windows', () => {
      const nsisTarget = buildConfig.win.target.find((t: any) => t.target === 'nsis');
      expect(nsisTarget.arch).toContain('x64');
      expect(nsisTarget.arch).toContain('ia32');
    });

    it('should have Windows icon configured', () => {
      expect(buildConfig.win.icon).toBe('assets/icons/icon.ico');
    });
  });

  describe('feat-040: Linux packaging', () => {
    it('should have Linux config', () => {
      expect(buildConfig.linux).toBeDefined();
    });

    it('should target AppImage', () => {
      const appImage = buildConfig.linux.target.find((t: any) => t.target === 'AppImage');
      expect(appImage).toBeDefined();
    });

    it('should target DEB', () => {
      const deb = buildConfig.linux.target.find((t: any) => t.target === 'deb');
      expect(deb).toBeDefined();
    });

    it('should have Linux icon configured', () => {
      expect(buildConfig.linux.icon).toBe('assets/icons/icon.png');
    });

    it('should have Development category', () => {
      expect(buildConfig.linux.category).toBe('Development');
    });
  });

  describe('feat-041: Installer customization', () => {
    it('should have NSIS config for Windows', () => {
      expect(buildConfig.nsis).toBeDefined();
    });

    it('should allow directory selection in NSIS', () => {
      expect(buildConfig.nsis.allowToChangeInstallationDirectory).toBe(true);
    });

    it('should create shortcuts', () => {
      expect(buildConfig.nsis.createDesktopShortcut).toBe(true);
      expect(buildConfig.nsis.createStartMenuShortcut).toBe(true);
    });

    it('should have DMG config for macOS', () => {
      expect(buildConfig.dmg).toBeDefined();
      expect(buildConfig.dmg.contents).toBeDefined();
    });
  });

  describe('feat-042: Icon and asset configuration', () => {
    it('should have icon files referenced', () => {
      expect(buildConfig.mac.icon).toBeDefined();
      expect(buildConfig.win.icon).toBeDefined();
      expect(buildConfig.linux.icon).toBeDefined();
    });

    it('should have icons directory in assets', () => {
      const iconsDir = join(__dirname, '../../assets/icons');
      expect(existsSync(iconsDir)).toBe(true);
    });
  });

  describe('feat-043: Build scripts', () => {
    it('should have build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have package script', () => {
      expect(packageJson.scripts.package).toContain('electron-builder');
    });

    it('should have platform-specific package scripts', () => {
      expect(packageJson.scripts['package:mac']).toContain('--mac');
      expect(packageJson.scripts['package:win']).toContain('--win');
      expect(packageJson.scripts['package:linux']).toContain('--linux');
    });
  });

  describe('feat-044: Artifact naming', () => {
    it('should have artifact naming for macOS', () => {
      expect(buildConfig.mac.artifactName).toContain('${productName}');
      expect(buildConfig.mac.artifactName).toContain('${version}');
    });

    it('should have artifact naming for Windows', () => {
      expect(buildConfig.win.artifactName).toContain('${productName}');
      expect(buildConfig.win.artifactName).toContain('${version}');
    });

    it('should have artifact naming for Linux', () => {
      expect(buildConfig.linux.artifactName).toContain('${productName}');
      expect(buildConfig.linux.artifactName).toContain('${version}');
    });
  });

  describe('feat-045: Dependencies and metadata', () => {
    it('should have electron as devDependency', () => {
      expect(packageJson.devDependencies.electron).toBeDefined();
    });

    it('should have electron-builder as devDependency', () => {
      expect(packageJson.devDependencies['electron-builder']).toBeDefined();
    });

    it('should have react as dependency', () => {
      expect(packageJson.dependencies.react).toBeDefined();
    });

    it('should have react-dom as dependency', () => {
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });

    it('should have MIT license', () => {
      expect(packageJson.license).toBe('MIT');
    });

    it('should have description', () => {
      expect(packageJson.description).toBeDefined();
      expect(packageJson.description.length).toBeGreaterThan(0);
    });
  });
});
