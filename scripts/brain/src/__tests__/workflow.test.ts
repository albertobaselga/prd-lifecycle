import { describe, it, expect } from 'vitest';
import workflow from '../../../../workflow.json';

// --- Helpers ---

function countLeafStates(node: any): number {
  if (!node.states) return 1; // No children = leaf
  let count = 0;
  for (const child of Object.values(node.states) as any[]) {
    count += countLeafStates(child);
  }
  return count;
}

function findKeys(node: any, key: string, path = ''): string[] {
  const violations: string[] = [];
  if (key in node) {
    violations.push(path || '(root)');
  }
  if (node.states) {
    for (const [name, child] of Object.entries(node.states) as [string, any][]) {
      violations.push(...findKeys(child, key, path ? `${path}.${name}` : name));
    }
  }
  return violations;
}

function findLeafStatesWithoutNav(node: any, path = ''): string[] {
  const missing: string[] = [];
  if (!node.states) {
    // Leaf state — must have meta.nav with required fields
    const nav = node.meta?.nav;
    if (!nav) {
      missing.push(`${path}: missing meta.nav`);
    } else {
      if (!nav.resumeAt) missing.push(`${path}: missing resumeAt`);
      if (!nav.roles) missing.push(`${path}: missing roles`);
      if (!nav.meaning) missing.push(`${path}: missing meaning`);
    }
    return missing;
  }
  for (const [name, child] of Object.entries(node.states) as [string, any][]) {
    missing.push(...findLeafStatesWithoutNav(child, path ? `${path}.${name}` : name));
  }
  return missing;
}

// --- Tests ---

describe('workflow.json', () => {
  it('has exactly 20 leaf states', () => {
    const count = countLeafStates(workflow);
    expect(count).toBe(20);
  });

  it('has no "always" keys (compass invariant)', () => {
    const violations = findKeys(workflow, 'always');
    expect(violations).toEqual([]);
  });

  it('has no "onDone" keys (compass invariant)', () => {
    const violations = findKeys(workflow, 'onDone');
    expect(violations).toEqual([]);
  });

  it('every leaf state has meta.nav with required fields', () => {
    const missing = findLeafStatesWithoutNav(workflow);
    expect(missing).toEqual([]);
  });

  it('has scaffold metadata', () => {
    expect((workflow as any).meta.scaffold).toEqual(
      ['arch', 'specs', 'data', 'sprints', 'release']
    );
  });

  it('has compass invariant metadata', () => {
    expect((workflow as any).meta.invariant).toContain('compass-not-autopilot');
  });
});
