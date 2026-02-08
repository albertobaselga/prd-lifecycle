# Epic Breakdown Template

Use this template when decomposing refined user stories into epics during Ceremony 2.

---

## Epic {id}: {title}

### Summary
{1-2 sentence description of what this epic delivers}

### User Stories
| Story ID | Title | Priority | Acceptance Criteria Count |
|----------|-------|----------|--------------------------|
| S-{n} | ... | P0/P1/P2 | {n} |

### Data Domain
- **Primary entities:** {tables/collections this epic owns}
- **Shared entities:** {tables/collections shared with other epics}
- **Schema changes:** {new tables, altered columns, new indexes}
- **Migration complexity:** LOW | MEDIUM | HIGH

### Architecture Scope
- **Service boundary:** {which service/module this lives in}
- **New files:** {estimated new files to create}
- **Modified files:** {estimated existing files to change}
- **Integration points:** {APIs, events, or data flows touching other epics}

### Dependencies
- **Blocked by:** {epic IDs that must complete first, or "none"}
- **Blocks:** {epic IDs that depend on this epic, or "none"}
- **Shared resources:** {files, tables, or services shared with other epics}

### Estimation
- **Sprint estimate:** {1 sprint | may need 2 sprints}
- **Data-heavy:** YES | NO (determines if data-engineer joins BUILD)
- **Risk level:** LOW | MEDIUM | HIGH
- **Risk factors:** {what could go wrong}

### Acceptance Criteria (epic-level)
1. {Criterion that proves this epic is complete}
2. {Another criterion}
...

### Notes
{Any special considerations, known unknowns, or team discussion points}
