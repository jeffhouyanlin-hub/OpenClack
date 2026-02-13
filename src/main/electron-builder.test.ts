import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

describe('electron-builder configuration', () => {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf-8')
  );
  const buildConfig = packageJson.build;

  describe('basic configuration', () => {
    it('should have appId configured', () => {
      expect(buildConfig.appId).toBe('ai.openclaw.openclack');
    });

    it('should have productName configured', () => {
      expect(buildConfig.productName).toBe('OpenClack');
    });

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

  describe('macOS configuration', () => {
    const macConfig = buildConfig.mac;

    it('should have developer-tools category', () => {
      expect(macConfig.category).toBe('public.app-category.developer-tools');
    });

    it('should have dmg target configured', () => {
      const dmgTarget = macConfig.target.find((t: any) => t.target === 'dmg');
      expect(dmgTarget).toBeDefined();
      expect(dmgTarget.arch).toContain('x64');
      expect(dmgTarget.arch).toContain('arm64');
    });

    it('should have zip target configured', () => {
      const zipTarget = macConfig.target.find((t: any) => t.target === 'zip');
      expect(zipTarget).toBeDefined();
      expect(zipTarget.arch).toContain('x64');
      expect(zipTarget.arch).toContain('arm64');
    });

    it('should have icon path configured', () => {
      expect(macConfig.icon).toBe('assets/icon.icns');
    });

    it('should have artifact naming configured', () => {
      expect(macConfig.artifactName).toContain('${productName}');
      expect(macConfig.artifactName).toContain('${version}');
      expect(macConfig.artifactName).toContain('${arch}');
    });

    it('should have hardenedRuntime enabled', () => {
      expect(macConfig.hardenedRuntime).toBe(true);
    });

    it('should have gatekeeperAssess disabled', () => {
      expect(macConfig.gatekeeperAssess).toBe(false);
    });

    it('should have entitlements configured', () => {
      expect(macConfig.entitlements).toBe('build/entitlements.mac.plist');
      expect(macConfig.entitlementsInherit).toBe('build/entitlements.mac.plist');
    });
  });

  describe('DMG configuration', () => {
    const dmgConfig = buildConfig.dmg;

    it('should have contents configured', () => {
      expect(dmgConfig.contents).toHaveLength(2);
      expect(dmgConfig.contents[0].x).toBe(130);
      expect(dmgConfig.contents[0].y).toBe(220);
      expect(dmgConfig.contents[1].path).toBe('/Applications');
    });

    it('should have title configured', () => {
      expect(dmgConfig.title).toContain('${productName}');
      expect(dmgConfig.title).toContain('${version}');
    });

    it('should have window dimensions configured', () => {
      expect(dmgConfig.window.width).toBe(540);
      expect(dmgConfig.window.height).toBe(380);
    });
  });

  describe('Windows configuration', () => {
    const winConfig = buildConfig.win;

    it('should have nsis target configured', () => {
      const nsisTarget = winConfig.target.find((t: any) => t.target === 'nsis');
      expect(nsisTarget).toBeDefined();
      expect(nsisTarget.arch).toContain('x64');
      expect(nsisTarget.arch).toContain('ia32');
    });

    it('should have msi target configured', () => {
      const msiTarget = winConfig.target.find((t: any) => t.target === 'msi');
      expect(msiTarget).toBeDefined();
      expect(msiTarget.arch).toContain('x64');
      expect(msiTarget.arch).toContain('ia32');
    });

    it('should have icon path configured', () => {
      expect(winConfig.icon).toBe('assets/icon.ico');
    });

    it('should have publisher name configured', () => {
      expect(winConfig.publisherName).toBe('OpenClack Team');
    });

    it('should have artifact naming configured', () => {
      expect(winConfig.artifactName).toContain('${productName}');
      expect(winConfig.artifactName).toContain('${version}');
      expect(winConfig.artifactName).toContain('${arch}');
    });
  });

  describe('NSIS configuration', () => {
    const nsisConfig = buildConfig.nsis;

    it('should have oneClick disabled', () => {
      expect(nsisConfig.oneClick).toBe(false);
    });

    it('should have perMachine disabled', () => {
      expect(nsisConfig.perMachine).toBe(false);
    });

    it('should allow installation directory selection', () => {
      expect(nsisConfig.allowToChangeInstallationDirectory).toBe(true);
    });

    it('should create desktop shortcut', () => {
      expect(nsisConfig.createDesktopShortcut).toBe(true);
    });

    it('should create start menu shortcut', () => {
      expect(nsisConfig.createStartMenuShortcut).toBe(true);
    });

    it('should have shortcut name configured', () => {
      expect(nsisConfig.shortcutName).toBe('OpenClack');
    });

    it('should have installer icons configured', () => {
      expect(nsisConfig.installerIcon).toBe('assets/icon.ico');
      expect(nsisConfig.uninstallerIcon).toBe('assets/icon.ico');
      expect(nsisConfig.installerHeaderIcon).toBe('assets/icon.ico');
    });
  });

  describe('MSI configuration', () => {
    const msiConfig = buildConfig.msi;

    it('should have oneClick disabled', () => {
      expect(msiConfig.oneClick).toBe(false);
    });

    it('should have perMachine disabled', () => {
      expect(msiConfig.perMachine).toBe(false);
    });

    it('should create desktop shortcut', () => {
      expect(msiConfig.createDesktopShortcut).toBe(true);
    });

    it('should create start menu shortcut', () => {
      expect(msiConfig.createStartMenuShortcut).toBe(true);
    });

    it('should have shortcut name configured', () => {
      expect(msiConfig.shortcutName).toBe('OpenClack');
    });
  });

  describe('Linux configuration', () => {
    const linuxConfig = buildConfig.linux;

    it('should have AppImage target configured', () => {
      const appImageTarget = linuxConfig.target.find((t: any) => t.target === 'AppImage');
      expect(appImageTarget).toBeDefined();
      expect(appImageTarget.arch).toContain('x64');
      expect(appImageTarget.arch).toContain('arm64');
    });

    it('should have deb target configured', () => {
      const debTarget = linuxConfig.target.find((t: any) => t.target === 'deb');
      expect(debTarget).toBeDefined();
      expect(debTarget.arch).toContain('x64');
      expect(debTarget.arch).toContain('arm64');
    });

    it('should have category configured', () => {
      expect(linuxConfig.category).toBe('Development');
    });

    it('should have icon path configured', () => {
      expect(linuxConfig.icon).toBe('assets/icon.png');
    });

    it('should have synopsis configured', () => {
      expect(linuxConfig.synopsis).toBe('Silent installer for OpenClaw');
    });

    it('should have description configured', () => {
      expect(linuxConfig.description).toContain('OpenClack');
      expect(linuxConfig.description).toContain('OpenClaw');
    });

    it('should have desktop entry configured', () => {
      expect(linuxConfig.desktop.Name).toBe('OpenClack');
      expect(linuxConfig.desktop.Type).toBe('Application');
      expect(linuxConfig.desktop.Categories).toContain('Development');
    });

    it('should have artifact naming configured', () => {
      expect(linuxConfig.artifactName).toContain('${productName}');
      expect(linuxConfig.artifactName).toContain('${version}');
      expect(linuxConfig.artifactName).toContain('${arch}');
    });
  });

  describe('Debian package configuration', () => {
    const debConfig = buildConfig.deb;

    it('should have dependencies configured', () => {
      expect(debConfig.depends).toContain('gconf2');
      expect(debConfig.depends).toContain('libnotify4');
      expect(debConfig.depends).toContain('libnss3');
    });

    it('should have priority set', () => {
      expect(debConfig.priority).toBe('optional');
    });

    it('should have after-install script configured', () => {
      expect(debConfig.afterInstall).toBe('build/linux-after-install.sh');
    });
  });

  describe('AppImage configuration', () => {
    const appImageConfig = buildConfig.appImage;

    it('should have license configured', () => {
      expect(appImageConfig.license).toBe('MIT');
    });
  });

  describe('build files existence', () => {
    const projectRoot = join(__dirname, '../..');

    it('should have macOS entitlements file', () => {
      const entitlementsPath = join(projectRoot, 'build/entitlements.mac.plist');
      expect(existsSync(entitlementsPath)).toBe(true);
    });

    it('should have Linux post-install script', () => {
      const scriptPath = join(projectRoot, 'build/linux-after-install.sh');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('Linux post-install script should be executable', () => {
      const scriptPath = join(projectRoot, 'build/linux-after-install.sh');
      const stats = statSync(scriptPath);
      // Check if file has execute permission (for owner, group, or others)
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });
  });

  describe('package scripts', () => {
    it('should have package script', () => {
      expect(packageJson.scripts.package).toContain('electron-builder');
    });

    it('should have package:mac script', () => {
      expect(packageJson.scripts['package:mac']).toContain('electron-builder --mac');
    });

    it('should have package:win script', () => {
      expect(packageJson.scripts['package:win']).toContain('electron-builder --win');
    });

    it('should have package:linux script', () => {
      expect(packageJson.scripts['package:linux']).toContain('electron-builder --linux');
    });
  });
});
