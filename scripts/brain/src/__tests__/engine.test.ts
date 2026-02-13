import { describe, it, expect } from 'vitest';
import { createBrainMachine, processEvent } from '../engine.js';
import { stateValueToPath } from '../utils.js';
import type { BrainEvent } from '../types.js';

// Helper: walk the full spec phase to get to execution.refinement
function walkToRefinement(): any {
  let snap = processEvent(null, null).snapshot;
  snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test' }).snapshot;
  snap = processEvent(snap, { type: 'DOMAINS_DETECTED', has_ai_ml: false, has_analytics: false, has_frontend_ui: false }).snapshot;
  snap = processEvent(snap, { type: 'PHASE1_SPAWNED' }).snapshot;
  snap = processEvent(snap, { type: 'CEREMONY1_COMPLETE' }).snapshot;
  snap = processEvent(snap, { type: 'CEREMONY2_COMPLETE' }).snapshot;
  snap = processEvent(snap, { type: 'PHASE1_COMPLETE', product_backlog_count: 10 }).snapshot;
  return snap;
}

// Helper: walk one full sprint cycle (refinement → planning → sprint → retro)
function walkSprintCycle(snap: any, backlogCount: number): any {
  snap = processEvent(snap, { type: 'REFINEMENT_DONE', product_backlog_count: backlogCount }).snapshot;
  snap = processEvent(snap, { type: 'PLANNING_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'BUILD_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'BUILD_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'VERIFY_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'VERIFY_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'ARCH_REVIEW_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'ARCH_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'REVIEW_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'RETRO_DONE' }).snapshot;
  return snap;
}

describe('engine', () => {
  it('starts in specification.init', () => {
    const { snapshot } = processEvent(null, null);
    expect(stateValueToPath(snapshot.value)).toBe('specification.init');
  });

  it('walks the full happy path from init to completed (1 sprint)', () => {
    let snap = processEvent(null, null).snapshot;
    snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test' }).snapshot;
    expect(snap.context.team_name).toBe('test');
    expect(snap.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    snap = processEvent(snap, { type: 'DOMAINS_DETECTED', has_ai_ml: false, has_analytics: false, has_frontend_ui: true }).snapshot;
    expect(snap.context.has_frontend_ui).toBe(true);

    snap = processEvent(snap, { type: 'PHASE1_SPAWNED' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY1_COMPLETE' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY2_COMPLETE' }).snapshot;

    snap = processEvent(snap, { type: 'PHASE1_COMPLETE', product_backlog_count: 5 }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('execution.refinement');
    expect(snap.context.product_backlog_count).toBe(5);

    // All stories move to sprint backlog during refinement → product backlog now 0
    snap = processEvent(snap, { type: 'REFINEMENT_DONE', product_backlog_count: 0 }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('execution.sprint_planning');

    snap = processEvent(snap, { type: 'PLANNING_DONE' }).snapshot;
    expect(snap.context.current_sprint).toBe(1);
    expect(stateValueToPath(snap.value)).toBe('execution.sprint.setup');

    snap = processEvent(snap, { type: 'BUILD_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'BUILD_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_REVIEW_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'REVIEW_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'RETRO_DONE' }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('execution.sprint.retro_done');
    expect(snap.context.product_backlog_count).toBe(0);

    // Guard noRemainingStories checks context (0) → passes
    snap = processEvent(snap, { type: 'START_RELEASE', product_backlog_count: 0 }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('release.release_started');
    expect(snap.context.product_backlog_count).toBe(0);

    snap = processEvent(snap, { type: 'RELEASE_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'LIFECYCLE_COMPLETE' }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('completed');
    expect(snap.status).toBe('done');
  });

  it('rejects invalid events — BUILD_DONE at specification.init', () => {
    const snap = processEvent(null, null).snapshot;
    const result = processEvent(snap, { type: 'BUILD_DONE' });
    expect(stateValueToPath(result.snapshot.value)).toBe('specification.init');
    expect(result.changed).toBe(false);
  });

  it('guards prevent START_RELEASE when stories remain', () => {
    let snap = walkToRefinement();
    snap = walkSprintCycle(snap, 10);
    expect(stateValueToPath(snap.value)).toBe('execution.sprint.retro_done');
    // context has product_backlog_count=10 from REFINEMENT_DONE
    expect(snap.context.product_backlog_count).toBe(10);

    // START_RELEASE with product_backlog_count=5 should be rejected by noRemainingStories guard
    // Guard checks CONTEXT (which is 10), not event payload
    const result = processEvent(snap, { type: 'START_RELEASE', product_backlog_count: 5 });
    expect(stateValueToPath(result.snapshot.value)).toBe('execution.sprint.retro_done');
    expect(result.changed).toBe(false);
  });

  it('guards allow START_RELEASE when no stories remain', () => {
    let snap = walkToRefinement();
    snap = walkSprintCycle(snap, 10);

    // First update backlog count to 0 via START_REFINEMENT, then walk back to retro_done
    // Actually, we need to get to retro_done with product_backlog_count=0
    // The simplest way: manually set context then process
    // OR: walk through another cycle that sets count to 0

    // Let's use START_REFINEMENT to loop back and then get to retro with count=0
    snap = processEvent(snap, { type: 'START_REFINEMENT', product_backlog_count: 0 }).snapshot;
    // Wait — guard hasRemainingStories checks context (which is 10) → 10 > 0 → true → allowed
    // But then updateBacklogCount sets context to 0
    // Now at refinement with product_backlog_count=0
    snap = processEvent(snap, { type: 'REFINEMENT_DONE', product_backlog_count: 0 }).snapshot;
    snap = processEvent(snap, { type: 'PLANNING_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'BUILD_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'BUILD_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_REVIEW_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'REVIEW_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'RETRO_DONE' }).snapshot;
    expect(snap.context.product_backlog_count).toBe(0);

    const result = processEvent(snap, { type: 'START_RELEASE', product_backlog_count: 0 });
    expect(stateValueToPath(result.snapshot.value)).toBe('release.release_started');
    expect(result.changed).toBe(true);
  });

  it('sprint loop cycles correctly for 2 sprints with refinement', () => {
    let snap = walkToRefinement();

    // Sprint 1
    snap = walkSprintCycle(snap, 10);
    expect(snap.context.current_sprint).toBe(1);

    // Sprint 2: go through refinement again, then drain backlog to 0
    snap = processEvent(snap, { type: 'START_REFINEMENT', product_backlog_count: 5 }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('execution.refinement');
    snap = walkSprintCycle(snap, 0); // all remaining stories moved to sprint
    expect(snap.context.current_sprint).toBe(2);

    // Guard noRemainingStories checks context (0) → passes
    snap = processEvent(snap, { type: 'START_RELEASE', product_backlog_count: 0 }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('release.release_started');
  });

  it('persistence roundtrip preserves state exactly', () => {
    let snap = processEvent(null, null).snapshot;
    snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'roundtrip' }).snapshot;
    const persisted = JSON.parse(JSON.stringify(snap)); // simulate write/read
    const result = processEvent(persisted, null); // null = orient only
    expect(result.snapshot.value).toEqual(snap.value);
    expect(result.snapshot.context.team_name).toEqual(snap.context.team_name);
  });

  it('double-send: same event rejected after state advances', () => {
    let snap = processEvent(null, null).snapshot;
    snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test' }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('specification.scaffold_complete');

    // Second SCAFFOLD_COMPLETE should fail (we're no longer in init)
    const result = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test2' });
    expect(result.changed).toBe(false);
    expect(stateValueToPath(result.snapshot.value)).toBe('specification.scaffold_complete');
  });
});
