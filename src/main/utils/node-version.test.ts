/**
 * feat-047: Node version parsing and comparison tests
 *
 * Tests parseNodeVersion and compareVersions with various version strings,
 * edge cases, and boundary conditions.
 */

import { describe, it, expect } from 'vitest';
import { parseNodeVersion, compareVersions, MIN_NODE_VERSION } from './installer';

describe('Node Version Utilities (feat-047)', () => {
  describe('parseNodeVersion', () => {
    describe('Valid version strings', () => {
      it('should parse standard version with v prefix', () => {
        expect(parseNodeVersion('v22.12.0')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should parse version without v prefix', () => {
        expect(parseNodeVersion('22.12.0')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should parse version 0.0.0', () => {
        expect(parseNodeVersion('v0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
      });

      it('should parse version with large numbers', () => {
        expect(parseNodeVersion('v100.200.300')).toEqual({ major: 100, minor: 200, patch: 300 });
      });

      it('should parse version with single digit components', () => {
        expect(parseNodeVersion('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      });

      it('should parse version with leading zeros treated as decimal', () => {
        // parseInt('01', 10) === 1
        expect(parseNodeVersion('v01.02.03')).toEqual({ major: 1, minor: 2, patch: 3 });
      });
    });

    describe('Versions with extra content', () => {
      it('should parse version with pre-release suffix', () => {
        expect(parseNodeVersion('v22.12.0-rc1')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should parse version with build metadata', () => {
        expect(parseNodeVersion('v22.12.0+build.123')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should parse version with pre-release and build', () => {
        expect(parseNodeVersion('v22.12.0-beta.1+build.abc')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should handle leading whitespace', () => {
        expect(parseNodeVersion('  v22.12.0')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should handle trailing whitespace', () => {
        expect(parseNodeVersion('v22.12.0  ')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should handle newline characters', () => {
        expect(parseNodeVersion('v22.12.0\n')).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should handle carriage return and newline', () => {
        expect(parseNodeVersion('v22.12.0\r\n')).toEqual({ major: 22, minor: 12, patch: 0 });
      });
    });

    describe('Invalid version strings', () => {
      it('should return null for empty string', () => {
        expect(parseNodeVersion('')).toBeNull();
      });

      it('should return null for just "v"', () => {
        expect(parseNodeVersion('v')).toBeNull();
      });

      it('should return null for text-only string', () => {
        expect(parseNodeVersion('invalid')).toBeNull();
      });

      it('should return null for single number', () => {
        expect(parseNodeVersion('22')).toBeNull();
      });

      it('should return null for two-component version', () => {
        expect(parseNodeVersion('22.12')).toBeNull();
      });

      it('should return null for non-numeric components', () => {
        expect(parseNodeVersion('abc.def.ghi')).toBeNull();
      });

      it('should return null for version with dashes instead of dots', () => {
        expect(parseNodeVersion('22-12-0')).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        expect(parseNodeVersion('   ')).toBeNull();
      });

      it('should return null for version starting with letter prefix other than v', () => {
        expect(parseNodeVersion('n22.12.0')).toBeNull();
      });
    });

    describe('Boundary values', () => {
      it('should parse minimum version correctly', () => {
        const result = parseNodeVersion(MIN_NODE_VERSION);
        expect(result).toEqual({ major: 22, minor: 12, patch: 0 });
      });

      it('should parse version v0.0.1', () => {
        expect(parseNodeVersion('v0.0.1')).toEqual({ major: 0, minor: 0, patch: 1 });
      });

      it('should parse version with large patch number', () => {
        expect(parseNodeVersion('v22.12.999')).toEqual({ major: 22, minor: 12, patch: 999 });
      });
    });
  });

  describe('compareVersions', () => {
    describe('Equal versions', () => {
      it('should return true when versions are exactly equal', () => {
        expect(compareVersions('22.12.0', '22.12.0')).toBe(true);
      });

      it('should return true when both have v prefix', () => {
        expect(compareVersions('v22.12.0', 'v22.12.0')).toBe(true);
      });

      it('should return true with mixed v prefix', () => {
        expect(compareVersions('v22.12.0', '22.12.0')).toBe(true);
      });
    });

    describe('Major version comparisons', () => {
      it('should return true when major is higher', () => {
        expect(compareVersions('v23.0.0', '22.12.0')).toBe(true);
      });

      it('should return false when major is lower', () => {
        expect(compareVersions('v21.0.0', '22.12.0')).toBe(false);
      });

      it('should return true when major is significantly higher', () => {
        expect(compareVersions('v50.0.0', '22.12.0')).toBe(true);
      });

      it('should return false when major is zero and min is non-zero', () => {
        expect(compareVersions('v0.99.99', '1.0.0')).toBe(false);
      });
    });

    describe('Minor version comparisons', () => {
      it('should return true when major equal and minor higher', () => {
        expect(compareVersions('v22.13.0', '22.12.0')).toBe(true);
      });

      it('should return false when major equal and minor lower', () => {
        expect(compareVersions('v22.11.0', '22.12.0')).toBe(false);
      });

      it('should return true when major equal and minor significantly higher', () => {
        expect(compareVersions('v22.99.0', '22.12.0')).toBe(true);
      });

      it('should return false when major equal and minor is zero vs non-zero', () => {
        expect(compareVersions('v22.0.0', '22.12.0')).toBe(false);
      });
    });

    describe('Patch version comparisons', () => {
      it('should return true when major/minor equal and patch higher', () => {
        expect(compareVersions('v22.12.1', '22.12.0')).toBe(true);
      });

      it('should return false when major/minor equal and patch lower', () => {
        expect(compareVersions('v22.12.0', '22.12.1')).toBe(false);
      });

      it('should return true when patch is significantly higher', () => {
        expect(compareVersions('v22.12.100', '22.12.0')).toBe(true);
      });

      it('should handle patch zero vs patch zero', () => {
        expect(compareVersions('v22.12.0', '22.12.0')).toBe(true);
      });
    });

    describe('Invalid inputs', () => {
      it('should return false for invalid version string', () => {
        expect(compareVersions('invalid', '22.12.0')).toBe(false);
      });

      it('should return false for invalid minVersion string', () => {
        expect(compareVersions('v22.12.0', 'invalid')).toBe(false);
      });

      it('should return false when both are invalid', () => {
        expect(compareVersions('invalid', 'also-invalid')).toBe(false);
      });

      it('should return false for empty string as version', () => {
        expect(compareVersions('', '22.12.0')).toBe(false);
      });

      it('should return false for empty string as minVersion', () => {
        expect(compareVersions('22.12.0', '')).toBe(false);
      });

      it('should return false for partial version string', () => {
        expect(compareVersions('22.12', '22.12.0')).toBe(false);
      });
    });

    describe('MIN_NODE_VERSION specific comparisons', () => {
      it('should return true for exact minimum version', () => {
        expect(compareVersions('v22.12.0', MIN_NODE_VERSION)).toBe(true);
      });

      it('should return true for version above minimum', () => {
        expect(compareVersions('v22.12.1', MIN_NODE_VERSION)).toBe(true);
      });

      it('should return false for version below minimum', () => {
        expect(compareVersions('v22.11.99', MIN_NODE_VERSION)).toBe(false);
      });

      it('should return true for next major version', () => {
        expect(compareVersions('v23.0.0', MIN_NODE_VERSION)).toBe(true);
      });

      it('should return false for previous major version', () => {
        expect(compareVersions('v21.99.99', MIN_NODE_VERSION)).toBe(false);
      });

      it('should return true for current LTS-like version', () => {
        expect(compareVersions('v22.13.0', MIN_NODE_VERSION)).toBe(true);
      });

      it('should return false for old LTS version 18.x', () => {
        expect(compareVersions('v18.20.0', MIN_NODE_VERSION)).toBe(false);
      });

      it('should return false for LTS version 20.x', () => {
        expect(compareVersions('v20.11.0', MIN_NODE_VERSION)).toBe(false);
      });
    });

    describe('Pre-release version handling', () => {
      it('should compare base version ignoring pre-release suffix', () => {
        // parseNodeVersion strips -rc1, so v22.12.0-rc1 is treated as 22.12.0
        expect(compareVersions('v22.12.0-rc1', '22.12.0')).toBe(true);
      });

      it('should compare base version with build metadata', () => {
        expect(compareVersions('v22.12.0+build.1', '22.12.0')).toBe(true);
      });
    });
  });

  describe('MIN_NODE_VERSION constant', () => {
    it('should be a valid version string', () => {
      const parsed = parseNodeVersion(MIN_NODE_VERSION);
      expect(parsed).not.toBeNull();
    });

    it('should be 22.12.0', () => {
      expect(MIN_NODE_VERSION).toBe('22.12.0');
    });

    it('should have major version 22', () => {
      const parsed = parseNodeVersion(MIN_NODE_VERSION);
      expect(parsed!.major).toBe(22);
    });

    it('should have minor version 12', () => {
      const parsed = parseNodeVersion(MIN_NODE_VERSION);
      expect(parsed!.minor).toBe(12);
    });

    it('should have patch version 0', () => {
      const parsed = parseNodeVersion(MIN_NODE_VERSION);
      expect(parsed!.patch).toBe(0);
    });
  });
});
