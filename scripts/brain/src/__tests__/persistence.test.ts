import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as nodePath from 'path';
import { readState, writeState, initializeProject, isLegacyFormat, migrateLegacyState } from '../persistence.js';
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

describe('isLegacyFormat', () => {
  it('returns true for old brain.sh format', () => {
    expect(isLegacyFormat({ phase: 'execution', step: 'sprint_build', status: 'active' })).toBe(true);
  });

  it('returns false for XState snapshot format', () => {
    expect(isLegacyFormat({ value: { specification: 'init' }, context: {}, status: 'active' })).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isLegacyFormat(null)).toBe(false);
    expect(isLegacyFormat(undefined)).toBe(false);
  });
});

describe('migrateLegacyState', () => {
  it('converts specification.init', () => {
    const legacy = { phase: 'specification', step: 'init', status: 'active', team_name: '', created_at: '' };
    const result = migrateLegacyState(legacy);
    expect(result.value).toEqual({ specification: 'init' });
    expect(result.context.team_name).toBe('');
    expect(result.historyValue).toEqual({});
    expect(result.children).toEqual({});
  });

  it('converts execution.phase1_complete (non-sprint execution step)', () => {
    const legacy = { phase: 'execution', step: 'phase1_complete', status: 'active' };
    const result = migrateLegacyState(legacy);
    expect(result.value).toEqual({ execution: 'phase1_complete' });
  });

  it('converts execution sprint steps — strips sprint_ prefix', () => {
    const cases = [
      { step: 'sprint_setup', expected: { execution: { sprint: 'setup' } } },
      { step: 'sprint_build', expected: { execution: { sprint: 'build' } } },
      { step: 'sprint_build_done', expected: { execution: { sprint: 'build_done' } } },
      { step: 'sprint_verify', expected: { execution: { sprint: 'verify' } } },
      { step: 'sprint_verify_done', expected: { execution: { sprint: 'verify_done' } } },
      { step: 'sprint_arch_review', expected: { execution: { sprint: 'arch_review' } } },
      { step: 'sprint_arch_done', expected: { execution: { sprint: 'arch_done' } } },
      { step: 'sprint_review_done', expected: { execution: { sprint: 'review_done' } } },
      { step: 'sprint_retro_done', expected: { execution: { sprint: 'retro_done' } } },
    ];
    for (const { step, expected } of cases) {
      const result = migrateLegacyState({ phase: 'execution', step, status: 'active' });
      expect(result.value).toEqual(expected);
    }
  });

  it('converts release states', () => {
    expect(migrateLegacyState({ phase: 'release', step: 'release_started', status: 'active' }).value)
      .toEqual({ release: 'release_started' });
    expect(migrateLegacyState({ phase: 'release', step: 'release_done', status: 'active' }).value)
      .toEqual({ release: 'release_done' });
  });

  it('converts completed state', () => {
    const result = migrateLegacyState({ phase: 'completed', step: 'completed', status: 'done' });
    expect(result.value).toBe('completed');
    expect(result.status).toBe('done');
  });

  it('extracts all context fields from the supermanager state', () => {
    const legacy = {
      phase: 'execution',
      step: 'sprint_review_done',
      status: 'active',
      current_sprint: 3,
      team_name: 'inherited-dazzling-sunbeam',
      epics_completed: ['E1', 'E2', 'E3'],
      epics_remaining: ['E4', 'E5', 'E6'],
      created_at: '2026-02-09T00:33:46Z',
      has_ai_ml: false,
      has_analytics: true,
      has_frontend_ui: true,
      current_epic: 'E3',
      sprint_1_completed_at: '2026-02-09T12:00:00Z',
      sprint_2_completed_at: '2026-02-09T18:00:00Z',
      sprint_2_decision: 'GO',
      sprint_3_completed_at: '2026-02-09T19:25:00Z',
      sprint_3_decision: 'GO',
    };
    const result = migrateLegacyState(legacy);
    expect(result.value).toEqual({ execution: { sprint: 'review_done' } });
    expect(result.context).toEqual({
      team_name: 'inherited-dazzling-sunbeam',
      current_sprint: 3,
      current_epic: 'E3',
      epics_completed: ['E1', 'E2', 'E3'],
      epics_remaining: ['E4', 'E5', 'E6'],
      has_ai_ml: false,
      has_analytics: true,
      has_frontend_ui: true,
      created_at: '2026-02-09T00:33:46Z',
    });
    expect(result.status).toBe('active');
  });

  it('defaults missing context fields gracefully', () => {
    const legacy = { phase: 'specification', step: 'init', status: 'active' };
    const result = migrateLegacyState(legacy);
    expect(result.context.team_name).toBe('');
    expect(result.context.current_sprint).toBe(0);
    expect(result.context.epics_completed).toEqual([]);
    expect(result.context.has_ai_ml).toBe(false);
  });
});

describe('readState with legacy migration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-migrate-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('auto-migrates legacy format and persists new format', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(nodePath.join(dir, 'state.json'), JSON.stringify({
      phase: 'execution',
      step: 'sprint_build',
      status: 'active',
      team_name: 'test-team',
      current_sprint: 1,
      current_epic: 'E1',
      epics_completed: [],
      epics_remaining: ['E1'],
      has_ai_ml: false,
      has_analytics: false,
      has_frontend_ui: true,
      created_at: '2026-01-01T00:00:00Z',
    }));

    const result = readState(tmpDir);
    expect(result.value).toEqual({ execution: { sprint: 'build' } });
    expect(result.context.team_name).toBe('test-team');

    // Verify the file on disk was overwritten with new format
    const onDisk = JSON.parse(fs.readFileSync(nodePath.join(dir, 'state.json'), 'utf-8'));
    expect(onDisk.value).toEqual({ execution: { sprint: 'build' } });
    expect(onDisk.phase).toBeUndefined(); // old field gone
  });

  it('does not re-migrate XState format', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    const snapshot = { value: { specification: 'init' }, context: { team_name: 'x' }, status: 'active' };
    fs.writeFileSync(nodePath.join(dir, 'state.json'), JSON.stringify(snapshot));

    const result = readState(tmpDir);
    expect(result).toEqual(snapshot); // unchanged
  });
});
