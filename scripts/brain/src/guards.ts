import type { BrainContext } from './types.js';

export const guards = {
  hasRemainingEpics: ({ context }: { context: BrainContext }) =>
    context.epics_remaining.length > 0,

  noRemainingEpics: ({ context }: { context: BrainContext }) =>
    context.epics_remaining.length === 0,
};
