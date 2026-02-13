import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as nodePath from 'path';
import { readState, writeState, initializeProject, isLegacyFormat, migrateLegacyState, validateInstance, listInstances } from '../persistence.js';
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

  it('returns null when state.json missing for instance', () => {
    expect(readState(tmpDir, 'my-proj')).toBeNull();
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

  it('atomic write leaves no .tmp files (legacy path)', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    writeState(tmpDir, { value: { specification: 'init' }, context: {}, status: 'active' });
    const files = fs.readdirSync(dir);
    expect(files.filter(f => f.endsWith('.tmp'))).toEqual([]);
    expect(files).toContain('state.json');
  });

  it('atomic write leaves no .tmp files (instance path)', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle', 'my-proj');
    fs.mkdirSync(dir, { recursive: true });
    writeState(tmpDir, { value: { specification: 'init' }, context: {}, status: 'active' }, 'my-proj');
    const files = fs.readdirSync(dir);
    expect(files.filter(f => f.endsWith('.tmp'))).toEqual([]);
    expect(files).toContain('state.json');
  });

  it('roundtrip preserves data (legacy path)', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    const snapshot = { value: { execution: { sprint: 'build' } }, context: { team_name: 'test' }, status: 'active' };
    writeState(tmpDir, snapshot);
    const loaded = readState(tmpDir);
    expect(loaded).toEqual(snapshot);
  });

  it('roundtrip preserves data (instance path)', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle', 'my-proj');
    fs.mkdirSync(dir, { recursive: true });
    const snapshot = { value: { execution: { sprint: 'build' } }, context: { team_name: 'test', instance: 'my-proj' }, status: 'active' };
    writeState(tmpDir, snapshot, 'my-proj');
    const loaded = readState(tmpDir, 'my-proj');
    expect(loaded).toEqual(snapshot);
  });

  it('initializeProject creates scaffold and state.json', () => {
    initializeProject(tmpDir, workflow as any, 'test-proj');
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/arch'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/specs'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/data'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/sprints'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/release'))).toBe(true);
    const state = readState(tmpDir, 'test-proj');
    expect(state.value).toEqual({ specification: 'init' });
    expect(state.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(state.context.instance).toBe('test-proj');
  });

  it('initializeProject creates learnings.md with correct header', () => {
    initializeProject(tmpDir, workflow as any, 'test-proj');
    const content = fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/test-proj/learnings.md'), 'utf-8');
    expect(content).toContain('# ACE Learnings');
  });

  it('initializeProject fails when state.json already exists', () => {
    initializeProject(tmpDir, workflow as any, 'test-proj');
    expect(() => initializeProject(tmpDir, workflow as any, 'test-proj')).toThrow(/already exists/);
  });

  it('instance survives XState hydration roundtrip', () => {
    initializeProject(tmpDir, workflow as any, 'hydration-test');
    const state = readState(tmpDir, 'hydration-test');
    expect(state.context.instance).toBe('hydration-test');
    // Write and re-read to verify persistence
    writeState(tmpDir, state, 'hydration-test');
    const reloaded = readState(tmpDir, 'hydration-test');
    expect(reloaded.context.instance).toBe('hydration-test');
  });
});

describe('validateInstance', () => {
  it('accepts valid slugs', () => {
    expect(() => validateInstance('my-api')).not.toThrow();
    expect(() => validateInstance('a')).not.toThrow();
    expect(() => validateInstance('3d-engine')).not.toThrow();
    expect(() => validateInstance('task-management-api')).not.toThrow();
    expect(() => validateInstance('data')).not.toThrow();
    expect(() => validateInstance('release')).not.toThrow();
    expect(() => validateInstance('a1b2c3')).not.toThrow();
  });

  it('rejects path traversal', () => {
    expect(() => validateInstance('../../evil')).toThrow(/Invalid instance slug/);
    expect(() => validateInstance('../etc')).toThrow(/Invalid instance slug/);
  });

  it('rejects trailing hyphen', () => {
    expect(() => validateInstance('my-api-')).toThrow(/Invalid instance slug/);
  });

  it('rejects leading hyphen', () => {
    expect(() => validateInstance('-my-api')).toThrow(/Invalid instance slug/);
  });

  it('rejects uppercase', () => {
    expect(() => validateInstance('My-Api')).toThrow(/Invalid instance slug/);
  });

  it('rejects underscores', () => {
    expect(() => validateInstance('my_api')).toThrow(/Invalid instance slug/);
  });

  it('rejects spaces', () => {
    expect(() => validateInstance('my api')).toThrow(/Invalid instance slug/);
  });

  it('rejects empty string', () => {
    expect(() => validateInstance('')).toThrow(/Invalid instance slug/);
  });

  it('rejects slugs over 60 chars', () => {
    const long = 'a'.repeat(61);
    expect(() => validateInstance(long)).toThrow(/Invalid instance slug/);
  });

  it('accepts slug exactly 60 chars', () => {
    const exact = 'a'.repeat(60);
    expect(() => validateInstance(exact)).not.toThrow();
  });
});

