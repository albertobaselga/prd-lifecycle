import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as nodePath from 'path';

const RUN_SH = nodePath.resolve(__dirname, '..', '..', 'run.sh');

describe('brain CLI integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'brain-int-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  function brain(...args: string[]): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execFileSync('bash', [RUN_SH, tmpDir, ...args], {
        encoding: 'utf-8',
        timeout: 10000,
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (e: any) {
      return {
        stdout: e.stdout || '',
        stderr: e.stderr || '',
        exitCode: e.status ?? 1,
      };
    }
  }

  function readStateJson(): any {
    return JSON.parse(
      fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/state.json'), 'utf-8'),
    );
  }

  // --- NOSTATE ---

  it('shows NOSTATE box when no state.json and no --init', () => {
    const { stdout, exitCode } = brain();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No State Found');
    expect(stdout).toContain('brain --list');
  });

  // --- LIST ---

  it('--list shows instances header', () => {
    const { stdout, exitCode } = brain('--list');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Instances');
  });

  it('--list shows initialized instances', () => {
    brain('instance=list-test', '--init');
    const { stdout, exitCode } = brain('--list');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('list-test');
  });

  // --- INIT ---

  it('--init requires instance parameter', () => {
    const { exitCode, stderr, stdout } = brain('--init');
    expect(exitCode).toBe(1);
    const output = stderr + stdout;
    expect(output).toContain('Missing Instance');
  });

  it('--init with invalid slug fails', () => {
    const { exitCode, stderr, stdout } = brain('instance=../../evil', '--init');
    expect(exitCode).toBe(1);
    const output = stderr + stdout;
    expect(output).toContain('Invalid');
  });

  it('--init with trailing-hyphen slug fails', () => {
    const { exitCode, stderr, stdout } = brain('instance=my-api-', '--init');
    expect(exitCode).toBe(1);
    const output = stderr + stdout;
    expect(output).toContain('Invalid');
  });

  it('--init creates scaffold directories and state.json', () => {
    const { stdout, exitCode } = brain('instance=int-test', '--init');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('specification');
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/state.json'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/arch'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/specs'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/data'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/sprints'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test/release'))).toBe(true);
  });

  it('--init creates learnings.md with correct header', () => {
    brain('instance=int-test', '--init');
    const content = fs.readFileSync(
      nodePath.join(tmpDir, 'prd-lifecycle/int-test/learnings.md'),
      'utf-8',
    );
    expect(content).toContain('# ACE Learnings');
  });

  it('--init sets created_at and instance in state.json context', () => {
    brain('instance=int-test', '--init');
    const state = readStateJson();
    expect(state.context.created_at).toBeTruthy();
    expect(state.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(state.context.instance).toBe('int-test');
  });

  it('--init fails when state.json already exists', () => {
    brain('instance=int-test', '--init');
    const { exitCode, stderr } = brain('instance=int-test', '--init');
    expect(exitCode).toBe(1);
  });

  // --- ORIENT ---

  it('orient mode shows navigation for current state', () => {
    brain('instance=int-test', '--init');
    const { stdout, exitCode } = brain('instance=int-test');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('specification');
    expect(stdout).toContain('init');
    expect(stdout).toContain('## Position');
    expect(stdout).toContain('## Protocol');
    expect(stdout).toContain('Instance: int-test');
  });

  // --- TRANSITIONS ---

  it('transitions from init to scaffold_complete', () => {
    brain('instance=int-test', '--init');
    const { stdout, exitCode } = brain('instance=int-test', 'step=scaffold_complete', 'team_name=test-proj');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('scaffold_complete');
    expect(stdout).toContain('test-proj');
    const state = readStateJson();
    expect(state.context.team_name).toBe('test-proj');
  });

  it('assigns domain flags correctly', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=true', 'has_analytics=false', 'has_frontend_ui=true');
    const state = readStateJson();
    expect(state.context.has_ai_ml).toBe(true);
    expect(state.context.has_analytics).toBe(false);
    expect(state.context.has_frontend_ui).toBe(true);
  });

  // --- INVALID EVENTS ---

  it('rejects invalid event with exit 1 and lists valid events', () => {
    brain('instance=int-test', '--init');
    const { exitCode, stderr, stdout } = brain('instance=int-test', 'step=sprint_build');
    expect(exitCode).toBe(1);
    const output = stderr + stdout;
    expect(output).toContain('SCAFFOLD_COMPLETE');
  });

  it('double-send: same event twice is rejected on second send', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=test');
    const { exitCode } = brain('instance=int-test', 'step=scaffold_complete', 'team_name=test2');
    expect(exitCode).toBe(1);
  });

  // --- CORRUPT STATE (legacy path) ---

  it('empty (0-byte) state.json returns exit 1 with error', () => {
    fs.mkdirSync(nodePath.join(tmpDir, 'prd-lifecycle'), { recursive: true });
    fs.writeFileSync(nodePath.join(tmpDir, 'prd-lifecycle/state.json'), '');
    const { exitCode, stderr, stdout } = brain();
    expect(exitCode).toBe(1);
  });

  it('corrupt JSON state.json returns exit 1', () => {
    fs.mkdirSync(nodePath.join(tmpDir, 'prd-lifecycle'), { recursive: true });
    fs.writeFileSync(nodePath.join(tmpDir, 'prd-lifecycle/state.json'), '{broken json');
    const { exitCode } = brain();
    expect(exitCode).toBe(1);
  });

  // --- FULL LIFECYCLE (1 sprint) ---

  it('full lifecycle: init → completed with 1 sprint', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=e2e-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    // All stories refined → product backlog drains to 0
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=0');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Context has product_backlog_count=0 → guard noRemainingStories passes
    brain('instance=int-test', 'step=release_started', 'product_backlog_count=0');
    brain('instance=int-test', 'step=release_done');
    const { stdout } = brain('instance=int-test', 'step=completed');
    expect(stdout).toContain('completed');

    const state = readStateJson();
    expect(state.context.product_backlog_count).toBe(0);
    expect(state.context.current_sprint).toBe(1);
    expect(state.status).toBe('done');
  });

  // --- SPRINT LOOP (2 sprints with refinement) ---

  it('sprint loop: 2 sprints with refinement between them', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=multi-sprint');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=5');

    // Sprint 1
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=5');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Sprint 2: go through refinement again, drain backlog to 0
    brain('instance=int-test', 'step=start_refinement', 'product_backlog_count=5');
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=0');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Context has product_backlog_count=0 → guard passes
    brain('instance=int-test', 'step=release_started', 'product_backlog_count=0');
    brain('instance=int-test', 'step=release_done');
    brain('instance=int-test', 'step=completed');

    const state = readStateJson();
    expect(state.context.product_backlog_count).toBe(0);
    expect(state.context.current_sprint).toBe(2);
    expect(state.status).toBe('done');
  });

  // --- SPRINT LOOP (skip refinement — direct to planning) ---

  it('sprint loop: skip refinement and go directly to planning', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=skip-refine');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');

    // Sprint 1
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=3');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Sprint 2: skip refinement, go directly to planning, drain backlog to 0
    brain('instance=int-test', 'step=start_planning', 'product_backlog_count=0');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Context has product_backlog_count=0 → guard passes
    brain('instance=int-test', 'step=release_started', 'product_backlog_count=0');
    brain('instance=int-test', 'step=release_done');
    brain('instance=int-test', 'step=completed');

    const state = readStateJson();
    expect(state.context.product_backlog_count).toBe(0);
    expect(state.context.current_sprint).toBe(2);
    expect(state.status).toBe('done');
  });

  // --- GUARD ENFORCEMENT ---

  it('guards prevent start_release when product_backlog_count > 0', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=guard-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=3');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Stories remain — start_release should be rejected
    const { exitCode } = brain('instance=int-test', 'step=release_started', 'product_backlog_count=5');
    expect(exitCode).toBe(1);
  });

  it('guards prevent start_refinement when product_backlog_count = 0', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=guard-test2');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    // Set backlog to 0 so context.product_backlog_count=0 at retro_done
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=0');
    brain('instance=int-test', 'step=sprint_planning_done');
    brain('instance=int-test', 'step=sprint_build');
    brain('instance=int-test', 'step=sprint_build_done');
    brain('instance=int-test', 'step=sprint_verify');
    brain('instance=int-test', 'step=sprint_verify_done');
    brain('instance=int-test', 'step=sprint_arch_review');
    brain('instance=int-test', 'step=sprint_arch_done');
    brain('instance=int-test', 'step=sprint_review_done');
    brain('instance=int-test', 'step=sprint_retro_done');

    // Context has product_backlog_count=0 — guard hasRemainingStories rejects (0 > 0 = false)
    const { exitCode } = brain('instance=int-test', 'step=start_refinement', 'product_backlog_count=0');
    expect(exitCode).toBe(1);
  });

  // --- CONDITIONAL ROLES ---

  it('shows conditional roles when domain flags are set', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=domain-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=true', 'has_analytics=false', 'has_frontend_ui=true');
    const { stdout } = brain('instance=int-test', 'step=phase1_spawned');
    expect(stdout).toContain('applied-ai-engineer');
    expect(stdout).toContain('ux-ui-designer');
  });

  // --- SPRINT PROGRESS ---

  it('shows sprint progress indicator during sprint substates', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=progress-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=3');
    brain('instance=int-test', 'step=sprint_planning_done');
    const { stdout } = brain('instance=int-test', 'step=sprint_build');
    expect(stdout).toContain('## Sprint Progress');
    expect(stdout).toContain('2 / 9'); // build is step 2 of 9
  });

  // --- WARNINGS ---

  it('warnings appear for sprint=0 during execution', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=warn-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=3');
    brain('instance=int-test', 'step=sprint_planning_done');
    // Manually tamper with state to set current_sprint=0
    const state = readStateJson();
    state.context.current_sprint = 0;
    fs.writeFileSync(
      nodePath.join(tmpDir, 'prd-lifecycle/int-test/state.json'),
      JSON.stringify(state, null, 2),
    );
    // Orient should show warning
    const { stdout } = brain('instance=int-test');
    expect(stdout).toContain('Sprint counter is 0');
  });

  // --- TYPED EVENT SYNTAX ---

  it('supports typed event syntax (BUILD_STARTED)', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=typed-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('instance=int-test', 'step=phase1_spawned');
    brain('instance=int-test', 'step=ceremony1_complete');
    brain('instance=int-test', 'step=ceremony2_complete');
    brain('instance=int-test', 'step=phase1_complete', 'product_backlog_count=3');
    brain('instance=int-test', 'step=refinement_done', 'product_backlog_count=3');
    brain('instance=int-test', 'step=sprint_planning_done');
    const { stdout, exitCode } = brain('instance=int-test', 'BUILD_STARTED');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('build');
  });

  // --- NO TMP FILES LEFT ---

  it('no .tmp files remain after operations', () => {
    brain('instance=int-test', '--init');
    brain('instance=int-test', 'step=scaffold_complete', 'team_name=tmp-test');
    brain('instance=int-test', 'step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    const files = fs.readdirSync(nodePath.join(tmpDir, 'prd-lifecycle/int-test'));
    const tmpFiles = files.filter((f: string) => f.endsWith('.tmp'));
    expect(tmpFiles).toEqual([]);
  });

  // --- INSTANCE ISOLATION ---

  it('two instances have independent state', () => {
    brain('instance=alpha', '--init');
    brain('instance=beta', '--init');
    brain('instance=alpha', 'step=scaffold_complete', 'team_name=alpha-team');

    // Alpha should be at scaffold_complete, beta still at init
    const alphaState = JSON.parse(
      fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/alpha/state.json'), 'utf-8'),
    );
    const betaState = JSON.parse(
      fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/beta/state.json'), 'utf-8'),
    );
    expect(alphaState.context.team_name).toBe('alpha-team');
    expect(betaState.context.team_name).toBe('');
  });
});
