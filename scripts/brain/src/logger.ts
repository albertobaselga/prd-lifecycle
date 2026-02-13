import * as fs from 'fs';
import * as nodePath from 'path';
import { getStateDir } from './persistence.js';

export function createLogger(projectRoot: string, instance?: string) {
  const logFile = nodePath.join(projectRoot, getStateDir(instance), 'brain.log');

  return {
    log(message: string): void {
      try {
        const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
        fs.appendFileSync(logFile, `[${ts}] ${message}\n`);
      } catch {
        // Silent failure — log must never crash the engine
      }
    },
  };
}
