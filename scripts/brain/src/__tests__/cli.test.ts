import { describe, it, expect } from 'vitest';
import { parseArgs } from '../cli.js';

describe('CLI parser', () => {
  it('maps step=scaffold_complete + team_name=x to SCAFFOLD_COMPLETE event', () => {
    const result = parseArgs(['.', 'step=scaffold_complete', 'team_name=prd-x']);
    expect(result.event).toEqual({ type: 'SCAFFOLD_COMPLETE', team_name: 'prd-x' });
    expect(result.mode).toBe('transition');
  });

  it('maps step=sprint_retro_done + add-completed=E1 to RETRO_DONE with epicId', () => {
    const result = parseArgs(['.', 'add-completed=E1', 'step=sprint_retro_done']);
    expect(result.event).toEqual({ type: 'RETRO_DONE', epicId: 'E1' });
  });

  it('maps step=sprint_setup + current_epic=E1 to START_SPRINT with epicId', () => {
    const result = parseArgs(['.', 'current_epic=E1', 'step=sprint_setup']);
    expect(result.event!.type).toBe('START_SPRINT');
    expect((result.event as any).epicId).toBe('E1');
  });

  it('coerces has_ai_ml=true to boolean', () => {
    const result = parseArgs(['.', 'has_ai_ml=true', 'has_analytics=false', 'has_frontend_ui=false', 'step=domains_detected']);
    expect(result.event!.type).toBe('DOMAINS_DETECTED');
    expect((result.event as any).has_ai_ml).toBe(true);
    expect((result.event as any).has_analytics).toBe(false);
  });

  it('coerces has_ai_ml=True (case-insensitive) to boolean', () => {
    const result = parseArgs(['.', 'has_ai_ml=True', 'has_analytics=FALSE', 'has_frontend_ui=false', 'step=domains_detected']);
    expect((result.event as any).has_ai_ml).toBe(true);
    expect((result.event as any).has_analytics).toBe(false);
  });

  it('parses JSON arrays for epics_remaining', () => {
    const result = parseArgs(['.', 'epics_remaining=["E1","E2"]', 'step=ceremony2_complete']);
    expect(result.event!.type).toBe('CEREMONY2_COMPLETE');
    expect((result.event as any).epics_remaining).toEqual(['E1', 'E2']);
  });

  it('returns orient mode when no step= (just project path)', () => {
    const result = parseArgs(['.']);
    expect(result.mode).toBe('orient');
    expect(result.event).toBeNull();
  });

  it('detects --init flag', () => {
    const result = parseArgs(['.', '--init']);
    expect(result.mode).toBe('init');
    expect(result.event).toBeNull();
  });

  it('silently ignores phase= key', () => {
    const result = parseArgs(['.', 'phase=execution', 'step=phase1_complete']);
    expect(result.event!.type).toBe('PHASE1_COMPLETE');
    expect(result.ignoredFields).toContain('phase');
  });

  it('silently ignores current_sprint= at retro_done', () => {
    const result = parseArgs(['.', 'current_sprint=2', 'add-completed=E1', 'step=sprint_retro_done']);
    expect(result.event!.type).toBe('RETRO_DONE');
    expect(result.ignoredFields).toContain('current_sprint');
  });

  it('maps typed event syntax: BUILD_STARTED', () => {
    const result = parseArgs(['.', 'BUILD_STARTED']);
    expect(result.event).toEqual({ type: 'BUILD_STARTED' });
    expect(result.mode).toBe('transition');
  });

  it('maps typed event syntax with payload: START_SPRINT epicId=E3', () => {
    const result = parseArgs(['.', 'START_SPRINT', 'epicId=E3']);
    expect(result.event).toEqual({ type: 'START_SPRINT', epicId: 'E3' });
  });

  it('maps step=release_started to START_RELEASE', () => {
    const result = parseArgs(['.', 'phase=release', 'step=release_started']);
    expect(result.event!.type).toBe('START_RELEASE');
  });

  it('maps step=completed to LIFECYCLE_COMPLETE', () => {
    const result = parseArgs(['.', 'phase=completed', 'step=completed']);
    expect(result.event!.type).toBe('LIFECYCLE_COMPLETE');
  });

  it('maps all simple sprint steps', () => {
    const mappings: [string, string][] = [
      ['sprint_build', 'BUILD_STARTED'],
      ['sprint_build_done', 'BUILD_DONE'],
      ['sprint_verify', 'VERIFY_STARTED'],
      ['sprint_verify_done', 'VERIFY_DONE'],
      ['sprint_arch_review', 'ARCH_REVIEW_STARTED'],
      ['sprint_arch_done', 'ARCH_DONE'],
      ['sprint_review_done', 'REVIEW_DONE'],
      ['release_done', 'RELEASE_DONE'],
    ];
    for (const [step, eventType] of mappings) {
      const result = parseArgs(['.', `step=${step}`]);
      expect(result.event!.type).toBe(eventType);
    }
  });

  it('extracts projectRoot from first argument', () => {
    const result = parseArgs(['/tmp/my-project', 'step=phase1_spawned']);
    expect(result.projectRoot).toBe('/tmp/my-project');
  });

  it('defaults projectRoot to "." when no args', () => {
    const result = parseArgs([]);
    expect(result.projectRoot).toBe('.');
    expect(result.mode).toBe('orient');
  });

  // --- Project root auto-detection (brain.sh backward compat) ---

  it('defaults projectRoot to "." when first arg is key=value (no directory)', () => {
    const result = parseArgs(['team_name=prd-test', 'step=scaffold_complete']);
    expect(result.projectRoot).toBe('.');
    expect(result.event!.type).toBe('SCAFFOLD_COMPLETE');
    expect((result.event as any).team_name).toBe('prd-test');
  });

  it('defaults projectRoot to "." when first arg is typed event', () => {
    const result = parseArgs(['BUILD_STARTED']);
    expect(result.projectRoot).toBe('.');
    expect(result.event!.type).toBe('BUILD_STARTED');
  });

  it('defaults projectRoot to "." when first arg is --init', () => {
    const result = parseArgs(['--init']);
    expect(result.projectRoot).toBe('.');
    expect(result.mode).toBe('init');
  });

  it('uses explicit directory when first arg has no "="', () => {
    const result = parseArgs(['/tmp/proj', 'step=phase1_spawned']);
    expect(result.projectRoot).toBe('/tmp/proj');
    expect(result.event!.type).toBe('PHASE1_SPAWNED');
  });
});
