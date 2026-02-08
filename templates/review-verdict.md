# Review Verdict Template

Universal format used by ALL reviewers (pair review, QA, security, performance, code, data, architecture).

---

## Review Verdict — {review-type}

**Task:** {task-id}
**Reviewer:** {reviewer-name}
**Date:** {date}
**Sprint:** {sprint-number}
**Epic:** {epic-id}

### Verdict: APPROVE | REQUEST_CHANGES

### Files Reviewed
| File | Lines Changed | Notes |
|------|---------------|-------|
| {path} | +{added}/-{removed} | {brief note} |

### Findings

#### [CRITICAL] — {title}
**File:** {path}:{line}
**Category:** {category}
**Issue:** {detailed description of the problem}
**Impact:** {what breaks or degrades if not fixed}
**Recommendation:** {specific fix with code example if applicable}

#### [HIGH] — {title}
**File:** {path}:{line}
**Category:** {category}
**Issue:** {description}
**Recommendation:** {fix}

#### [MEDIUM] — {title}
**File:** {path}:{line}
**Category:** {category}
**Issue:** {description}
**Recommendation:** {fix}

#### [LOW] — {title}
**File:** {path}:{line}
**Category:** {category}
**Issue:** {description}
**Recommendation:** {fix}

### Severity Definitions
| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| CRITICAL | Breaks functionality, security vulnerability, data loss risk | Must fix before merge |
| HIGH | Bug, logic error, significant quality issue | Should fix before merge |
| MEDIUM | Sub-optimal pattern, maintainability concern | Fix recommended |
| LOW | Style, naming, minor improvement | Optional |

### Summary
**Total findings:** {count}
- CRITICAL: {count}
- HIGH: {count}
- MEDIUM: {count}
- LOW: {count}

**Positive observations:**
{What was done well — patterns, decisions, code quality aspects worth noting}

### Conditions for Approval
{If REQUEST_CHANGES: list specific conditions that must be met for approval}
{If APPROVE: "No blocking issues found."}
