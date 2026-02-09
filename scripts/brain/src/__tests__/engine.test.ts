import { describe, it, expect } from 'vitest';
import { createBrainMachine, processEvent } from '../engine.js';
import { stateValueToPath } from '../utils.js';
import type { BrainEvent } from '../types.js';

// Helper: walk the full spec phase to get to execution.phase1_complete
function walkToPhase1Complete(): any {
  let snap = processEvent(null, null).snapshot;
  snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test' }).snapshot;
  snap = processEvent(snap, { type: 'DOMAINS_DETECTED', has_ai_ml: false, has_analytics: false, has_frontend_ui: false }).snapshot;
  snap = processEvent(snap, { type: 'PHASE1_SPAWNED' }).snapshot;
  snap = processEvent(snap, { type: 'CEREMONY1_COMPLETE' }).snapshot;
  snap = processEvent(snap, { type: 'CEREMONY2_COMPLETE', epics_remaining: ['E1'] }).snapshot;
  snap = processEvent(snap, { type: 'PHASE1_COMPLETE' }).snapshot;
  return snap;
}

// Helper: walk one full sprint cycle
function walkSprint(snap: any, epicId: string): any {
  snap = processEvent(snap, { type: 'START_SPRINT', epicId }).snapshot;
  snap = processEvent(snap, { type: 'BUILD_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'BUILD_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'VERIFY_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'VERIFY_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'ARCH_REVIEW_STARTED' }).snapshot;
  snap = processEvent(snap, { type: 'ARCH_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'REVIEW_DONE' }).snapshot;
  snap = processEvent(snap, { type: 'RETRO_DONE', epicId }).snapshot;
  return snap;
}

describe('engine', () => {
  it('starts in specification.init', () => {
    const { snapshot } = processEvent(null, null);
    expect(stateValueToPath(snapshot.value)).toBe('specification.init');
  });

  it('walks the full happy path from init to completed (1 epic)', () => {
    let snap = processEvent(null, null).snapshot;
    snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'test' }).snapshot;
    expect(snap.context.team_name).toBe('test');
    expect(snap.context.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    snap = processEvent(snap, { type: 'DOMAINS_DETECTED', has_ai_ml: false, has_analytics: false, has_frontend_ui: true }).snapshot;
    expect(snap.context.has_frontend_ui).toBe(true);

    snap = processEvent(snap, { type: 'PHASE1_SPAWNED' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY1_COMPLETE' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY2_COMPLETE', epics_remaining: ['E1'] }).snapshot;
    expect(snap.context.epics_remaining).toEqual(['E1']);

    snap = processEvent(snap, { type: 'PHASE1_COMPLETE' }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('execution.phase1_complete');

    snap = processEvent(snap, { type: 'START_SPRINT', epicId: 'E1' }).snapshot;
    expect(snap.context.current_sprint).toBe(1);
    expect(snap.context.current_epic).toBe('E1');

    snap = processEvent(snap, { type: 'BUILD_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'BUILD_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'VERIFY_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_REVIEW_STARTED' }).snapshot;
    snap = processEvent(snap, { type: 'ARCH_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'REVIEW_DONE' }).snapshot;
    snap = processEvent(snap, { type: 'RETRO_DONE', epicId: 'E1' }).snapshot;
    expect(snap.context.epics_completed).toEqual(['E1']);
    expect(snap.context.epics_remaining).toEqual([]);
    expect(snap.context.current_epic).toBe('');

    // No epics remaining → START_RELEASE
    snap = processEvent(snap, { type: 'START_RELEASE' }).snapshot;
    expect(stateValueToPath(snap.value)).toBe('release.release_started');

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

  it('guards prevent START_SPRINT when no epics remain', () => {
    // Walk to retro_done with no remaining epics (1-epic cycle)
    let snap = walkToPhase1Complete();
    snap = walkSprint(snap, 'E1');
    expect(stateValueToPath(snap.value)).toBe('execution.sprint.retro_done');
    expect(snap.context.epics_remaining).toEqual([]);

    // START_SPRINT should be rejected by guard
    const result = processEvent(snap, { type: 'START_SPRINT', epicId: '' });
    expect(stateValueToPath(result.snapshot.value)).toBe('execution.sprint.retro_done');
    expect(result.changed).toBe(false);
  });

  it('guards allow START_RELEASE when no epics remain', () => {
    let snap = walkToPhase1Complete();
    snap = walkSprint(snap, 'E1');

    const result = processEvent(snap, { type: 'START_RELEASE' });
    expect(stateValueToPath(result.snapshot.value)).toBe('release.release_started');
    expect(result.changed).toBe(true);
  });

  it('sprint loop cycles correctly for 3 epics', () => {
    // Setup with 3 epics
    let snap = processEvent(null, null).snapshot;
    snap = processEvent(snap, { type: 'SCAFFOLD_COMPLETE', team_name: 'multi' }).snapshot;
    snap = processEvent(snap, { type: 'DOMAINS_DETECTED', has_ai_ml: false, has_analytics: false, has_frontend_ui: false }).snapshot;
    snap = processEvent(snap, { type: 'PHASE1_SPAWNED' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY1_COMPLETE' }).snapshot;
    snap = processEvent(snap, { type: 'CEREMONY2_COMPLETE', epics_remaining: ['E1', 'E2', 'E3'] }).snapshot;
    snap = processEvent(snap, { type: 'PHASE1_COMPLETE' }).snapshot;

    // Sprint 1: E1
    snap = walkSprint(snap, 'E1');
    expect(snap.context.current_sprint).toBe(1);
    expect(snap.context.epics_completed).toEqual(['E1']);
    expect(snap.context.epics_remaining).toEqual(['E2', 'E3']);

    // Sprint 2: E2 — START_SPRINT should work (epics remain)
    snap = walkSprint(snap, 'E2');
    expect(snap.context.current_sprint).toBe(2);
    expect(snap.context.epics_completed).toEqual(['E1', 'E2']);
    expect(snap.context.epics_remaining).toEqual(['E3']);

    // Sprint 3: E3
    snap = walkSprint(snap, 'E3');
    expect(snap.context.current_sprint).toBe(3);
    expect(snap.context.epics_completed).toEqual(['E1', 'E2', 'E3']);
    expect(snap.context.epics_remaining).toEqual([]);

    // Now START_RELEASE should work
    snap = processEvent(snap, { type: 'START_RELEASE' }).snapshot;
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
