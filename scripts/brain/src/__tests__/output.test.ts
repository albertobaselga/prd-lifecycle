import { describe, it, expect } from 'vitest';
import { renderNavigationBox, renderNoStateBox } from '../output.js';
import type { NavigationOutput, BrainContext } from '../types.js';

function defaultContext(): BrainContext {
  return {
    team_name: 'test-team',
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

function makeNav(overrides?: Partial<NavigationOutput>): NavigationOutput {
  return {
    loadFile: null,
    resumeAt: 'STEP 0: TEST',
    roles: 'test-role',
    conditionalRoles: [],
    extraRoles: [],
    meaning: 'test meaning',
    previous: 'test previous',
    ...overrides,
  };
}

function makeSnapshot(phase: string, step: any, ctxOverrides?: Partial<BrainContext>) {
  const context = { ...defaultContext(), ...ctxOverrides };
  let value: any;
  if (typeof step === 'string') {
    value = { [phase]: step };
  } else if (typeof step === 'object') {
    value = { [phase]: step };
  } else {
    value = phase;
  }
  return { value, context };
}

describe('renderNavigationBox', () => {
  it('POSITION shows Phase, Step, Team', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('Phase:');
    expect(output).toContain('specification');
    expect(output).toContain('Step:');
    expect(output).toContain('init');
    expect(output).toContain('Team:');
    expect(output).toContain('test-team');
  });

  it('Sprint/Epic lines shown only during execution sprint states', () => {
    const sprintOutput = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_sprint: 1, current_epic: 'E1' }),
      makeNav(),
    );
    expect(sprintOutput).toContain('Sprint:');
    expect(sprintOutput).toContain('Epic:');

    const phase1Output = renderNavigationBox(
      makeSnapshot('execution', 'phase1_complete'),
      makeNav(),
    );
    expect(phase1Output).not.toContain('Sprint:');
  });

  it('SPRINT PROGRESS shows correct step index', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_sprint: 1 }),
      makeNav(),
    );
    expect(output).toContain('2 / 9'); // build is index 1, displayed as 2/9
  });

  it('SPRINT PROGRESS for retro_done shows 9 / 9', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'retro_done' }, { current_sprint: 1 }),
      makeNav(),
    );
    expect(output).toContain('9 / 9');
  });

  it('PROGRESS section shows completed/remaining counts and domains', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', {
        epics_completed: ['E1'], epics_remaining: ['E2', 'E3'],
        has_ai_ml: true, has_analytics: false, has_frontend_ui: true,
      }),
      makeNav(),
    );
    expect(output).toContain('Completed:');
    expect(output).toContain('E1');
    expect(output).toContain('(1)');
    expect(output).toContain('Remaining:');
    expect(output).toContain('(2)');
    expect(output).toContain('AI/ML=true');
    expect(output).toContain('Frontend=true');
  });

  it('WARNINGS section renders sprint=0 warning', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_sprint: 0 }),
      makeNav(),
    );
    expect(output).toContain('Sprint counter is 0');
  });

  it('WARNINGS section renders missing epic warning', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_epic: '' }),
      makeNav(),
    );
    expect(output).toContain('No current_epic');
  });

  it('WARNINGS section shows all-complete hint at retro_done', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'retro_done' }, { current_sprint: 1, epics_remaining: [] }),
      makeNav(),
    );
    expect(output).toContain('All epics complete');
  });

  it('Protocol footer says "brain" not "brain.sh"', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('run brain with new state');
    expect(output).toContain('run brain (no args)');
    expect(output).not.toContain('brain.sh');
  });

  it('uses Unicode box-drawing characters', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('╔');
    expect(output).toContain('║');
    expect(output).toContain('╚');
    expect(output).toContain('═');
  });

  it('shows conditional roles when provided', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav({ conditionalRoles: ['applied-ai-engineer'] }),
    );
    expect(output).toContain('Conditional:');
    expect(output).toContain('applied-ai-engineer');
  });
});

describe('renderNoStateBox', () => {
  it('shows NOSTATE guidance', () => {
    const output = renderNoStateBox();
    expect(output).toContain('No State Found');
    expect(output).toContain('brain --init');
  });

  it('uses Unicode box-drawing characters', () => {
    const output = renderNoStateBox();
    expect(output).toContain('╔');
    expect(output).toContain('╚');
  });
});
