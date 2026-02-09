import { describe, it, expect } from 'vitest';
import { computeNavigation } from '../navigation.js';
import workflow from '../../../../workflow.json';
import type { BrainContext } from '../types.js';

function defaultContext(): BrainContext {
  return {
    team_name: 'test',
    current_sprint: 0,
    current_epic: '',
    epics_completed: [],
    epics_remaining: [],
    has_ai_ml: false,
    has_analytics: false,
    has_frontend_ui: false,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function sprintContext(): BrainContext {
  return {
    ...defaultContext(),
    current_sprint: 1,
    current_epic: 'E1',
    epics_remaining: ['E1', 'E2'],
    epics_completed: [],
  };
}

function makeSnapshot(value: any, context?: Partial<BrainContext>) {
  return { value, context: { ...defaultContext(), ...context } };
}

describe('computeNavigation', () => {
  it('returns correct nav for specification.init', () => {
    const snapshot = makeSnapshot({ specification: 'init' });
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.resumeAt).toContain('STEP 0: INITIALIZATION');
    expect(nav.loadFile).toBeNull();
    expect(nav.roles).toContain('none yet');
    expect(nav.meaning).toBe('Project scaffold just created');
    expect(nav.previous).toBe('(start)');
  });

  it('returns loadFile for execution.sprint.build', () => {
    const snapshot = makeSnapshot({ execution: { sprint: 'build' } }, sprintContext());
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.loadFile).toContain('phase2-sprints.md');
  });

  it('includes conditional roles when domain flags set', () => {
    const snapshot = makeSnapshot({ specification: 'phase1_spawned' }, { has_ai_ml: true });
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.conditionalRoles).toContain('applied-ai-engineer');
  });

  it('excludes conditional roles when domain flags not set', () => {
    const snapshot = makeSnapshot({ specification: 'phase1_spawned' });
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.conditionalRoles).toEqual([]);
  });

  it('includes extraRoles at build_done', () => {
    const snapshot = makeSnapshot({ execution: { sprint: 'build_done' } }, sprintContext());
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.extraRoles.length).toBeGreaterThan(0);
    expect(nav.extraRoles[0]).toContain('data-engineer');
  });

  it('handles dynamic resume_at for retro_done with epics', () => {
    const snapshot = makeSnapshot(
      { execution: { sprint: 'retro_done' } },
      { ...sprintContext(), epics_remaining: ['E2'] },
    );
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.resumeAt).toContain('next sprint');
    expect(nav.loadFile).toContain('phase2-sprints.md');
  });

  it('handles dynamic resume_at for retro_done without epics', () => {
    const snapshot = makeSnapshot(
      { execution: { sprint: 'retro_done' } },
      { ...sprintContext(), epics_remaining: [] },
    );
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.resumeAt).toContain('RELEASE');
    expect(nav.loadFile).toBeNull();
  });

  it('returns correct nav for completed state', () => {
    const snapshot = makeSnapshot('completed');
    const nav = computeNavigation(snapshot, workflow);
    expect(nav.resumeAt).toContain('DONE');
    expect(nav.meaning).toContain('complete');
  });
});

// --- All 19 leaf states coverage ---

const ALL_LEAF_PATHS = [
  'specification.init', 'specification.scaffold_complete', 'specification.domains_detected',
  'specification.phase1_spawned', 'specification.ceremony1_complete', 'specification.ceremony2_complete',
  'execution.phase1_complete', 'execution.sprint.setup', 'execution.sprint.build',
  'execution.sprint.build_done', 'execution.sprint.verify', 'execution.sprint.verify_done',
  'execution.sprint.arch_review', 'execution.sprint.arch_done', 'execution.sprint.review_done',
  'execution.sprint.retro_done', 'release.release_started', 'release.release_done', 'completed',
];

function pathToValue(dotPath: string): any {
  const parts = dotPath.split('.');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return { [parts[0]]: parts[1] };
  if (parts.length === 3) return { [parts[0]]: { [parts[1]]: parts[2] } };
  throw new Error(`Unexpected depth: ${dotPath}`);
}

describe('navigation coverage — all 19 leaf states', () => {
  ALL_LEAF_PATHS.forEach(statePath => {
    it(`produces valid navigation for ${statePath}`, () => {
      const snapshot = {
        value: pathToValue(statePath),
        context: {
          ...defaultContext(),
          current_sprint: 1,
          current_epic: 'E1',
          epics_remaining: ['E1'],
        },
      };
      const nav = computeNavigation(snapshot, workflow);
      expect(nav.resumeAt).toBeTruthy();
      expect(nav.roles).toBeTruthy();
      expect(nav.meaning).toBeTruthy();
    });
  });
});
