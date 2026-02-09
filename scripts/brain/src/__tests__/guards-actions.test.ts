import { describe, it, expect } from 'vitest';
import { setup, createActor, assign } from 'xstate';
import { guards } from '../guards.js';
import { actions } from '../actions.js';
import type { BrainContext } from '../types.js';

// --- Guard Tests (direct function calls) ---

describe('guards', () => {
  it('hasRemainingEpics returns true when epics remain', () => {
    expect(guards.hasRemainingEpics({ context: { epics_remaining: ['E1'] } as BrainContext })).toBe(true);
  });

  it('hasRemainingEpics returns false when empty', () => {
    expect(guards.hasRemainingEpics({ context: { epics_remaining: [] } as BrainContext })).toBe(false);
  });

  it('noRemainingEpics is inverse of hasRemainingEpics', () => {
    expect(guards.noRemainingEpics({ context: { epics_remaining: ['E1'] } as BrainContext })).toBe(false);
    expect(guards.noRemainingEpics({ context: { epics_remaining: [] } as BrainContext })).toBe(true);
  });
});

// --- Action Tests (exercised through minimal machines) ---

function defaultContext(): BrainContext {
  return {
    team_name: '',
    current_sprint: 0,
    current_epic: '',
    epics_completed: [],
    epics_remaining: [],
    has_ai_ml: false,
    has_analytics: false,
    has_frontend_ui: false,
    created_at: '',
  };
}

describe('actions', () => {
  it('completeEpic adds epic to completed and removes from remaining', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO'; epicId: string } },
      actions: { completeEpic: actions.completeEpic },
    }).createMachine({
      initial: 'a',
      context: { ...defaultContext(), epics_remaining: ['E1', 'E2'] },
      states: {
        a: { on: { DO: { target: 'b', actions: ['completeEpic'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO', epicId: 'E1' });
    const ctx = actor.getSnapshot().context;
    expect(ctx.epics_completed).toEqual(['E1']);
    expect(ctx.epics_remaining).toEqual(['E2']);
    actor.stop();
  });

  it('completeEpic is idempotent — double-complete does not duplicate', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO'; epicId: string } },
      actions: { completeEpic: actions.completeEpic },
    }).createMachine({
      initial: 'a',
      context: { ...defaultContext(), epics_completed: ['E1'], epics_remaining: ['E2'] },
      states: {
        a: { on: { DO: { target: 'b', actions: ['completeEpic'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO', epicId: 'E1' });
    const ctx = actor.getSnapshot().context;
    expect(ctx.epics_completed).toEqual(['E1']); // No duplicate
    expect(ctx.epics_remaining).toEqual(['E2']); // E2 untouched
    actor.stop();
  });

  it('incrementSprint increases counter by 1', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO' } },
      actions: { incrementSprint: actions.incrementSprint },
    }).createMachine({
      initial: 'a',
      context: { ...defaultContext(), current_sprint: 1 },
      states: {
        a: { on: { DO: { target: 'b', actions: ['incrementSprint'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO' });
    expect(actor.getSnapshot().context.current_sprint).toBe(2);
    actor.stop();
  });

  it('assignCurrentEpic sets epic from event.epicId', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO'; epicId: string } },
      actions: { assignCurrentEpic: actions.assignCurrentEpic },
    }).createMachine({
      initial: 'a',
      context: defaultContext(),
      states: {
        a: { on: { DO: { target: 'b', actions: ['assignCurrentEpic'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO', epicId: 'E3' });
    expect(actor.getSnapshot().context.current_epic).toBe('E3');
    actor.stop();
  });

  it('clearCurrentEpic resets to empty string', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO' } },
      actions: { clearCurrentEpic: actions.clearCurrentEpic },
    }).createMachine({
      initial: 'a',
      context: { ...defaultContext(), current_epic: 'E2' },
      states: {
        a: { on: { DO: { target: 'b', actions: ['clearCurrentEpic'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO' });
    expect(actor.getSnapshot().context.current_epic).toBe('');
    actor.stop();
  });

  it('assignCreatedAt sets a valid ISO timestamp', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO' } },
      actions: { assignCreatedAt: actions.assignCreatedAt },
    }).createMachine({
      initial: 'a',
      context: defaultContext(),
      states: {
        a: { on: { DO: { target: 'b', actions: ['assignCreatedAt'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO' });
    const ts = actor.getSnapshot().context.created_at;
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    actor.stop();
  });
});
