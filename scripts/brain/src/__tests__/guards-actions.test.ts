import { describe, it, expect } from 'vitest';
import { setup, createActor, assign } from 'xstate';
import { guards } from '../guards.js';
import { actions } from '../actions.js';
import type { BrainContext } from '../types.js';

// --- Guard Tests (direct function calls) ---

describe('guards', () => {
  it('hasRemainingStories returns true when stories remain', () => {
    expect(guards.hasRemainingStories({ context: { product_backlog_count: 5 } as BrainContext })).toBe(true);
  });

  it('hasRemainingStories returns false when count is zero', () => {
    expect(guards.hasRemainingStories({ context: { product_backlog_count: 0 } as BrainContext })).toBe(false);
  });

  it('noRemainingStories is inverse of hasRemainingStories', () => {
    expect(guards.noRemainingStories({ context: { product_backlog_count: 5 } as BrainContext })).toBe(false);
    expect(guards.noRemainingStories({ context: { product_backlog_count: 0 } as BrainContext })).toBe(true);
  });
});

// --- Action Tests (exercised through minimal machines) ---

function defaultContext(): BrainContext {
  return {
    instance: '',
    team_name: '',
    current_sprint: 0,
    has_ai_ml: false,
    has_analytics: false,
    has_frontend_ui: false,
    created_at: '',
    product_backlog_count: 0,
  };
}

describe('actions', () => {
  it('updateBacklogCount sets product_backlog_count from event', () => {
    const machine = setup({
      types: {} as { context: BrainContext; events: { type: 'DO'; product_backlog_count: number } },
      actions: { updateBacklogCount: actions.updateBacklogCount },
    }).createMachine({
      initial: 'a',
      context: { ...defaultContext(), product_backlog_count: 0 },
      states: {
        a: { on: { DO: { target: 'b', actions: ['updateBacklogCount'] } } },
        b: {},
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: 'DO', product_backlog_count: 42 });
    const ctx = actor.getSnapshot().context;
    expect(ctx.product_backlog_count).toBe(42);
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
