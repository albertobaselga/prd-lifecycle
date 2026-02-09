import { describe, it, expect } from 'vitest';
import { stateValueToPath, statePathToFlatDisplay, resolveStateNode, findNearestAncestor } from '../utils.js';
import workflow from '../../../../workflow.json';

describe('stateValueToPath', () => {
  it('handles flat string value', () => {
    expect(stateValueToPath('completed')).toBe('completed');
  });

  it('handles one-level nesting', () => {
    expect(stateValueToPath({ specification: 'init' })).toBe('specification.init');
  });

  it('handles two-level nesting', () => {
    expect(stateValueToPath({ execution: { sprint: 'build' } })).toBe('execution.sprint.build');
  });

  it('handles execution.phase1_complete (one level, not sprint)', () => {
    expect(stateValueToPath({ execution: 'phase1_complete' })).toBe('execution.phase1_complete');
  });
});

describe('statePathToFlatDisplay', () => {
  it('converts single segment', () => {
    expect(statePathToFlatDisplay('completed')).toEqual({ phase: 'completed', step: 'completed' });
  });

  it('converts two segments', () => {
    expect(statePathToFlatDisplay('specification.init')).toEqual({ phase: 'specification', step: 'init' });
  });

  it('joins deep paths with underscores', () => {
    expect(statePathToFlatDisplay('execution.sprint.build')).toEqual({ phase: 'execution', step: 'sprint_build' });
  });

  it('handles release states', () => {
    expect(statePathToFlatDisplay('release.release_started')).toEqual({ phase: 'release', step: 'release_started' });
  });
});

describe('resolveStateNode', () => {
  it('finds a valid leaf state', () => {
    const node = resolveStateNode(workflow, 'specification.init');
    expect(node).toBeTruthy();
    expect(node.meta.nav.meaning).toBe('Project scaffold just created');
  });

  it('finds a deep sprint state', () => {
    const node = resolveStateNode(workflow, 'execution.sprint.build');
    expect(node).toBeTruthy();
    expect(node.meta.nav.meaning).toContain('BUILD teammates');
  });

  it('returns null for invalid path', () => {
    expect(resolveStateNode(workflow, 'specification.nonexistent')).toBeNull();
  });

  it('returns null for completely wrong path', () => {
    expect(resolveStateNode(workflow, 'foo.bar.baz')).toBeNull();
  });
});

describe('findNearestAncestor', () => {
  it('finds parent of invalid deep path', () => {
    expect(findNearestAncestor(workflow, 'execution.sprint.nonexistent')).toBe('execution.sprint');
  });

  it('finds grandparent when parent also invalid', () => {
    expect(findNearestAncestor(workflow, 'execution.nonexistent.deep')).toBe('execution');
  });

  it('falls back to initial for invalid top-level', () => {
    expect(findNearestAncestor(workflow, 'nonexistent')).toBe('specification');
  });
});
