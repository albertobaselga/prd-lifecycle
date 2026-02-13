import type { BrainContext } from './types.js';

export const guards = {
  hasRemainingStories: ({ context }: { context: BrainContext }) =>
    context.product_backlog_count > 0,

  noRemainingStories: ({ context }: { context: BrainContext }) =>
    context.product_backlog_count === 0,
};
