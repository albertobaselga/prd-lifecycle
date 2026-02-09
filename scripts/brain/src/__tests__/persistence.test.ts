import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as nodePath from 'path';
import { readState, writeState, initializeProject } from '../persistence.js';
import workflow from '../../../../workflow.json';

describe('persistence', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns null when state.json missing', () => {
    expect(readState(tmpDir)).toBeNull();
  });

  it('throws on corrupt JSON', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(nodePath.join(dir, 'state.json'), '{broken');
    expect(() => readState(tmpDir)).toThrow();
  });

  it('throws on empty (0-byte) file', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(nodePath.join(dir, 'state.json'), '');
    expect(() => readState(tmpDir)).toThrow();
  });

  it('atomic write leaves no .tmp files', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    writeState(tmpDir, { value: { specification: 'init' }, context: {}, status: 'active' });
    const files = fs.readdirSync(dir);
    expect(files.filter(f => f.endsWith('.tmp'))).toEqual([]);
    expect(files).toContain('state.json');
  });

  it('roundtrip preserves data', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    const snapshot = { value: { execution: { sprint: 'build' } }, context: { team_name: 'test' }, status: 'active' };
    writeState(tmpDir, snapshot);
    const loaded = readState(tmpDir);
    expect(loaded).toEqual(snapshot);
  });

  it('initializeProject creates scaffold and state.json', () => {
    initializeProject(tmpDir, workflow as any);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/arch'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/specs'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/data'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/sprints'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/release'))).toBe(true);
    const state = readState(tmpDir);
    expect(state.value).toEqual({ specification: 'init' });
    expect(state.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('initializeProject creates learnings.md with correct header', () => {
    initializeProject(tmpDir, workflow as any);
    const content = fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/learnings.md'), 'utf-8');
    expect(content).toContain('# ACE Learnings');
  });

  it('initializeProject fails when state.json already exists', () => {
    initializeProject(tmpDir, workflow as any);
    expect(() => initializeProject(tmpDir, workflow as any)).toThrow(/already exists/);
  });
});
