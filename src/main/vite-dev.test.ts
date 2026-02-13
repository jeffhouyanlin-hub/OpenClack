import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Vite Dev Server Configuration', () => {
  const projectRoot = resolve(__dirname, '../..');
  const viteConfigPath = resolve(projectRoot, 'vite.config.ts');

  it('should have vite.config.ts file', () => {
    expect(existsSync(viteConfigPath)).toBe(true);
  });

  it('should have Vite configured for React with TypeScript', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain('@vitejs/plugin-react');
    expect(viteConfig).toContain('react()');
  });

  it('should have dev server configured on port 5173', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain('port: 5173');
  });

  it('should have strictPort enabled to prevent port conflicts', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain('strictPort: true');
  });

  it('should have HMR configured', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain('hmr');
  });

  it('should have root set to src/renderer', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain("root: 'src/renderer'");
  });

  it('should have base path set to ./', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain("base: './'");
  });

  it('should have build output configured to dist/renderer', () => {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain("outDir: '../../dist/renderer'");
  });
});

describe('Development Scripts Configuration', () => {
  const projectRoot = resolve(__dirname, '../..');
  const packageJsonPath = resolve(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  it('should have dev:renderer script', () => {
    expect(packageJson.scripts['dev:renderer']).toBeDefined();
    expect(packageJson.scripts['dev:renderer']).toContain('vite');
  });

  it('should have dev:main script with watch mode', () => {
    expect(packageJson.scripts['dev:main']).toBeDefined();
    expect(packageJson.scripts['dev:main']).toContain('--watch');
  });

  it('should have dev:electron script', () => {
    expect(packageJson.scripts['dev:electron']).toBeDefined();
  });

  it('should have dev script using concurrently', () => {
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.dev).toContain('concurrently');
  });

  it('should run all three processes in dev script', () => {
    const devScript = packageJson.scripts.dev;
    expect(devScript).toContain('dev:main');
    expect(devScript).toContain('dev:renderer');
    expect(devScript).toContain('dev:electron');
  });

  it('should have concurrently installed as devDependency', () => {
    expect(packageJson.devDependencies.concurrently).toBeDefined();
  });
});

describe('Main Process Dev URL Loading', () => {
  const projectRoot = resolve(__dirname, '../..');
  const mainTsPath = resolve(projectRoot, 'src/main/main.ts');

  it('should load from dev server in development mode', () => {
    const mainTs = readFileSync(mainTsPath, 'utf-8');
    expect(mainTs).toContain("loadURL('http://localhost:5173')");
  });

  it('should check NODE_ENV for development mode', () => {
    const mainTs = readFileSync(mainTsPath, 'utf-8');
    expect(mainTs).toContain("process.env.NODE_ENV === 'development'");
  });

  it('should load from file in production mode', () => {
    const mainTs = readFileSync(mainTsPath, 'utf-8');
    expect(mainTs).toContain('loadFile');
  });

  it('should open DevTools in development mode', () => {
    const mainTs = readFileSync(mainTsPath, 'utf-8');
    expect(mainTs).toContain('openDevTools()');
  });
});

describe('Hot Module Replacement Support', () => {
  const projectRoot = resolve(__dirname, '../..');
  const viteConfigPath = resolve(projectRoot, 'vite.config.ts');
  const viteConfig = readFileSync(viteConfigPath, 'utf-8');

  it('should have HMR host configured', () => {
    expect(viteConfig).toContain('host:');
  });

  it('should have HMR port configured', () => {
    expect(viteConfig).toContain('port: 5173');
  });
});
