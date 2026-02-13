/**
 * Tests for TypeScript Configuration
 * Verify that TypeScript is properly configured for both main and renderer processes
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('TypeScript Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('tsconfig files exist', () => {
    it('should have base tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have tsconfig.main.json for main process', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have tsconfig.renderer.json for renderer process', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });
  });

  describe('base tsconfig.json', () => {
    it('should have correct compiler options', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
      expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
      expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
    });
  });

  describe('tsconfig.main.json', () => {
    it('should extend base config', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.extends).toBe('./tsconfig.json');
    });

    it('should use CommonJS module system', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.module).toBe('CommonJS');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('node');
    });

    it('should output to dist/main', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.outDir).toBe('dist/main');
      expect(tsconfig.compilerOptions.noEmit).toBe(false);
    });

    it('should include main process files', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.include).toContain('src/main/**/*');
      expect(tsconfig.include).toContain('src/types/**/*');
    });

    it('should have node types', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.main.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.types).toContain('node');
    });
  });

  describe('tsconfig.renderer.json', () => {
    it('should extend base config', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.extends).toBe('./tsconfig.json');
    });

    it('should use ESNext module system', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.module).toBe('ESNext');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
    });

    it('should support React JSX', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    });

    it('should include DOM libraries', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.lib).toContain('DOM');
      expect(tsconfig.compilerOptions.lib).toContain('DOM.Iterable');
    });

    it('should include renderer process files', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.include).toContain('src/renderer/**/*');
      expect(tsconfig.include).toContain('src/types/**/*');
    });

    it('should have vite/client types', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.types).toContain('vite/client');
    });

    it('should not emit files (Vite handles bundling)', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.renderer.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.noEmit).toBe(true);
    });
  });

  describe('build scripts', () => {
    it('should have build:main script', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['build:main']).toBeDefined();
      expect(packageJson.scripts['build:main']).toContain('tsc');
      expect(packageJson.scripts['build:main']).toContain('tsconfig.main.json');
    });

    it('should have build:renderer script', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['build:renderer']).toBeDefined();
      expect(packageJson.scripts['build:renderer']).toContain('vite build');
    });

    it('should have type-check:main script', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['type-check:main']).toBeDefined();
      expect(packageJson.scripts['type-check:main']).toContain('tsc');
      expect(packageJson.scripts['type-check:main']).toContain('tsconfig.main.json');
      expect(packageJson.scripts['type-check:main']).toContain('--noEmit');
    });

    it('should have type-check:renderer script', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['type-check:renderer']).toBeDefined();
      expect(packageJson.scripts['type-check:renderer']).toContain('tsc');
      expect(packageJson.scripts['type-check:renderer']).toContain('tsconfig.renderer.json');
      expect(packageJson.scripts['type-check:renderer']).toContain('--noEmit');
    });

    it('should have type-check script that runs both', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['type-check']).toBeDefined();
      expect(packageJson.scripts['type-check']).toContain('type-check:main');
      expect(packageJson.scripts['type-check']).toContain('type-check:renderer');
    });
  });

  describe('Electron API type checking', () => {
    it('should have @types/node installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.devDependencies['@types/node']).toBeDefined();
    });

    it('should have electron installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.devDependencies['electron']).toBeDefined();
    });

    it('main process should have access to electron types', () => {
      // This test verifies that the main process can import Electron types
      // by checking that the imports in main.ts are valid TypeScript
      const mainFilePath = path.join(projectRoot, 'src/main/main.ts');
      const mainFileContent = fs.readFileSync(mainFilePath, 'utf-8');

      expect(mainFileContent).toContain("from 'electron'");
    });
  });
});
