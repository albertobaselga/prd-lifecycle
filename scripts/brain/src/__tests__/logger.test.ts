import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as nodePath from 'path';
import { createLogger } from '../logger.js';

describe('logger', () => {
  it('does not throw when log directory does not exist', () => {
    const logger = createLogger('/nonexistent/path/that/does/not/exist');
    expect(() => logger.log('test message')).not.toThrow();
  });

  it('writes ISO-timestamped entries to log file', () => {
    const tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-log-'));
    const logDir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(logDir, { recursive: true });

    const logger = createLogger(tmpDir);
    logger.log('TEST_MESSAGE hello');

    const content = fs.readFileSync(nodePath.join(logDir, 'brain.log'), 'utf-8');
    expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\] TEST_MESSAGE hello\n$/);

    fs.rmSync(tmpDir, { recursive: true });
  });
});
