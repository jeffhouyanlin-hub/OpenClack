/**
 * Update Checker - feat-083-084: Auto-update stub
 * Checks for application updates (stub implementation)
 */

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

/**
 * Gets the current application version from package.json
 */
export function getCurrentVersion(): string {
  // In production this would read from electron app.getVersion()
  return '1.0.0';
}

/**
 * Checks for available updates (stub)
 * In production, this would check a remote server
 */
export async function checkForUpdates(currentVersion?: string): Promise<UpdateInfo> {
  const version = currentVersion || getCurrentVersion();
  // Stub: always returns no update available
  return {
    available: false,
    currentVersion: version,
  };
}

/**
 * Compares two semver version strings
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

/**
 * Determines if an update should be auto-installed
 */
export function shouldAutoUpdate(updateInfo: UpdateInfo, autoUpdateEnabled: boolean): boolean {
  return updateInfo.available && autoUpdateEnabled;
}
