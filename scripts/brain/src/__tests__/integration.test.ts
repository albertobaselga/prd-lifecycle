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
      fs.readFileSync(nodePath.join(tmpDir, 'prd-lifecycle/state.json'), 'utf-8'),
    );
  }

  // --- NOSTATE ---

  it('shows NOSTATE box when no state.json and no --init', () => {
    const { stdout, exitCode } = brain();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No State Found');
    expect(stdout).toContain('brain --init');
  });

  // --- INIT ---

  it('--init creates scaffold directories and state.json', () => {
    const { stdout, exitCode } = brain('--init');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('specification');
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/state.json'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/arch'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/specs'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/data'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/sprints'))).toBe(true);
    expect(fs.existsSync(nodePath.join(tmpDir, 'prd-lifecycle/release'))).toBe(true);
  });

  it('--init creates learnings.md with correct header', () => {
    brain('--init');
    const content = fs.readFileSync(
      nodePath.join(tmpDir, 'prd-lifecycle/learnings.md'),
      'utf-8',
    );
    expect(content).toContain('# ACE Learnings');
  });

  it('--init sets created_at in state.json context', () => {
    brain('--init');
    const state = readStateJson();
    expect(state.context.created_at).toBeTruthy();
    expect(state.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('--init fails when state.json already exists', () => {
    brain('--init');
    const { exitCode, stderr } = brain('--init');
    expect(exitCode).toBe(1);
  });

  // --- ORIENT ---

  it('orient mode (no args after init) shows navigation for current state', () => {
    brain('--init');
    const { stdout, exitCode } = brain();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('specification');
    expect(stdout).toContain('init');
    expect(stdout).toContain('POSITION');
    expect(stdout).toContain('PROTOCOL');
  });

  // --- TRANSITIONS ---

  it('transitions from init to scaffold_complete', () => {
    brain('--init');
    const { stdout, exitCode } = brain('step=scaffold_complete', 'team_name=test-proj');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('scaffold_complete');
    expect(stdout).toContain('test-proj');
    const state = readStateJson();
    expect(state.context.team_name).toBe('test-proj');
  });

  it('assigns domain flags correctly', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=test');
    brain('step=domains_detected', 'has_ai_ml=true', 'has_analytics=false', 'has_frontend_ui=true');
    const state = readStateJson();
    expect(state.context.has_ai_ml).toBe(true);
    expect(state.context.has_analytics).toBe(false);
    expect(state.context.has_frontend_ui).toBe(true);
  });

  // --- INVALID EVENTS ---

  it('rejects invalid event with exit 1 and lists valid events', () => {
    brain('--init');
    const { exitCode, stderr, stdout } = brain('step=sprint_build');
    expect(exitCode).toBe(1);
    const output = stderr + stdout;
    expect(output).toContain('SCAFFOLD_COMPLETE');
  });

  it('double-send: same event twice is rejected on second send', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=test');
    const { exitCode } = brain('step=scaffold_complete', 'team_name=test2');
    expect(exitCode).toBe(1);
  });

  // --- CORRUPT STATE ---

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

  // --- FULL LIFECYCLE (1 epic) ---

  it('full lifecycle: init → completed with 1 epic', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=e2e-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('step=sprint_setup', 'current_epic=E1');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    brain('step=sprint_retro_done', 'add-completed=E1');

    // After retro_done with no epics remaining → release
    brain('step=release_started');
    brain('step=release_done');
    const { stdout } = brain('step=completed');
    expect(stdout).toContain('completed');

    const state = readStateJson();
    expect(state.context.epics_completed).toEqual(['E1']);
    expect(state.context.epics_remaining).toEqual([]);
    expect(state.status).toBe('done');
  });

  // --- SPRINT LOOP (3 epics) ---

  it('sprint loop: cycles through 3 epics then transitions to release', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=multi-epic');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1","E2","E3"]');
    brain('step=phase1_complete');

    // Sprint 1: E1
    brain('step=sprint_setup', 'current_epic=E1');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    brain('step=sprint_retro_done', 'add-completed=E1');

    // Sprint 2: E2
    brain('step=sprint_setup', 'current_epic=E2');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    brain('step=sprint_retro_done', 'add-completed=E2');

    // Sprint 3: E3
    brain('step=sprint_setup', 'current_epic=E3');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    brain('step=sprint_retro_done', 'add-completed=E3');

    // All epics done → release
    brain('step=release_started');
    brain('step=release_done');
    brain('step=completed');

    const state = readStateJson();
    expect(state.context.epics_completed).toEqual(['E1', 'E2', 'E3']);
    expect(state.context.epics_remaining).toEqual([]);
    expect(state.context.current_sprint).toBe(3);
    expect(state.status).toBe('done');
  });

  // --- GUARD ENFORCEMENT ---

  it('guards prevent START_SPRINT when no epics remain at retro_done', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=guard-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('step=sprint_setup', 'current_epic=E1');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    brain('step=sprint_retro_done', 'add-completed=E1');

    // No epics remain — START_SPRINT should be rejected
    const { exitCode } = brain('step=sprint_setup', 'current_epic=X');
    expect(exitCode).toBe(1);
  });

  // --- CONDITIONAL ROLES ---

  it('shows conditional roles when domain flags are set', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=domain-test');
    brain('step=domains_detected', 'has_ai_ml=true', 'has_analytics=false', 'has_frontend_ui=true');
    const { stdout } = brain('step=phase1_spawned');
    expect(stdout).toContain('applied-ai-engineer');
    expect(stdout).toContain('ux-ui-designer');
  });

  // --- SPRINT PROGRESS ---

  it('shows sprint progress indicator during sprint substates', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=progress-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('step=sprint_setup', 'current_epic=E1');
    const { stdout } = brain('step=sprint_build');
    expect(stdout).toContain('SPRINT PROGRESS');
    expect(stdout).toContain('2 / 9'); // build is step 2 of 9
  });

  // --- WARNINGS ---

  it('warnings appear for sprint=0 during execution', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=warn-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('step=sprint_setup', 'current_epic=E1');
    // Manually tamper with state to set current_sprint=0
    const state = readStateJson();
    state.context.current_sprint = 0;
    fs.writeFileSync(
      nodePath.join(tmpDir, 'prd-lifecycle/state.json'),
      JSON.stringify(state, null, 2),
    );
    // Orient should show warning
    const { stdout } = brain();
    expect(stdout).toContain('Sprint counter is 0');
  });

  // --- TYPED EVENT SYNTAX ---

  it('supports typed event syntax (BUILD_STARTED)', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=typed-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('START_SPRINT', 'epicId=E1');
    const { stdout, exitCode } = brain('BUILD_STARTED');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('build');
  });

  // --- ALL-COMPLETE HINT ---

  it('shows all-complete hint at retro_done when no epics remain', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=hint-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    brain('step=phase1_spawned');
    brain('step=ceremony1_complete');
    brain('step=ceremony2_complete', 'epics_remaining=["E1"]');
    brain('step=phase1_complete');
    brain('step=sprint_setup', 'current_epic=E1');
    brain('step=sprint_build');
    brain('step=sprint_build_done');
    brain('step=sprint_verify');
    brain('step=sprint_verify_done');
    brain('step=sprint_arch_review');
    brain('step=sprint_arch_done');
    brain('step=sprint_review_done');
    const { stdout } = brain('step=sprint_retro_done', 'add-completed=E1');
    expect(stdout).toContain('should transition to release');
  });

  // --- NO TMP FILES LEFT ---

  it('no .tmp files remain after operations', () => {
    brain('--init');
    brain('step=scaffold_complete', 'team_name=tmp-test');
    brain('step=domains_detected', 'has_ai_ml=false', 'has_analytics=false', 'has_frontend_ui=false');
    const files = fs.readdirSync(nodePath.join(tmpDir, 'prd-lifecycle'));
    const tmpFiles = files.filter((f: string) => f.endsWith('.tmp'));
    expect(tmpFiles).toEqual([]);
  });
});
