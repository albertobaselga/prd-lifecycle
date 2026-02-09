import * as nodePath from 'path';
import { parseArgs } from './cli.js';
import { processEvent } from './engine.js';
import { readState, writeState, initializeProject, isLegacyFormat } from './persistence.js';
import { computeNavigation } from './navigation.js';
import { renderNavigationBox, renderNoStateBox, renderErrorBox } from './output.js';
import { createLogger } from './logger.js';
import { stateValueToPath, resolveStateNode, findNearestAncestor } from './utils.js';
import workflowDef from '../../../workflow.json';

function main(): void {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const projectRoot = nodePath.resolve(parsed.projectRoot);
  const logger = createLogger(projectRoot);

  logger.log(`INVOKE mode=${parsed.mode} args=[${args.join(' ')}]`);

  // Log ignored fields
  if (parsed.ignoredFields.length > 0) {
    logger.log(`DEBUG ignored fields: ${parsed.ignoredFields.join(', ')}`);
  }

  // --- INIT MODE ---
  if (parsed.mode === 'init') {
    try {
      initializeProject(projectRoot, workflowDef);
      logger.log('INIT scaffold created');
      // Read back the initialized state and show navigation
      const snapshot = readState(projectRoot);
      const nav = computeNavigation(snapshot, workflowDef);
      console.log(renderNavigationBox(snapshot, nav, projectRoot));
      process.exit(0);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.error(renderErrorBox('Init Failed', err.message));
        process.exit(1);
      }
      console.error(renderErrorBox('Init Failed', `Scaffold creation failed: ${err.message}`));
      process.exit(1);
    }
  }

  // --- READ STATE ---
  let snapshot: any;
  try {
    snapshot = readState(projectRoot);
  } catch (err: any) {
    console.error(renderErrorBox('Corrupt State', `Failed to parse state.json: ${err.message}`));
    process.exit(1);
  }

  // --- NO STATE (without --init) ---
  if (snapshot === null) {
    console.log(renderNoStateBox());
    process.exit(0);
  }

  // Note: legacy format migration is handled automatically by readState().
  // If the file was in the old brain.sh flat format, readState() converted
  // it to XState snapshot format and persisted the migrated version.

  // --- VALIDATE STATE PATH ---
  const statePath = stateValueToPath(snapshot.value);
  if (!resolveStateNode(workflowDef, statePath)) {
    const nearest = findNearestAncestor(workflowDef, statePath);
    console.error(renderErrorBox(
      'Invalid State',
      `State "${statePath}" not found in workflow.json`,
      `Nearest valid ancestor: ${nearest}\nFix: edit state.json "value" to a valid state, or delete to reinitialize`,
    ));
    process.exit(1);
  }

  logger.log(`STATE_BEFORE ${statePath}`);

  // --- ORIENT MODE (no event) ---
  if (parsed.mode === 'orient') {
    const nav = computeNavigation(snapshot, workflowDef);
    logger.log(`NAVIGATE orient ${statePath}`);
    console.log(renderNavigationBox(snapshot, nav, projectRoot));
    process.exit(0);
  }

  // --- TRANSITION MODE ---
  const event = parsed.event!;
  logger.log(`EVENT ${event.type} ${JSON.stringify(event)}`);

  const result = processEvent(snapshot, event);

  if (!result.changed) {
    // Event was rejected — list valid events for current state
    const stateNode = resolveStateNode(workflowDef, statePath);
    const validEvents = stateNode?.on ? Object.keys(stateNode.on) : [];
    console.error(renderErrorBox(
      'Event Rejected',
      `Event "${event.type}" is not valid at state "${statePath}"`,
      `Valid events: ${validEvents.join(', ') || '(none — final state)'}`,
    ));
    logger.log(`REJECTED ${event.type} at ${statePath}`);
    process.exit(1);
  }

  // --- PERSIST ---
  writeState(projectRoot, result.snapshot);
  const newPath = stateValueToPath(result.snapshot.value);
  logger.log(`STATE_AFTER ${newPath}`);

  // --- OUTPUT ---
  const nav = computeNavigation(result.snapshot, workflowDef);
  logger.log(`NAVIGATE transition ${newPath}`);
  console.log(renderNavigationBox(result.snapshot, nav, projectRoot));
  process.exit(0);
}

main();
