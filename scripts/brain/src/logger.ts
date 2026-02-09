import * as fs from 'fs';
import * as nodePath from 'path';

export function createLogger(projectRoot: string) {
  const logFile = nodePath.join(projectRoot, 'prd-lifecycle/brain.log');

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