describe('listInstances', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-list-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns empty array when prd-lifecycle does not exist', () => {
    expect(listInstances(tmpDir)).toEqual([]);
  });

  it('detects legacy flat format', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(nodePath.join(dir, 'state.json'), '{}');
    const result = listInstances(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('(legacy)');
    expect(result[0].isLegacy).toBe(true);
  });

  it('finds instance subdirectories with state.json', () => {
    const dir1 = nodePath.join(tmpDir, 'prd-lifecycle', 'alpha');
    const dir2 = nodePath.join(tmpDir, 'prd-lifecycle', 'beta');
    fs.mkdirSync(dir1, { recursive: true });
    fs.mkdirSync(dir2, { recursive: true });
    fs.writeFileSync(nodePath.join(dir1, 'state.json'), '{}');
    fs.writeFileSync(nodePath.join(dir2, 'state.json'), '{}');
    const result = listInstances(tmpDir);
    const slugs = result.map(r => r.slug).sort();
    expect(slugs).toEqual(['alpha', 'beta']);
    expect(result.every(r => !r.isLegacy)).toBe(true);
  });

  it('ignores subdirectories without state.json', () => {
    const dir = nodePath.join(tmpDir, 'prd-lifecycle', 'empty-dir');
    fs.mkdirSync(dir, { recursive: true });
    expect(listInstances(tmpDir)).toEqual([]);
  });

  it('does NOT exclude legitimate slugs like "data" or "release"', () => {
    const dataDir = nodePath.join(tmpDir, 'prd-lifecycle', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(nodePath.join(dataDir, 'state.json'), '{}');
    const result = listInstances(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('data');
  });

  it('detects both legacy and instance formats simultaneously', () => {
    const legacyDir = nodePath.join(tmpDir, 'prd-lifecycle');
    const instanceDir = nodePath.join(tmpDir, 'prd-lifecycle', 'my-proj');
    fs.mkdirSync(instanceDir, { recursive: true });
    fs.writeFileSync(nodePath.join(legacyDir, 'state.json'), '{}');
    fs.writeFileSync(nodePath.join(instanceDir, 'state.json'), '{}');
    const result = listInstances(tmpDir);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.isLegacy)).toBeTruthy();
    expect(result.find(r => r.slug === 'my-proj')).toBeTruthy();
  });
});

describe('isolation: two instances have independent state', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-iso-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('independent read/write per instance', () => {
    initializeProject(tmpDir, workflow as any, 'alpha');
    initializeProject(tmpDir, workflow as any, 'beta');

    // Both start at specification.init
    const alphaState = readState(tmpDir, 'alpha');
    const betaState = readState(tmpDir, 'beta');
    expect(alphaState.value).toEqual({ specification: 'init' });
    expect(betaState.value).toEqual({ specification: 'init' });

    // Mutate alpha independently
    alphaState.context.team_name = 'alpha-team';
    writeState(tmpDir, alphaState, 'alpha');

    // Beta should be unchanged
    const betaReread = readState(tmpDir, 'beta');
    expect(betaReread.context.team_name).toBe('');
    const alphaReread = readState(tmpDir, 'alpha');
    expect(alphaReread.context.team_name).toBe('alpha-team');
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
    expect(result.context.instance).toBe('');
    expect(result.historyValue).toEqual({});
    expect(result.children).toEqual({});
  });

  it('converts execution.phase1_complete to refinement', () => {
    const legacy = { phase: 'execution', step: 'phase1_complete', status: 'active' };
    const result = migrateLegacyState(legacy);
    expect(result.value).toEqual({ execution: 'refinement' });
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
      instance: '',
      team_name: 'inherited-dazzling-sunbeam',
      current_sprint: 3,
      has_ai_ml: false,
      has_analytics: true,
      has_frontend_ui: true,
      created_at: '2026-02-09T00:33:46Z',
      product_backlog_count: 0,
    });
    expect(result.status).toBe('active');
  });

  it('defaults missing context fields gracefully', () => {
    const legacy = { phase: 'specification', step: 'init', status: 'active' };
    const result = migrateLegacyState(legacy);
    expect(result.context.instance).toBe('');
    expect(result.context.team_name).toBe('');
    expect(result.context.current_sprint).toBe(0);
    expect(result.context.has_ai_ml).toBe(false);
    expect(result.context.product_backlog_count).toBe(0);
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
    expect(result.context.instance).toBe('');
    expect(result.context.product_backlog_count).toBe(0);
    expect(result.context.current_epic).toBeUndefined();
    expect(result.context.epics_completed).toBeUndefined();
    expect(result.context.epics_remaining).toBeUndefined();

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
