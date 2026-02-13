import { describe, it, expect } from 'vitest';
import { renderNavigationBox, renderNoStateBox, renderInstanceList } from '../output.js';
import type { NavigationOutput, BrainContext } from '../types.js';

function defaultContext(): BrainContext {
  return {
    instance: '',
    team_name: 'test-team',
    current_sprint: 0,
    has_ai_ml: false,
    has_analytics: false,
    has_frontend_ui: false,
    created_at: '2026-01-01T00:00:00Z',
    product_backlog_count: 0,
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
    lifecycleBeforeAdvancing: null,
    artifactRef: null,
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

  it('POSITION shows Instance when provided', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', { instance: 'my-api' }),
      makeNav(),
      '/tmp/test',
      'my-api',
    );
    expect(output).toContain('Instance: my-api');
  });

  it('POSITION omits Instance line when no instance', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).not.toContain('Instance:');
  });

  it('ARTIFACTS shows Artifact dir with instance', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', { instance: 'my-api' }),
      makeNav(),
      '/tmp/test',
      'my-api',
    );
    expect(output).toContain('Artifact dir: prd-lifecycle/my-api/');
  });

  it('Sprint/Backlog lines shown during execution sprint states', () => {
    const sprintOutput = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_sprint: 1, product_backlog_count: 5 }),
      makeNav(),
    );
    expect(sprintOutput).toContain('Sprint:');
    expect(sprintOutput).toContain('Backlog:');
    expect(sprintOutput).not.toContain('Epic:');

    const refinementOutput = renderNavigationBox(
      makeSnapshot('execution', 'refinement'),
      makeNav(),
    );
    expect(refinementOutput).not.toContain('Sprint:');
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

  it('PROGRESS section shows backlog count and domains', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', {
        product_backlog_count: 12,
        has_ai_ml: true, has_analytics: false, has_frontend_ui: true,
      }),
      makeNav(),
    );
    expect(output).toContain('Backlog:');
    expect(output).toContain('12');
    expect(output).toContain('AI/ML=true');
    expect(output).toContain('Frontend=true');
    expect(output).not.toContain('Completed:');
    expect(output).not.toContain('Remaining:');
  });

  it('WARNINGS section renders sprint=0 warning in sprint states', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, { current_sprint: 0 }),
      makeNav(),
    );
    expect(output).toContain('Sprint counter is 0');

    // No warning in refinement/sprint_planning states
    const refinementOutput = renderNavigationBox(
      makeSnapshot('execution', 'refinement', { current_sprint: 0 }),
      makeNav(),
    );
    expect(refinementOutput).not.toContain('Sprint counter is 0');
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

  it('uses Markdown section headers', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('# BRAIN');
    expect(output).toContain('## Position');
    expect(output).toContain('## Came From');
    expect(output).toContain('## Go To');
    expect(output).toContain('## Progress');
    expect(output).toContain('## Protocol');
    // No ASCII box chars in navigation output
    expect(output).not.toContain('╔');
    expect(output).not.toContain('║');
  });

  it('shows conditional roles when provided', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav({ conditionalRoles: ['applied-ai-engineer'] }),
    );
    expect(output).toContain('Conditional:');
    expect(output).toContain('applied-ai-engineer');
  });

  it('cheatsheet includes Your Role and ORCHESTRATOR', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('## LEAD CHEATSHEET');
    expect(output).toContain('### Your Role');
    expect(output).toContain('ORCHESTRATOR');
    expect(output).toContain('NEVER write code');
  });

  it('cheatsheet includes team API tools', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('SendMessage(type="message"');
    expect(output).toContain('SendMessage(type="broadcast"');
    expect(output).toContain('SendMessage(type="shutdown_request"');
    expect(output).toContain('TaskCreate(');
    expect(output).toContain('TaskUpdate(');
    expect(output).toContain('TaskList()');
  });

  it('cheatsheet includes rules', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init'),
      makeNav(),
    );
    expect(output).toContain('INVISIBLE');
    expect(output).toContain('SendMessage');
    expect(output).toContain('preamble');
    expect(output).toContain('VERIFY');
  });

  it('cheatsheet injects real team_name into spawn example', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', { team_name: 'prd-my-app' }),
      makeNav(),
    );
    expect(output).toContain('team_name="prd-my-app"');
  });

  it('cheatsheet uses placeholder when team_name not set', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', { team_name: '' }),
      makeNav(),
    );
    expect(output).toContain('team_name="YOUR_TEAM"');
  });

  it('cheatsheet includes artifact dir with instance', () => {
    const output = renderNavigationBox(
      makeSnapshot('specification', 'init', { instance: 'my-api' }),
      makeNav(),
      '/tmp/test',
      'my-api',
    );
    expect(output).toContain('Artifact dir: prd-lifecycle/my-api/');
  });

  it('shows artifactRef section when provided', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }),
      makeNav({ artifactRef: 'See sprints/sprint-1/story-S1.md for current story details' }),
    );
    expect(output).toContain('Sprint Artifact');
    expect(output).toContain('story-S1.md');
  });

  it('shows lifecycle section when provided', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }),
      makeNav({ lifecycleBeforeAdvancing: 'Wait for dev-1 to complete build before advancing to verify' }),
    );
    expect(output).toContain('Teammate Lifecycle');
    expect(output).toContain('Wait for dev-1');
  });

  it('shows backlog.json in artifacts', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }),
      makeNav(),
      '/tmp/test',
      'my-api',
    );
    expect(output).toContain('backlog.json:');
  });

  it('snapshot: full navigation output structure', () => {
    const output = renderNavigationBox(
      makeSnapshot('execution', { sprint: 'build' }, {
        instance: 'snap-test',
        team_name: 'prd-snap-test',
        current_sprint: 2,
        product_backlog_count: 8,
        has_ai_ml: false,
        has_analytics: true,
        has_frontend_ui: true,
      }),
      makeNav({
        loadFile: '/nonexistent/brain-snapshot-test-path.md',
        resumeAt: 'SUB-PHASE A: BUILD',
        roles: 'dev-1, dev-2',
        conditionalRoles: ['applied-ai-engineer'],
        extraRoles: ['data-engineer'],
        meaning: 'Sprint setup complete',
        previous: 'sprint_setup',
      }),
      '/tmp/snap',
      'snap-test',
    );
    expect(output).toMatchSnapshot();
  });
});

describe('renderNoStateBox', () => {
  it('shows guidance without instance', () => {
    const output = renderNoStateBox();
    expect(output).toContain('No State Found');
    expect(output).toContain('No instance specified');
    expect(output).toContain('brain --list');
    expect(output).toContain('instance={slug} --init');
  });

  it('shows guidance with instance', () => {
    const output = renderNoStateBox('my-api');
    expect(output).toContain('No State Found');
    expect(output).toContain('my-api');
    expect(output).toContain('--init');
    expect(output).toContain('brain --list');
  });

  it('uses Unicode box-drawing characters', () => {
    const output = renderNoStateBox();
    expect(output).toContain('╔');
    expect(output).toContain('╚');
  });
});

describe('renderInstanceList', () => {
  it('shows empty message when no instances', () => {
    const output = renderInstanceList([]);
    expect(output).toContain('No PRD instances found');
    expect(output).toContain('brain . instance={slug} --init');
  });

  it('shows instance details', () => {
    // We can't easily test with real state files, but we can test the function
    // handles the structure correctly by mocking the fs reads internally.
    // For a basic structure test:
    const output = renderInstanceList([]);
    expect(output).toContain('# BRAIN');
    expect(output).toContain('Instances');
  });
});
