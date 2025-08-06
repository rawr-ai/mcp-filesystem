import os from 'os';
import path from 'path';
import { test, expect } from 'bun:test';
import { expandHome } from '../../src/utils/path-utils.js';

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
