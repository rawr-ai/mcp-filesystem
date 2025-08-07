import os from 'os';
import path from 'path';
import { test, expect } from 'bun:test';
import fs from 'fs/promises';
import { expandHome, validatePath } from '../../src/utils/path-utils.js';

test('expands tilde to home directory', () => {
  const result = expandHome('~/example');
  expect(result).toBe(path.join(os.homedir(), 'example'));
});

test('expands $VAR environment variables', () => {
  process.env.TEST_VAR = '/tmp/test';
  expect(expandHome('$TEST_VAR/file.txt')).toBe('/tmp/test/file.txt');
});

test('expands %VAR% environment variables', () => {
  process.env.TEST_VAR = '/tmp/test';
  expect(expandHome('%TEST_VAR%/file.txt')).toBe('/tmp/test/file.txt');
});

test('expands ${VAR} environment variables', () => {
  process.env.BRACED = '/var/tmp';
  expect(expandHome('${BRACED}/file.txt')).toBe('/var/tmp/file.txt');
});

test('throws on undefined environment variables', () => {
  delete process.env.UNDEFINED_VAR;
  expect(() => expandHome('$UNDEFINED_VAR/file.txt')).toThrow('Environment variable UNDEFINED_VAR is not defined');
});

test('environment variables cannot bypass symlink restrictions', async () => {
  const allowed = await fs.mkdtemp(path.join(os.tmpdir(), 'allowed-'));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'outside-'));
  const linkPath = path.join(allowed, 'link');
  await fs.symlink(outside, linkPath);
  process.env.LINK_VAR = linkPath;
  await expect(
    validatePath('$LINK_VAR/secret.txt', [allowed], new Map(), false)
  ).rejects.toThrow(/outside allowed directories/);
});
