import { spawn } from 'child_process';
import { detectNodeVersion, detectOpenClawVersion, MIN_NODE_VERSION } from './installer';

export interface APIKeyValidation {
  valid: boolean;
  provider: string;
  error?: string;
}

export function validateAnthropicKey(key: string): APIKeyValidation {
  if (!key || !key.trim()) {
    return { valid: false, provider: 'anthropic', error: 'API key is empty' };
  }
  if (!key.startsWith('sk-ant-')) {
    return { valid: false, provider: 'anthropic', error: 'Anthropic API key should start with "sk-ant-"' };
  }
  if (key.length < 20) {
    return { valid: false, provider: 'anthropic', error: 'API key is too short' };
  }
  if (!/^sk-ant-[a-zA-Z0-9_-]+$/.test(key)) {
    return { valid: false, provider: 'anthropic', error: 'API key contains invalid characters' };
  }
  return { valid: true, provider: 'anthropic' };
}

export function validateOpenAIKey(key: string): APIKeyValidation {
  if (!key || !key.trim()) {
    return { valid: false, provider: 'openai', error: 'API key is empty' };
  }
  if (!key.startsWith('sk-')) {
    return { valid: false, provider: 'openai', error: 'OpenAI API key should start with "sk-"' };
  }
  if (key.length < 20) {
    return { valid: false, provider: 'openai', error: 'API key is too short' };
  }
  if (!/^sk-[a-zA-Z0-9_-]+$/.test(key)) {
    return { valid: false, provider: 'openai', error: 'API key contains invalid characters' };
  }
  return { valid: true, provider: 'openai' };
}

export function validateAPIKey(provider: string, key: string): APIKeyValidation {
  if (!key || !key.trim()) {
    return { valid: false, provider, error: 'API key is empty' };
  }

  switch (provider.toLowerCase()) {
    case 'anthropic':
      return validateAnthropicKey(key);
    case 'openai':
      return validateOpenAIKey(key);
    default:
      // Generic validation for other providers
      if (key.length < 10) {
        return { valid: false, provider, error: 'API key is too short' };
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(key)) {
        return { valid: false, provider, error: 'API key contains invalid characters' };
      }
      return { valid: true, provider };
  }
}

export interface NodeVerification {
  installed: boolean;
  version: string | null;
  meetsRequirement: boolean;
  npmAvailable: boolean;
  error?: string;
}

export async function verifyNodeInstallation(): Promise<NodeVerification> {
  const nodeResult = await detectNodeVersion();

  if (!nodeResult.installed) {
    return {
      installed: false,
      version: null,
      meetsRequirement: false,
      npmAvailable: false,
      error: 'Node.js is not installed',
    };
  }

  if (!nodeResult.meetsRequirement) {
    return {
      installed: true,
      version: nodeResult.version,
      meetsRequirement: false,
      npmAvailable: false,
      error: `Node.js ${nodeResult.version} does not meet minimum requirement of ${MIN_NODE_VERSION}`,
    };
  }

  // Check npm availability
  const npmAvailable = await checkNpmAvailable();

  return {
    installed: true,
    version: nodeResult.version,
    meetsRequirement: true,
    npmAvailable,
    error: npmAvailable ? undefined : 'npm is not available',
  };
}

async function checkNpmAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn('npm', ['--version']);
      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        resolve(code === 0 && stdout.trim().length > 0);
      });

      child.on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

export interface OpenClawVerification {
  installed: boolean;
  version: string | null;
  commandInPath: boolean;
  error?: string;
}

export async function verifyOpenClawInstallation(): Promise<OpenClawVerification> {
  const version = await detectOpenClawVersion();

  if (!version) {
    return {
      installed: false,
      version: null,
      commandInPath: false,
      error: 'OpenClaw is not installed or not found in PATH',
    };
  }

  return {
    installed: true,
    version,
    commandInPath: true,
  };
}

export interface ExistingInstallation {
  nodeInstalled: boolean;
  nodeVersion: string | null;
  nodeMeetsRequirement: boolean;
  openclawInstalled: boolean;
  openclawVersion: string | null;
  needsNodeInstall: boolean;
  needsOpenclawInstall: boolean;
}

export async function checkExistingInstallation(): Promise<ExistingInstallation> {
  const [nodeResult, openclawVersion] = await Promise.all([
    detectNodeVersion(),
    detectOpenClawVersion(),
  ]);

  return {
    nodeInstalled: nodeResult.installed,
    nodeVersion: nodeResult.version,
    nodeMeetsRequirement: nodeResult.meetsRequirement,
    openclawInstalled: openclawVersion !== null,
    openclawVersion,
    needsNodeInstall: !nodeResult.installed || !nodeResult.meetsRequirement,
    needsOpenclawInstall: openclawVersion === null,
  };
}
