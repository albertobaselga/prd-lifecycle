import { describe, it, expect } from 'vitest';
import { parseArgs } from '../cli.js';

describe('CLI parser', () => {
  it('maps step=scaffold_complete + team_name=x to SCAFFOLD_COMPLETE event', () => {
    const result = parseArgs(['.', 'step=scaffold_complete', 'team_name=prd-x']);
    expect(result.event).toEqual({ type: 'SCAFFOLD_COMPLETE', team_name: 'prd-x' });
    expect(result.mode).toBe('transition');
  });

  it('maps step=sprint_retro_done to RETRO_DONE (no payload)', () => {
    const result = parseArgs(['.', 'step=sprint_retro_done']);
    expect(result.event).toEqual({ type: 'RETRO_DONE' });
  });

  it('maps step=refinement_done to REFINEMENT_DONE', () => {
    const result = parseArgs(['.', 'step=refinement_done']);
    expect(result.event).toEqual({ type: 'REFINEMENT_DONE' });
  });

  it('maps step=sprint_planning_done to PLANNING_DONE', () => {
    const result = parseArgs(['.', 'step=sprint_planning_done']);
    expect(result.event).toEqual({ type: 'PLANNING_DONE' });
  });

  it('maps step=start_refinement with product_backlog_count to START_REFINEMENT', () => {
    const result = parseArgs(['.', 'step=start_refinement', 'product_backlog_count=5']);
    expect(result.event).toEqual({ type: 'START_REFINEMENT', product_backlog_count: 5 });
  });

  it('maps step=start_planning with product_backlog_count to START_PLANNING', () => {
    const result = parseArgs(['.', 'step=start_planning', 'product_backlog_count=5']);
    expect(result.event).toEqual({ type: 'START_PLANNING', product_backlog_count: 5 });
  });

  it('maps step=phase1_complete with product_backlog_count to PHASE1_COMPLETE', () => {
    const result = parseArgs(['.', 'step=phase1_complete', 'product_backlog_count=42']);
    expect(result.event).toEqual({ type: 'PHASE1_COMPLETE', product_backlog_count: 42 });
  });

  it('maps step=release_started with product_backlog_count to START_RELEASE', () => {
    const result = parseArgs(['.', 'step=release_started', 'product_backlog_count=0']);
    expect(result.event).toEqual({ type: 'START_RELEASE', product_backlog_count: 0 });
  });

  it('maps step=ceremony2_complete to CEREMONY2_COMPLETE (no payload)', () => {
    const result = parseArgs(['.', 'step=ceremony2_complete']);
    expect(result.event).toEqual({ type: 'CEREMONY2_COMPLETE' });
  });

  it('coerces product_backlog_count to number', () => {
    const result = parseArgs(['.', 'step=phase1_complete', 'product_backlog_count=12']);
    expect(result.event!.type).toBe('PHASE1_COMPLETE');
    expect((result.event as any).product_backlog_count).toBe(12);
    expect(typeof (result.event as any).product_backlog_count).toBe('number');
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
    const result = parseArgs(['.', 'phase=execution', 'step=phase1_complete', 'product_backlog_count=10']);
    expect(result.event!.type).toBe('PHASE1_COMPLETE');
    expect(result.ignoredFields).toContain('phase');
  });

  it('maps typed event syntax: BUILD_STARTED', () => {
    const result = parseArgs(['.', 'BUILD_STARTED']);
    expect(result.event).toEqual({ type: 'BUILD_STARTED' });
    expect(result.mode).toBe('transition');
  });

  it('maps step=release_started to START_RELEASE', () => {
    const result = parseArgs(['.', 'phase=release', 'step=release_started', 'product_backlog_count=0']);
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

  // --- Instance parameter and --list mode ---

  it('extracts instance= and returns it in ParseResult', () => {
    const result = parseArgs(['.', 'instance=my-api', 'step=scaffold_complete', 'team_name=x']);
    expect(result.instance).toBe('my-api');
    expect(result.event!.type).toBe('SCAFFOLD_COMPLETE');
    expect((result.event as any).instance).toBeUndefined(); // FIX-1: no leak
  });

  it('returns mode list for --list flag', () => {
    const result = parseArgs(['--list']);
    expect(result.mode).toBe('list');
    expect(result.instance).toBeNull();
  });

  it('--list takes precedence over --init', () => {
    const result = parseArgs(['.', '--list', '--init']);
    expect(result.mode).toBe('list');
  });

  it('instance= is available for --init mode', () => {
    const result = parseArgs(['.', 'instance=my-api', '--init']);
    expect(result.mode).toBe('init');
    expect(result.instance).toBe('my-api');
  });

  it('instance= is available for orient mode', () => {
    const result = parseArgs(['.', 'instance=my-api']);
    expect(result.mode).toBe('orient');
    expect(result.instance).toBe('my-api');
  });

  it('instance= does not appear in ignoredFields (extracted before event loop)', () => {
    const result = parseArgs(['.', 'instance=my-api', 'step=scaffold_complete']);
    // instance is extracted early, before event building — not reported as ignored
    expect(result.ignoredFields).not.toContain('instance');
  });
});
