import { assign } from 'xstate';

// NOTE: XState v5 uses a single destructured object { context, event } for ALL
// implementation callbacks. XState v4 used (context, event) as separate positional args.
// Using (_, event) would silently bind the ENTIRE object to _ and event would be undefined.

export const actions = {
  assignTeamName: assign({
    team_name: ({ event }: { event: any }) => event.team_name,
  }),

  assignCreatedAt: assign({
    created_at: () => new Date().toISOString(),
  }),

  assignDomainFlags: assign({
    has_ai_ml: ({ event }: { event: any }) => event.has_ai_ml,
    has_analytics: ({ event }: { event: any }) => event.has_analytics,
    has_frontend_ui: ({ event }: { event: any }) => event.has_frontend_ui,
  }),

  assignEpicsRemaining: assign({
    epics_remaining: ({ event }: { event: any }) => event.epics_remaining,
  }),

  assignCurrentEpic: assign({
    current_epic: ({ event }: { event: any }) => event.epicId,
  }),

  incrementSprint: assign({
    current_sprint: ({ context }: { context: any }) => context.current_sprint + 1,
  }),

  // Idempotent: safe to call if epicId already in completed list
  completeEpic: assign(({ context, event }: { context: any; event: any }) => ({
    epics_completed: context.epics_completed.includes(event.epicId)
      ? context.epics_completed
      : [...context.epics_completed, event.epicId],
    epics_remaining: context.epics_remaining.filter((e: string) => e !== event.epicId),
  })),

  clearCurrentEpic: assign({
    current_epic: () => '',
  }),
};
