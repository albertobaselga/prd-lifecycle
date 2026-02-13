"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var nodePath5 = __toESM(require("path"), 1);

// src/cli.ts
var TYPED_EVENTS = /* @__PURE__ */ new Set([
  "SCAFFOLD_COMPLETE",
  "DOMAINS_DETECTED",
  "PHASE1_SPAWNED",
  "CEREMONY1_COMPLETE",
  "CEREMONY2_COMPLETE",
  "PHASE1_COMPLETE",
  "REFINEMENT_DONE",
  "PLANNING_DONE",
  "BUILD_STARTED",
  "BUILD_DONE",
  "VERIFY_STARTED",
  "VERIFY_DONE",
  "ARCH_REVIEW_STARTED",
  "ARCH_DONE",
  "REVIEW_DONE",
  "RETRO_DONE",
  "START_REFINEMENT",
  "START_PLANNING",
  "START_RELEASE",
  "RELEASE_DONE",
  "LIFECYCLE_COMPLETE"
]);
var STEP_TO_EVENT = {
  scaffold_complete: "SCAFFOLD_COMPLETE",
  domains_detected: "DOMAINS_DETECTED",
  phase1_spawned: "PHASE1_SPAWNED",
  ceremony1_complete: "CEREMONY1_COMPLETE",
  ceremony2_complete: "CEREMONY2_COMPLETE",
  phase1_complete: "PHASE1_COMPLETE",
  refinement_done: "REFINEMENT_DONE",
  sprint_planning_done: "PLANNING_DONE",
  start_refinement: "START_REFINEMENT",
  start_planning: "START_PLANNING",
  sprint_build: "BUILD_STARTED",
  sprint_build_done: "BUILD_DONE",
  sprint_verify: "VERIFY_STARTED",
  sprint_verify_done: "VERIFY_DONE",
  sprint_arch_review: "ARCH_REVIEW_STARTED",
  sprint_arch_done: "ARCH_DONE",
  sprint_review_done: "REVIEW_DONE",
  sprint_retro_done: "RETRO_DONE",
  release_started: "START_RELEASE",
  release_done: "RELEASE_DONE",
  completed: "LIFECYCLE_COMPLETE"
};
var IGNORED_FIELDS = /* @__PURE__ */ new Set(["phase", "current_sprint", "instance"]);
var NUMERIC_FIELDS = /* @__PURE__ */ new Set(["product_backlog_count"]);
function coerceValue(raw, key) {
  if (key && NUMERIC_FIELDS.has(key)) {
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }
  if (raw.toLowerCase() === "true") return true;
  if (raw.toLowerCase() === "false") return false;
  try {
    return JSON.parse(raw);
  } catch {
  }
  return raw;
}
function parseArgs(args) {
  let projectRoot = ".";
  let remaining;
  if (args[0] && !args[0].includes("=") && !TYPED_EVENTS.has(args[0]) && !args[0].startsWith("--")) {
    projectRoot = args[0];
    remaining = args.slice(1);
  } else {
    remaining = args.slice(0);
  }
  if (remaining.includes("--list")) {
    return { projectRoot, mode: "list", instance: null, event: null, ignoredFields: [] };
  }
  const kvPairs = {};
  let typedEventName = null;
  const ignoredFields = [];
  for (const arg of remaining) {
    if (arg.startsWith("--")) continue;
    const eqIdx = arg.indexOf("=");
    if (eqIdx === -1) {
      if (TYPED_EVENTS.has(arg)) {
        typedEventName = arg;
      }
      continue;
    }
    const key = arg.slice(0, eqIdx);
    const rawValue = arg.slice(eqIdx + 1);
    kvPairs[key] = coerceValue(rawValue, key);
  }
  const instanceValue = kvPairs["instance"] || null;
  delete kvPairs["instance"];
  const stepValue = kvPairs["step"];
  delete kvPairs["step"];
  if (remaining.includes("--init")) {
    return { projectRoot, mode: "init", instance: instanceValue, event: null, ignoredFields: [] };
  }
  for (const key of Object.keys(kvPairs)) {
    if (IGNORED_FIELDS.has(key)) {
      ignoredFields.push(key);
    }
  }
  if (!stepValue && !typedEventName) {
    return { projectRoot, mode: "orient", instance: instanceValue, event: null, ignoredFields };
  }
  const eventType = typedEventName || STEP_TO_EVENT[stepValue];
  if (!eventType) {
    return { projectRoot, mode: "orient", instance: instanceValue, event: null, ignoredFields };
  }
  const event = { type: eventType };
  for (const [key, value] of Object.entries(kvPairs)) {
    if (IGNORED_FIELDS.has(key)) {
      continue;
    }
    event[key] = value;
  }
  return {
    projectRoot,
    mode: "transition",
    instance: instanceValue,
    event,
    ignoredFields
  };
}

// node_modules/xstate/dev/dist/xstate-dev.esm.js
function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
}
function getDevTools() {
  const w = getGlobal();
  if (w.__xstate__) {
    return w.__xstate__;
  }
  return void 0;
}
var devToolsAdapter = (service) => {
  if (typeof window === "undefined") {
    return;
  }
  const devTools = getDevTools();
  if (devTools) {
    devTools.register(service);
  }
};

// node_modules/xstate/dist/raise-f11495d1.esm.js
var Mailbox = class {
  constructor(_process) {
    this._process = _process;
    this._active = false;
    this._current = null;
    this._last = null;
  }
  start() {
    this._active = true;
    this.flush();
  }
  clear() {
    if (this._current) {
      this._current.next = null;
      this._last = this._current;
    }
  }
  enqueue(event) {
    const enqueued = {
      value: event,
      next: null
    };
    if (this._current) {
      this._last.next = enqueued;
      this._last = enqueued;
      return;
    }
    this._current = enqueued;
    this._last = enqueued;
    if (this._active) {
      this.flush();
    }
  }
  flush() {
    while (this._current) {
      const consumed = this._current;
      this._process(consumed.value);
      this._current = consumed.next;
    }
    this._last = null;
  }
};
var STATE_DELIMITER = ".";
var TARGETLESS_KEY = "";
var NULL_EVENT = "";
var STATE_IDENTIFIER = "#";
var WILDCARD = "*";
var XSTATE_INIT = "xstate.init";
var XSTATE_ERROR = "xstate.error";
var XSTATE_STOP = "xstate.stop";
function createAfterEvent(delayRef, id) {
  return {
    type: `xstate.after.${delayRef}.${id}`
  };
}
function createDoneStateEvent(id, output) {
  return {
    type: `xstate.done.state.${id}`,
    output
  };
}
function createDoneActorEvent(invokeId, output) {
  return {
    type: `xstate.done.actor.${invokeId}`,
    output,
    actorId: invokeId
  };
}
function createErrorActorEvent(id, error) {
  return {
    type: `xstate.error.actor.${id}`,
    error,
    actorId: id
  };
}
function createInitEvent(input) {
  return {
    type: XSTATE_INIT,
    input
  };
}
function reportUnhandledError(err) {
  setTimeout(() => {
    throw err;
  });
}
var symbolObservable = (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
function matchesState(parentStateId, childStateId) {
  const parentStateValue = toStateValue(parentStateId);
  const childStateValue = toStateValue(childStateId);
  if (typeof childStateValue === "string") {
    if (typeof parentStateValue === "string") {
      return childStateValue === parentStateValue;
    }
    return false;
  }
  if (typeof parentStateValue === "string") {
    return parentStateValue in childStateValue;
  }
  return Object.keys(parentStateValue).every((key) => {
    if (!(key in childStateValue)) {
      return false;
    }
    return matchesState(parentStateValue[key], childStateValue[key]);
  });
}
function toStatePath(stateId) {
  if (isArray(stateId)) {
    return stateId;
  }
  const result = [];
  let segment = "";
  for (let i = 0; i < stateId.length; i++) {
    const char = stateId.charCodeAt(i);
    switch (char) {
      // \
      case 92:
        segment += stateId[i + 1];
        i++;
        continue;
      // .
      case 46:
        result.push(segment);
        segment = "";
        continue;
    }
    segment += stateId[i];
  }
  result.push(segment);
  return result;
}
function toStateValue(stateValue) {
  if (isMachineSnapshot(stateValue)) {
    return stateValue.value;
  }
  if (typeof stateValue !== "string") {
    return stateValue;
  }
  const statePath = toStatePath(stateValue);
  return pathToStateValue(statePath);
}
function pathToStateValue(statePath) {
  if (statePath.length === 1) {
    return statePath[0];
  }
  const value = {};
  let marker = value;
  for (let i = 0; i < statePath.length - 1; i++) {
    if (i === statePath.length - 2) {
      marker[statePath[i]] = statePath[i + 1];
    } else {
      const previous = marker;
      marker = {};
      previous[statePath[i]] = marker;
    }
  }
  return value;
}
function mapValues(collection, iteratee) {
  const result = {};
  const collectionKeys = Object.keys(collection);
  for (let i = 0; i < collectionKeys.length; i++) {
    const key = collectionKeys[i];
    result[key] = iteratee(collection[key], key, collection, i);
  }
  return result;
}
function toArrayStrict(value) {
  if (isArray(value)) {
    return value;
  }
  return [value];
}
function toArray(value) {
  if (value === void 0) {
    return [];
  }
  return toArrayStrict(value);
}
function resolveOutput(mapper, context, event, self2) {
  if (typeof mapper === "function") {
    return mapper({
      context,
      event,
      self: self2
    });
  }
  return mapper;
}
function isArray(value) {
  return Array.isArray(value);
}
function isErrorActorEvent(event) {
  return event.type.startsWith("xstate.error.actor");
}
function toTransitionConfigArray(configLike) {
  return toArrayStrict(configLike).map((transitionLike) => {
    if (typeof transitionLike === "undefined" || typeof transitionLike === "string") {
      return {
        target: transitionLike
      };
    }
    return transitionLike;
  });
}
function normalizeTarget(target) {
  if (target === void 0 || target === TARGETLESS_KEY) {
    return void 0;
  }
  return toArray(target);
}
function toObserver(nextHandler, errorHandler, completionHandler) {
  const isObserver = typeof nextHandler === "object";
  const self2 = isObserver ? nextHandler : void 0;
  return {
    next: (isObserver ? nextHandler.next : nextHandler)?.bind(self2),
    error: (isObserver ? nextHandler.error : errorHandler)?.bind(self2),
    complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self2)
  };
}
function createInvokeId(stateNodeId, index) {
  return `${index}.${stateNodeId}`;
}
function resolveReferencedActor(machine, src) {
  const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
  if (!match) {
    return machine.implementations.actors[src];
  }
  const [, indexStr, nodeId] = match;
  const node = machine.getStateNodeById(nodeId);
  const invokeConfig = node.config.invoke;
  return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
}
function matchesEventDescriptor(eventType, descriptor) {
  if (descriptor === eventType) {
    return true;
  }
  if (descriptor === WILDCARD) {
    return true;
  }
  if (!descriptor.endsWith(".*")) {
    return false;
  }
  const partialEventTokens = descriptor.split(".");
  const eventTokens = eventType.split(".");
  for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
    const partialEventToken = partialEventTokens[tokenIndex];
    const eventToken = eventTokens[tokenIndex];
    if (partialEventToken === "*") {
      const isLastToken = tokenIndex === partialEventTokens.length - 1;
      return isLastToken;
    }
    if (partialEventToken !== eventToken) {
      return false;
    }
  }
  return true;
}
function createScheduledEventId(actorRef, id) {
  return `${actorRef.sessionId}.${id}`;
}
var idCounter = 0;
function createSystem(rootActor, options) {
  const children = /* @__PURE__ */ new Map();
  const keyedActors = /* @__PURE__ */ new Map();
  const reverseKeyedActors = /* @__PURE__ */ new WeakMap();
  const inspectionObservers = /* @__PURE__ */ new Set();
  const timerMap = {};
  const {
    clock,
    logger
  } = options;
  const scheduler = {
    schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
      const scheduledEvent = {
        source,
        target,
        event,
        delay,
        id,
        startedAt: Date.now()
      };
      const scheduledEventId = createScheduledEventId(source, id);
      system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
      const timeout = clock.setTimeout(() => {
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        system._relay(source, target, event);
      }, delay);
      timerMap[scheduledEventId] = timeout;
    },
    cancel: (source, id) => {
      const scheduledEventId = createScheduledEventId(source, id);
      const timeout = timerMap[scheduledEventId];
      delete timerMap[scheduledEventId];
      delete system._snapshot._scheduledEvents[scheduledEventId];
      if (timeout !== void 0) {
        clock.clearTimeout(timeout);
      }
    },
    cancelAll: (actorRef) => {
      for (const scheduledEventId in system._snapshot._scheduledEvents) {
        const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
        if (scheduledEvent.source === actorRef) {
          scheduler.cancel(actorRef, scheduledEvent.id);
        }
      }
    }
  };
  const sendInspectionEvent = (event) => {
    if (!inspectionObservers.size) {
      return;
    }
    const resolvedInspectionEvent = {
      ...event,
      rootId: rootActor.sessionId
    };
    inspectionObservers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
  };
  const system = {
    _snapshot: {
      _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
    },
    _bookId: () => `x:${idCounter++}`,
    _register: (sessionId, actorRef) => {
      children.set(sessionId, actorRef);
      return sessionId;
    },
    _unregister: (actorRef) => {
      children.delete(actorRef.sessionId);
      const systemId = reverseKeyedActors.get(actorRef);
      if (systemId !== void 0) {
        keyedActors.delete(systemId);
        reverseKeyedActors.delete(actorRef);
      }
    },
    get: (systemId) => {
      return keyedActors.get(systemId);
    },
    getAll: () => {
      return Object.fromEntries(keyedActors.entries());
    },
    _set: (systemId, actorRef) => {
      const existing = keyedActors.get(systemId);
      if (existing && existing !== actorRef) {
        throw new Error(`Actor with system ID '${systemId}' already exists.`);
      }
      keyedActors.set(systemId, actorRef);
      reverseKeyedActors.set(actorRef, systemId);
    },
    inspect: (observerOrFn) => {
      const observer = toObserver(observerOrFn);
      inspectionObservers.add(observer);
      return {
        unsubscribe() {
          inspectionObservers.delete(observer);
        }
      };
    },
    _sendInspectionEvent: sendInspectionEvent,
    _relay: (source, target, event) => {
      system._sendInspectionEvent({
        type: "@xstate.event",
        sourceRef: source,
        actorRef: target,
        event
      });
      target._send(event);
    },
    scheduler,
    getSnapshot: () => {
      return {
        _scheduledEvents: {
          ...system._snapshot._scheduledEvents
        }
      };
    },
    start: () => {
      const scheduledEvents = system._snapshot._scheduledEvents;
      system._snapshot._scheduledEvents = {};
      for (const scheduledId in scheduledEvents) {
        const {
          source,
          target,
          event,
          delay,
          id
        } = scheduledEvents[scheduledId];
        scheduler.schedule(source, target, event, delay, id);
      }
    },
    _clock: clock,
    _logger: logger
  };
  return system;
}
var executingCustomAction = false;
var $$ACTOR_TYPE = 1;
var ProcessingStatus = /* @__PURE__ */ function(ProcessingStatus2) {
  ProcessingStatus2[ProcessingStatus2["NotStarted"] = 0] = "NotStarted";
  ProcessingStatus2[ProcessingStatus2["Running"] = 1] = "Running";
  ProcessingStatus2[ProcessingStatus2["Stopped"] = 2] = "Stopped";
  return ProcessingStatus2;
}({});
var defaultOptions = {
  clock: {
    setTimeout: (fn, ms) => {
      return setTimeout(fn, ms);
    },
    clearTimeout: (id) => {
      return clearTimeout(id);
    }
  },
  logger: console.log.bind(console),
  devTools: false
};
var Actor = class {
  /**
   * Creates a new actor instance for the given logic with the provided options,
   * if any.
   *
   * @param logic The logic to create an actor from
   * @param options Actor options
   */
  constructor(logic, options) {
    this.logic = logic;
    this._snapshot = void 0;
    this.clock = void 0;
    this.options = void 0;
    this.id = void 0;
    this.mailbox = new Mailbox(this._process.bind(this));
    this.observers = /* @__PURE__ */ new Set();
    this.eventListeners = /* @__PURE__ */ new Map();
    this.logger = void 0;
    this._processingStatus = ProcessingStatus.NotStarted;
    this._parent = void 0;
    this._syncSnapshot = void 0;
    this.ref = void 0;
    this._actorScope = void 0;
    this.systemId = void 0;
    this.sessionId = void 0;
    this.system = void 0;
    this._doneEvent = void 0;
    this.src = void 0;
    this._deferred = [];
    const resolvedOptions = {
      ...defaultOptions,
      ...options
    };
    const {
      clock,
      logger,
      parent,
      syncSnapshot,
      id,
      systemId,
      inspect
    } = resolvedOptions;
    this.system = parent ? parent.system : createSystem(this, {
      clock,
      logger
    });
    if (inspect && !parent) {
      this.system.inspect(toObserver(inspect));
    }
    this.sessionId = this.system._bookId();
    this.id = id ?? this.sessionId;
    this.logger = options?.logger ?? this.system._logger;
    this.clock = options?.clock ?? this.system._clock;
    this._parent = parent;
    this._syncSnapshot = syncSnapshot;
    this.options = resolvedOptions;
    this.src = resolvedOptions.src ?? logic;
    this.ref = this;
    this._actorScope = {
      self: this,
      id: this.id,
      sessionId: this.sessionId,
      logger: this.logger,
      defer: (fn) => {
        this._deferred.push(fn);
      },
      system: this.system,
      stopChild: (child) => {
        if (child._parent !== this) {
          throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
        }
        child._stop();
      },
      emit: (emittedEvent) => {
        const listeners = this.eventListeners.get(emittedEvent.type);
        const wildcardListener = this.eventListeners.get("*");
        if (!listeners && !wildcardListener) {
          return;
        }
        const allListeners = [...listeners ? listeners.values() : [], ...wildcardListener ? wildcardListener.values() : []];
        for (const handler of allListeners) {
          try {
            handler(emittedEvent);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
      },
      actionExecutor: (action) => {
        const exec = () => {
          this._actorScope.system._sendInspectionEvent({
            type: "@xstate.action",
            actorRef: this,
            action: {
              type: action.type,
              params: action.params
            }
          });
          if (!action.exec) {
            return;
          }
          const saveExecutingCustomAction = executingCustomAction;
          try {
            executingCustomAction = true;
            action.exec(action.info, action.params);
          } finally {
            executingCustomAction = saveExecutingCustomAction;
          }
        };
        if (this._processingStatus === ProcessingStatus.Running) {
          exec();
        } else {
          this._deferred.push(exec);
        }
      }
    };
    this.send = this.send.bind(this);
    this.system._sendInspectionEvent({
      type: "@xstate.actor",
      actorRef: this
    });
    if (systemId) {
      this.systemId = systemId;
      this.system._set(systemId, this);
    }
    this._initState(options?.snapshot ?? options?.state);
    if (systemId && this._snapshot.status !== "active") {
      this.system._unregister(this);
    }
  }
  _initState(persistedState) {
    try {
      this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
    } catch (err) {
      this._snapshot = {
        status: "error",
        output: void 0,
        error: err
      };
    }
  }
  update(snapshot, event) {
    this._snapshot = snapshot;
    let deferredFn;
    while (deferredFn = this._deferred.shift()) {
      try {
        deferredFn();
      } catch (err) {
        this._deferred.length = 0;
        this._snapshot = {
          ...snapshot,
          status: "error",
          error: err
        };
      }
    }
    switch (this._snapshot.status) {
      case "active":
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        break;
      case "done":
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        this._stopProcedure();
        this._complete();
        this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
        if (this._parent) {
          this.system._relay(this, this._parent, this._doneEvent);
        }
        break;
      case "error":
        this._error(this._snapshot.error);
        break;
    }
    this.system._sendInspectionEvent({
      type: "@xstate.snapshot",
      actorRef: this,
      event,
      snapshot
    });
  }
  /**
   * Subscribe an observer to an actor’s snapshot values.
   *
   * @remarks
   * The observer will receive the actor’s snapshot value when it is emitted.
   * The observer can be:
   *
   * - A plain function that receives the latest snapshot, or
   * - An observer object whose `.next(snapshot)` method receives the latest
   *   snapshot
   *
   * @example
   *
   * ```ts
   * // Observer as a plain function
   * const subscription = actor.subscribe((snapshot) => {
   *   console.log(snapshot);
   * });
   * ```
   *
   * @example
   *
   * ```ts
   * // Observer as an object
   * const subscription = actor.subscribe({
   *   next(snapshot) {
   *     console.log(snapshot);
   *   },
   *   error(err) {
   *     // ...
   *   },
   *   complete() {
   *     // ...
   *   }
   * });
   * ```
   *
   * The return value of `actor.subscribe(observer)` is a subscription object
   * that has an `.unsubscribe()` method. You can call
   * `subscription.unsubscribe()` to unsubscribe the observer:
   *
   * @example
   *
   * ```ts
   * const subscription = actor.subscribe((snapshot) => {
   *   // ...
   * });
   *
   * // Unsubscribe the observer
   * subscription.unsubscribe();
   * ```
   *
   * When the actor is stopped, all of its observers will automatically be
   * unsubscribed.
   *
   * @param observer - Either a plain function that receives the latest
   *   snapshot, or an observer object whose `.next(snapshot)` method receives
   *   the latest snapshot
   */
  subscribe(nextListenerOrObserver, errorListener, completeListener) {
    const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
    if (this._processingStatus !== ProcessingStatus.Stopped) {
      this.observers.add(observer);
    } else {
      switch (this._snapshot.status) {
        case "done":
          try {
            observer.complete?.();
          } catch (err) {
            reportUnhandledError(err);
          }
          break;
        case "error": {
          const err = this._snapshot.error;
          if (!observer.error) {
            reportUnhandledError(err);
          } else {
            try {
              observer.error(err);
            } catch (err2) {
              reportUnhandledError(err2);
            }
          }
          break;
        }
      }
    }
    return {
      unsubscribe: () => {
        this.observers.delete(observer);
      }
    };
  }
  on(type, handler) {
    let listeners = this.eventListeners.get(type);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      this.eventListeners.set(type, listeners);
    }
    const wrappedHandler = handler.bind(void 0);
    listeners.add(wrappedHandler);
    return {
      unsubscribe: () => {
        listeners.delete(wrappedHandler);
      }
    };
  }
  /** Starts the Actor from the initial state */
  start() {
    if (this._processingStatus === ProcessingStatus.Running) {
      return this;
    }
    if (this._syncSnapshot) {
      this.subscribe({
        next: (snapshot) => {
          if (snapshot.status === "active") {
            this.system._relay(this, this._parent, {
              type: `xstate.snapshot.${this.id}`,
              snapshot
            });
          }
        },
        error: () => {
        }
      });
    }
    this.system._register(this.sessionId, this);
    if (this.systemId) {
      this.system._set(this.systemId, this);
    }
    this._processingStatus = ProcessingStatus.Running;
    const initEvent = createInitEvent(this.options.input);
    this.system._sendInspectionEvent({
      type: "@xstate.event",
      sourceRef: this._parent,
      actorRef: this,
      event: initEvent
    });
    const status = this._snapshot.status;
    switch (status) {
      case "done":
        this.update(this._snapshot, initEvent);
        return this;
      case "error":
        this._error(this._snapshot.error);
        return this;
    }
    if (!this._parent) {
      this.system.start();
    }
    if (this.logic.start) {
      try {
        this.logic.start(this._snapshot, this._actorScope);
      } catch (err) {
        this._snapshot = {
          ...this._snapshot,
          status: "error",
          error: err
        };
        this._error(err);
        return this;
      }
    }
    this.update(this._snapshot, initEvent);
    if (this.options.devTools) {
      this.attachDevTools();
    }
    this.mailbox.start();
    return this;
  }
  _process(event) {
    let nextState;
    let caughtError;
    try {
      nextState = this.logic.transition(this._snapshot, event, this._actorScope);
    } catch (err) {
      caughtError = {
        err
      };
    }
    if (caughtError) {
      const {
        err
      } = caughtError;
      this._snapshot = {
        ...this._snapshot,
        status: "error",
        error: err
      };
      this._error(err);
      return;
    }
    this.update(nextState, event);
    if (event.type === XSTATE_STOP) {
      this._stopProcedure();
      this._complete();
    }
  }
  _stop() {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return this;
    }
    this.mailbox.clear();
    if (this._processingStatus === ProcessingStatus.NotStarted) {
      this._processingStatus = ProcessingStatus.Stopped;
      return this;
    }
    this.mailbox.enqueue({
      type: XSTATE_STOP
    });
    return this;
  }
  /** Stops the Actor and unsubscribe all listeners. */
  stop() {
    if (this._parent) {
      throw new Error("A non-root actor cannot be stopped directly.");
    }
    return this._stop();
  }
  _complete() {
    for (const observer of this.observers) {
      try {
        observer.complete?.();
      } catch (err) {
        reportUnhandledError(err);
      }
    }
    this.observers.clear();
    this.eventListeners.clear();
  }
  _reportError(err) {
    if (!this.observers.size) {
      if (!this._parent) {
        reportUnhandledError(err);
      }
      this.eventListeners.clear();
      return;
    }
    let reportError = false;
    for (const observer of this.observers) {
      const errorListener = observer.error;
      reportError ||= !errorListener;
      try {
        errorListener?.(err);
      } catch (err2) {
        reportUnhandledError(err2);
      }
    }
    this.observers.clear();
    this.eventListeners.clear();
    if (reportError) {
      reportUnhandledError(err);
    }
  }
  _error(err) {
    this._stopProcedure();
    this._reportError(err);
    if (this._parent) {
      this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
    }
  }
  // TODO: atm children don't belong entirely to the actor so
  // in a way - it's not even super aware of them
  // so we can't stop them from here but we really should!
  // right now, they are being stopped within the machine's transition
  // but that could throw and leave us with "orphaned" active actors
  _stopProcedure() {
    if (this._processingStatus !== ProcessingStatus.Running) {
      return this;
    }
    this.system.scheduler.cancelAll(this);
    this.mailbox.clear();
    this.mailbox = new Mailbox(this._process.bind(this));
    this._processingStatus = ProcessingStatus.Stopped;
    this.system._unregister(this);
    return this;
  }
  /** @internal */
  _send(event) {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    this.mailbox.enqueue(event);
  }
  /**
   * Sends an event to the running Actor to trigger a transition.
   *
   * @param event The event to send
   */
  send(event) {
    this.system._relay(void 0, this, event);
  }
  attachDevTools() {
    const {
      devTools
    } = this.options;
    if (devTools) {
      const resolvedDevToolsAdapter = typeof devTools === "function" ? devTools : devToolsAdapter;
      resolvedDevToolsAdapter(this);
    }
  }
  toJSON() {
    return {
      xstate$$type: $$ACTOR_TYPE,
      id: this.id
    };
  }
  /**
   * Obtain the internal state of the actor, which can be persisted.
   *
   * @remarks
   * The internal state can be persisted from any actor, not only machines.
   *
   * Note that the persisted state is not the same as the snapshot from
   * {@link Actor.getSnapshot}. Persisted state represents the internal state of
   * the actor, while snapshots represent the actor's last emitted value.
   *
   * Can be restored with {@link ActorOptions.state}
   * @see https://stately.ai/docs/persistence
   */
  getPersistedSnapshot(options) {
    return this.logic.getPersistedSnapshot(this._snapshot, options);
  }
  [symbolObservable]() {
    return this;
  }
  /**
   * Read an actor’s snapshot synchronously.
   *
   * @remarks
   * The snapshot represent an actor's last emitted value.
   *
   * When an actor receives an event, its internal state may change. An actor
   * may emit a snapshot when a state transition occurs.
   *
   * Note that some actors, such as callback actors generated with
   * `fromCallback`, will not emit snapshots.
   * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
   * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
   */
  getSnapshot() {
    return this._snapshot;
  }
};
function createActor(logic, ...[options]) {
  return new Actor(logic, options);
}
function resolveCancel(_, snapshot, actionArgs, actionParams, {
  sendId
}) {
  const resolvedSendId = typeof sendId === "function" ? sendId(actionArgs, actionParams) : sendId;
  return [snapshot, {
    sendId: resolvedSendId
  }, void 0];
}
function executeCancel(actorScope, params) {
  actorScope.defer(() => {
    actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
  });
}
function cancel(sendId) {
  function cancel2(_args, _params) {
  }
  cancel2.type = "xstate.cancel";
  cancel2.sendId = sendId;
  cancel2.resolve = resolveCancel;
  cancel2.execute = executeCancel;
  return cancel2;
}
function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
  id,
  systemId,
  src,
  input,
  syncSnapshot
}) {
  const logic = typeof src === "string" ? resolveReferencedActor(snapshot.machine, src) : src;
  const resolvedId = typeof id === "function" ? id(actionArgs) : id;
  let actorRef;
  let resolvedInput = void 0;
  if (logic) {
    resolvedInput = typeof input === "function" ? input({
      context: snapshot.context,
      event: actionArgs.event,
      self: actorScope.self
    }) : input;
    actorRef = createActor(logic, {
      id: resolvedId,
      src,
      parent: actorScope.self,
      syncSnapshot,
      systemId,
      input: resolvedInput
    });
  }
  return [cloneMachineSnapshot(snapshot, {
    children: {
      ...snapshot.children,
      [resolvedId]: actorRef
    }
  }), {
    id,
    systemId,
    actorRef,
    src,
    input: resolvedInput
  }, void 0];
}
function executeSpawn(actorScope, {
  actorRef
}) {
  if (!actorRef) {
    return;
  }
  actorScope.defer(() => {
    if (actorRef._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    actorRef.start();
  });
}
function spawnChild(...[src, {
  id,
  systemId,
  input,
  syncSnapshot = false
} = {}]) {
  function spawnChild2(_args, _params) {
  }
  spawnChild2.type = "xstate.spawnChild";
  spawnChild2.id = id;
  spawnChild2.systemId = systemId;
  spawnChild2.src = src;
  spawnChild2.input = input;
  spawnChild2.syncSnapshot = syncSnapshot;
  spawnChild2.resolve = resolveSpawn;
  spawnChild2.execute = executeSpawn;
  return spawnChild2;
}
function resolveStop(_, snapshot, args, actionParams, {
  actorRef
}) {
  const actorRefOrString = typeof actorRef === "function" ? actorRef(args, actionParams) : actorRef;
  const resolvedActorRef = typeof actorRefOrString === "string" ? snapshot.children[actorRefOrString] : actorRefOrString;
  let children = snapshot.children;
  if (resolvedActorRef) {
    children = {
      ...children
    };
    delete children[resolvedActorRef.id];
  }
  return [cloneMachineSnapshot(snapshot, {
    children
  }), resolvedActorRef, void 0];
}
function unregisterRecursively(actorScope, actorRef) {
  const snapshot = actorRef.getSnapshot();
  if (snapshot && "children" in snapshot) {
    for (const child of Object.values(snapshot.children)) {
      unregisterRecursively(actorScope, child);
    }
  }
  actorScope.system._unregister(actorRef);
}
function executeStop(actorScope, actorRef) {
  if (!actorRef) {
    return;
  }
  unregisterRecursively(actorScope, actorRef);
  if (actorRef._processingStatus !== ProcessingStatus.Running) {
    actorScope.stopChild(actorRef);
    return;
  }
  actorScope.defer(() => {
    actorScope.stopChild(actorRef);
  });
}
function stopChild(actorRef) {
  function stop2(_args, _params) {
  }
  stop2.type = "xstate.stopChild";
  stop2.actorRef = actorRef;
  stop2.resolve = resolveStop;
  stop2.execute = executeStop;
  return stop2;
}
function evaluateGuard(guard, context, event, snapshot) {
  const {
    machine
  } = snapshot;
  const isInline = typeof guard === "function";
  const resolved = isInline ? guard : machine.implementations.guards[typeof guard === "string" ? guard : guard.type];
  if (!isInline && !resolved) {
    throw new Error(`Guard '${typeof guard === "string" ? guard : guard.type}' is not implemented.'.`);
  }
  if (typeof resolved !== "function") {
    return evaluateGuard(resolved, context, event, snapshot);
  }
  const guardArgs = {
    context,
    event
  };
  const guardParams = isInline || typeof guard === "string" ? void 0 : "params" in guard ? typeof guard.params === "function" ? guard.params({
    context,
    event
  }) : guard.params : void 0;
  if (!("check" in resolved)) {
    return resolved(guardArgs, guardParams);
  }
  const builtinGuard = resolved;
  return builtinGuard.check(
    snapshot,
    guardArgs,
    resolved
    // this holds all params
  );
}
function isAtomicStateNode(stateNode) {
  return stateNode.type === "atomic" || stateNode.type === "final";
}
function getChildren(stateNode) {
  return Object.values(stateNode.states).filter((sn) => sn.type !== "history");
}
function getProperAncestors(stateNode, toStateNode) {
  const ancestors = [];
  if (toStateNode === stateNode) {
    return ancestors;
  }
  let m = stateNode.parent;
  while (m && m !== toStateNode) {
    ancestors.push(m);
    m = m.parent;
  }
  return ancestors;
}
function getAllStateNodes(stateNodes) {
  const nodeSet = new Set(stateNodes);
  const adjList = getAdjList(nodeSet);
  for (const s of nodeSet) {
    if (s.type === "compound" && (!adjList.get(s) || !adjList.get(s).length)) {
      getInitialStateNodesWithTheirAncestors(s).forEach((sn) => nodeSet.add(sn));
    } else {
      if (s.type === "parallel") {
        for (const child of getChildren(s)) {
          if (child.type === "history") {
            continue;
          }
          if (!nodeSet.has(child)) {
            const initialStates = getInitialStateNodesWithTheirAncestors(child);
            for (const initialStateNode of initialStates) {
              nodeSet.add(initialStateNode);
            }
          }
        }
      }
    }
  }
  for (const s of nodeSet) {
    let m = s.parent;
    while (m) {
      nodeSet.add(m);
      m = m.parent;
    }
  }
  return nodeSet;
}
function getValueFromAdj(baseNode, adjList) {
  const childStateNodes = adjList.get(baseNode);
  if (!childStateNodes) {
    return {};
  }
  if (baseNode.type === "compound") {
    const childStateNode = childStateNodes[0];
    if (childStateNode) {
      if (isAtomicStateNode(childStateNode)) {
        return childStateNode.key;
      }
    } else {
      return {};
    }
  }
  const stateValue = {};
  for (const childStateNode of childStateNodes) {
    stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
  }
  return stateValue;
}
function getAdjList(stateNodes) {
  const adjList = /* @__PURE__ */ new Map();
  for (const s of stateNodes) {
    if (!adjList.has(s)) {
      adjList.set(s, []);
    }
    if (s.parent) {
      if (!adjList.has(s.parent)) {
        adjList.set(s.parent, []);
      }
      adjList.get(s.parent).push(s);
    }
  }
  return adjList;
}
function getStateValue(rootNode, stateNodes) {
  const config = getAllStateNodes(stateNodes);
  return getValueFromAdj(rootNode, getAdjList(config));
}
function isInFinalState(stateNodeSet, stateNode) {
  if (stateNode.type === "compound") {
    return getChildren(stateNode).some((s) => s.type === "final" && stateNodeSet.has(s));
  }
  if (stateNode.type === "parallel") {
    return getChildren(stateNode).every((sn) => isInFinalState(stateNodeSet, sn));
  }
  return stateNode.type === "final";
}
var isStateId = (str) => str[0] === STATE_IDENTIFIER;
function getCandidates(stateNode, receivedEventType) {
  const candidates = stateNode.transitions.get(receivedEventType) || [...stateNode.transitions.keys()].filter((eventDescriptor) => matchesEventDescriptor(receivedEventType, eventDescriptor)).sort((a, b) => b.length - a.length).flatMap((key) => stateNode.transitions.get(key));
  return candidates;
}
function getDelayedTransitions(stateNode) {
  const afterConfig = stateNode.config.after;
  if (!afterConfig) {
    return [];
  }
  const mutateEntryExit = (delay) => {
    const afterEvent = createAfterEvent(delay, stateNode.id);
    const eventType = afterEvent.type;
    stateNode.entry.push(raise(afterEvent, {
      id: eventType,
      delay
    }));
    stateNode.exit.push(cancel(eventType));
    return eventType;
  };
  const delayedTransitions = Object.keys(afterConfig).flatMap((delay) => {
    const configTransition = afterConfig[delay];
    const resolvedTransition = typeof configTransition === "string" ? {
      target: configTransition
    } : configTransition;
    const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
    const eventType = mutateEntryExit(resolvedDelay);
    return toArray(resolvedTransition).map((transition) => ({
      ...transition,
      event: eventType,
      delay: resolvedDelay
    }));
  });
  return delayedTransitions.map((delayedTransition) => {
    const {
      delay
    } = delayedTransition;
    return {
      ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
      delay
    };
  });
}
function formatTransition(stateNode, descriptor, transitionConfig) {
  const normalizedTarget = normalizeTarget(transitionConfig.target);
  const reenter = transitionConfig.reenter ?? false;
  const target = resolveTarget(stateNode, normalizedTarget);
  const transition = {
    ...transitionConfig,
    actions: toArray(transitionConfig.actions),
    guard: transitionConfig.guard,
    target,
    source: stateNode,
    reenter,
    eventType: descriptor,
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: target ? target.map((t) => `#${t.id}`) : void 0
    })
  };
  return transition;
}
function formatTransitions(stateNode) {
  const transitions = /* @__PURE__ */ new Map();
  if (stateNode.config.on) {
    for (const descriptor of Object.keys(stateNode.config.on)) {
      if (descriptor === NULL_EVENT) {
        throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
      }
      const transitionsConfig = stateNode.config.on[descriptor];
      transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map((t) => formatTransition(stateNode, descriptor, t)));
    }
  }
  if (stateNode.config.onDone) {
    const descriptor = `xstate.done.state.${stateNode.id}`;
    transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
  }
  for (const invokeDef of stateNode.invoke) {
    if (invokeDef.onDone) {
      const descriptor = `xstate.done.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
    }
    if (invokeDef.onError) {
      const descriptor = `xstate.error.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map((t) => formatTransition(stateNode, descriptor, t)));
    }
    if (invokeDef.onSnapshot) {
      const descriptor = `xstate.snapshot.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map((t) => formatTransition(stateNode, descriptor, t)));
    }
  }
  for (const delayedTransition of stateNode.after) {
    let existing = transitions.get(delayedTransition.eventType);
    if (!existing) {
      existing = [];
      transitions.set(delayedTransition.eventType, existing);
    }
    existing.push(delayedTransition);
  }
  return transitions;
}
function formatInitialTransition(stateNode, _target) {
  const resolvedTarget = typeof _target === "string" ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : void 0;
  if (!resolvedTarget && _target) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
      `Initial state node "${_target}" not found on parent state node #${stateNode.id}`
    );
  }
  const transition = {
    source: stateNode,
    actions: !_target || typeof _target === "string" ? [] : toArray(_target.actions),
    eventType: null,
    reenter: false,
    target: resolvedTarget ? [resolvedTarget] : [],
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
    })
  };
  return transition;
}
function resolveTarget(stateNode, targets) {
  if (targets === void 0) {
    return void 0;
  }
  return targets.map((target) => {
    if (typeof target !== "string") {
      return target;
    }
    if (isStateId(target)) {
      return stateNode.machine.getStateNodeById(target);
    }
    const isInternalTarget = target[0] === STATE_DELIMITER;
    if (isInternalTarget && !stateNode.parent) {
      return getStateNodeByPath(stateNode, target.slice(1));
    }
    const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
    if (stateNode.parent) {
      try {
        const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
        return targetStateNode;
      } catch (err) {
        throw new Error(`Invalid transition definition for state node '${stateNode.id}':
${err.message}`);
      }
    } else {
      throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
    }
  });
}
function resolveHistoryDefaultTransition(stateNode) {
  const normalizedTarget = normalizeTarget(stateNode.config.target);
  if (!normalizedTarget) {
    return stateNode.parent.initial;
  }
  return {
    target: normalizedTarget.map((t) => typeof t === "string" ? getStateNodeByPath(stateNode.parent, t) : t)
  };
}
function isHistoryNode(stateNode) {
  return stateNode.type === "history";
}
function getInitialStateNodesWithTheirAncestors(stateNode) {
  const states = getInitialStateNodes(stateNode);
  for (const initialState of states) {
    for (const ancestor of getProperAncestors(initialState, stateNode)) {
      states.add(ancestor);
    }
  }
  return states;
}
function getInitialStateNodes(stateNode) {
  const set = /* @__PURE__ */ new Set();
  function iter(descStateNode) {
    if (set.has(descStateNode)) {
      return;
    }
    set.add(descStateNode);
    if (descStateNode.type === "compound") {
      iter(descStateNode.initial.target[0]);
    } else if (descStateNode.type === "parallel") {
      for (const child of getChildren(descStateNode)) {
        iter(child);
      }
    }
  }
  iter(stateNode);
  return set;
}
function getStateNode(stateNode, stateKey) {
  if (isStateId(stateKey)) {
    return stateNode.machine.getStateNodeById(stateKey);
  }
  if (!stateNode.states) {
    throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
  }
  const result = stateNode.states[stateKey];
  if (!result) {
    throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
  }
  return result;
}
function getStateNodeByPath(stateNode, statePath) {
  if (typeof statePath === "string" && isStateId(statePath)) {
    try {
      return stateNode.machine.getStateNodeById(statePath);
    } catch {
    }
  }
  const arrayStatePath = toStatePath(statePath).slice();
  let currentStateNode = stateNode;
  while (arrayStatePath.length) {
    const key = arrayStatePath.shift();
    if (!key.length) {
      break;
    }
    currentStateNode = getStateNode(currentStateNode, key);
  }
  return currentStateNode;
}
function getStateNodes(stateNode, stateValue) {
  if (typeof stateValue === "string") {
    const childStateNode = stateNode.states[stateValue];
    if (!childStateNode) {
      throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
    }
    return [stateNode, childStateNode];
  }
  const childStateKeys = Object.keys(stateValue);
  const childStateNodes = childStateKeys.map((subStateKey) => getStateNode(stateNode, subStateKey)).filter(Boolean);
  return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
    const subStateNode = getStateNode(stateNode, subStateKey);
    if (!subStateNode) {
      return allSubStateNodes;
    }
    const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
    return allSubStateNodes.concat(subStateNodes);
  }, []));
}
function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
  const childStateNode = getStateNode(stateNode, stateValue);
  const next = childStateNode.next(snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
  const subStateKeys = Object.keys(stateValue);
  const childStateNode = getStateNode(stateNode, subStateKeys[0]);
  const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionParallelNode(stateNode, stateValue, snapshot, event) {
  const allInnerTransitions = [];
  for (const subStateKey of Object.keys(stateValue)) {
    const subStateValue = stateValue[subStateKey];
    if (!subStateValue) {
      continue;
    }
    const subStateNode = getStateNode(stateNode, subStateKey);
    const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
    if (innerTransitions) {
      allInnerTransitions.push(...innerTransitions);
    }
  }
  if (!allInnerTransitions.length) {
    return stateNode.next(snapshot, event);
  }
  return allInnerTransitions;
}
function transitionNode(stateNode, stateValue, snapshot, event) {
  if (typeof stateValue === "string") {
    return transitionAtomicNode(stateNode, stateValue, snapshot, event);
  }
  if (Object.keys(stateValue).length === 1) {
    return transitionCompoundNode(stateNode, stateValue, snapshot, event);
  }
  return transitionParallelNode(stateNode, stateValue, snapshot, event);
}
function getHistoryNodes(stateNode) {
  return Object.keys(stateNode.states).map((key) => stateNode.states[key]).filter((sn) => sn.type === "history");
}
function isDescendant(childStateNode, parentStateNode) {
  let marker = childStateNode;
  while (marker.parent && marker.parent !== parentStateNode) {
    marker = marker.parent;
  }
  return marker.parent === parentStateNode;
}
function hasIntersection(s1, s2) {
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  for (const item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }
  for (const item of set2) {
    if (set1.has(item)) {
      return true;
    }
  }
  return false;
}
function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
  const filteredTransitions = /* @__PURE__ */ new Set();
  for (const t1 of enabledTransitions) {
    let t1Preempted = false;
    const transitionsToRemove = /* @__PURE__ */ new Set();
    for (const t2 of filteredTransitions) {
      if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
        if (isDescendant(t1.source, t2.source)) {
          transitionsToRemove.add(t2);
        } else {
          t1Preempted = true;
          break;
        }
      }
    }
    if (!t1Preempted) {
      for (const t3 of transitionsToRemove) {
        filteredTransitions.delete(t3);
      }
      filteredTransitions.add(t1);
    }
  }
  return Array.from(filteredTransitions);
}
function findLeastCommonAncestor(stateNodes) {
  const [head, ...tail] = stateNodes;
  for (const ancestor of getProperAncestors(head, void 0)) {
    if (tail.every((sn) => isDescendant(sn, ancestor))) {
      return ancestor;
    }
  }
}
function getEffectiveTargetStates(transition, historyValue) {
  if (!transition.target) {
    return [];
  }
  const targets = /* @__PURE__ */ new Set();
  for (const targetNode of transition.target) {
    if (isHistoryNode(targetNode)) {
      if (historyValue[targetNode.id]) {
        for (const node of historyValue[targetNode.id]) {
          targets.add(node);
        }
      } else {
        for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
          targets.add(node);
        }
      }
    } else {
      targets.add(targetNode);
    }
  }
  return [...targets];
}
function getTransitionDomain(transition, historyValue) {
  const targetStates = getEffectiveTargetStates(transition, historyValue);
  if (!targetStates) {
    return;
  }
  if (!transition.reenter && targetStates.every((target) => target === transition.source || isDescendant(target, transition.source))) {
    return transition.source;
  }
  const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
  if (lca) {
    return lca;
  }
  if (transition.reenter) {
    return;
  }
  return transition.source.machine.root;
}
function computeExitSet(transitions, stateNodeSet, historyValue) {
  const statesToExit = /* @__PURE__ */ new Set();
  for (const t of transitions) {
    if (t.target?.length) {
      const domain = getTransitionDomain(t, historyValue);
      if (t.reenter && t.source === domain) {
        statesToExit.add(domain);
      }
      for (const stateNode of stateNodeSet) {
        if (isDescendant(stateNode, domain)) {
          statesToExit.add(stateNode);
        }
      }
    }
  }
  return [...statesToExit];
}
function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
  if (prevStateNodes.length !== nextStateNodeSet.size) {
    return false;
  }
  for (const node of prevStateNodes) {
    if (!nextStateNodeSet.has(node)) {
      return false;
    }
  }
  return true;
}
function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
  if (!transitions.length) {
    return currentSnapshot;
  }
  const mutStateNodeSet = new Set(currentSnapshot._nodes);
  let historyValue = currentSnapshot.historyValue;
  const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
  let nextState = currentSnapshot;
  if (!isInitial) {
    [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
  }
  nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap((t) => t.actions), internalQueue, void 0);
  nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
  const nextStateNodes = [...mutStateNodeSet];
  if (nextState.status === "done") {
    nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap((state) => state.exit), internalQueue, void 0);
  }
  try {
    if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
      return nextState;
    }
    return cloneMachineSnapshot(nextState, {
      _nodes: nextStateNodes,
      historyValue
    });
  } catch (e) {
    throw e;
  }
}
function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
  if (rootNode.output === void 0) {
    return;
  }
  const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== void 0 && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : void 0);
  return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
}
function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
  let nextSnapshot = currentSnapshot;
  const statesToEnter = /* @__PURE__ */ new Set();
  const statesForDefaultEntry = /* @__PURE__ */ new Set();
  computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);
  if (isInitial) {
    statesForDefaultEntry.add(currentSnapshot.machine.root);
  }
  const completedNodes = /* @__PURE__ */ new Set();
  for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
    mutStateNodeSet.add(stateNodeToEnter);
    const actions2 = [];
    actions2.push(...stateNodeToEnter.entry);
    for (const invokeDef of stateNodeToEnter.invoke) {
      actions2.push(spawnChild(invokeDef.src, {
        ...invokeDef,
        syncSnapshot: !!invokeDef.onSnapshot
      }));
    }
    if (statesForDefaultEntry.has(stateNodeToEnter)) {
      const initialActions = stateNodeToEnter.initial.actions;
      actions2.push(...initialActions);
    }
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions2, internalQueue, stateNodeToEnter.invoke.map((invokeDef) => invokeDef.id));
    if (stateNodeToEnter.type === "final") {
      const parent = stateNodeToEnter.parent;
      let ancestorMarker = parent?.type === "parallel" ? parent : parent?.parent;
      let rootCompletionNode = ancestorMarker || stateNodeToEnter;
      if (parent?.type === "compound") {
        internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== void 0 ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : void 0));
      }
      while (ancestorMarker?.type === "parallel" && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
        completedNodes.add(ancestorMarker);
        internalQueue.push(createDoneStateEvent(ancestorMarker.id));
        rootCompletionNode = ancestorMarker;
        ancestorMarker = ancestorMarker.parent;
      }
      if (ancestorMarker) {
        continue;
      }
      nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
        status: "done",
        output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
      });
    }
  }
  return nextSnapshot;
}
function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
  for (const t of transitions) {
    const domain = getTransitionDomain(t, historyValue);
    for (const s of t.target || []) {
      if (!isHistoryNode(s) && // if the target is different than the source then it will *definitely* be entered
      (t.source !== s || // we know that the domain can't lie within the source
      // if it's different than the source then it's outside of it and it means that the target has to be entered as well
      t.source !== domain || // reentering transitions always enter the target, even if it's the source itself
      t.reenter)) {
        statesToEnter.add(s);
        statesForDefaultEntry.add(s);
      }
      addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
    }
    const targetStates = getEffectiveTargetStates(t, historyValue);
    for (const s of targetStates) {
      const ancestors = getProperAncestors(s, domain);
      if (domain?.type === "parallel") {
        ancestors.push(domain);
      }
      addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? void 0 : domain);
    }
  }
}
function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
  if (isHistoryNode(stateNode)) {
    if (historyValue[stateNode.id]) {
      const historyStateNodes = historyValue[stateNode.id];
      for (const s of historyStateNodes) {
        statesToEnter.add(s);
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s of historyStateNodes) {
        addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    } else {
      const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
      for (const s of historyDefaultTransition.target) {
        statesToEnter.add(s);
        if (historyDefaultTransition === stateNode.parent?.initial) {
          statesForDefaultEntry.add(stateNode.parent);
        }
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s of historyDefaultTransition.target) {
        addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    }
  } else {
    if (stateNode.type === "compound") {
      const [initialState] = stateNode.initial.target;
      if (!isHistoryNode(initialState)) {
        statesToEnter.add(initialState);
        statesForDefaultEntry.add(initialState);
      }
      addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
      addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
    } else {
      if (stateNode.type === "parallel") {
        for (const child of getChildren(stateNode).filter((sn) => !isHistoryNode(sn))) {
          if (![...statesToEnter].some((s) => isDescendant(s, child))) {
            if (!isHistoryNode(child)) {
              statesToEnter.add(child);
              statesForDefaultEntry.add(child);
            }
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
}
function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
  for (const anc of ancestors) {
    if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
      statesToEnter.add(anc);
    }
    if (anc.type === "parallel") {
      for (const child of getChildren(anc).filter((sn) => !isHistoryNode(sn))) {
        if (![...statesToEnter].some((s) => isDescendant(s, child))) {
          statesToEnter.add(child);
          addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
        }
      }
    }
  }
}
function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
  addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
}
function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
  let nextSnapshot = currentSnapshot;
  const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
  statesToExit.sort((a, b) => b.order - a.order);
  let changedHistory;
  for (const exitStateNode of statesToExit) {
    for (const historyNode of getHistoryNodes(exitStateNode)) {
      let predicate;
      if (historyNode.history === "deep") {
        predicate = (sn) => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
      } else {
        predicate = (sn) => {
          return sn.parent === exitStateNode;
        };
      }
      changedHistory ??= {
        ...historyValue
      };
      changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
    }
  }
  for (const s of statesToExit) {
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map((def) => stopChild(def.id))], internalQueue, void 0);
    mutStateNodeSet.delete(s);
  }
  return [nextSnapshot, changedHistory || historyValue];
}
function getAction(machine, actionType) {
  return machine.implementations.actions[actionType];
}
function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions2, extra, retries) {
  const {
    machine
  } = currentSnapshot;
  let intermediateSnapshot = currentSnapshot;
  for (const action of actions2) {
    const isInline = typeof action === "function";
    const resolvedAction = isInline ? action : (
      // the existing type of `.actions` assumes non-nullable `TExpressionAction`
      // it's fine to cast this here to get a common type and lack of errors in the rest of the code
      // our logic below makes sure that we call those 2 "variants" correctly
      getAction(machine, typeof action === "string" ? action : action.type)
    );
    const actionArgs = {
      context: intermediateSnapshot.context,
      event,
      self: actorScope.self,
      system: actorScope.system
    };
    const actionParams = isInline || typeof action === "string" ? void 0 : "params" in action ? typeof action.params === "function" ? action.params({
      context: intermediateSnapshot.context,
      event
    }) : action.params : void 0;
    if (!resolvedAction || !("resolve" in resolvedAction)) {
      actorScope.actionExecutor({
        type: typeof action === "string" ? action : typeof action === "object" ? action.type : action.name || "(anonymous)",
        info: actionArgs,
        params: actionParams,
        exec: resolvedAction
      });
      continue;
    }
    const builtinAction = resolvedAction;
    const [nextState, params, actions3] = builtinAction.resolve(
      actorScope,
      intermediateSnapshot,
      actionArgs,
      actionParams,
      resolvedAction,
      // this holds all params
      extra
    );
    intermediateSnapshot = nextState;
    if ("retryResolve" in builtinAction) {
      retries?.push([builtinAction, params]);
    }
    if ("execute" in builtinAction) {
      actorScope.actionExecutor({
        type: builtinAction.type,
        info: actionArgs,
        params,
        exec: builtinAction.execute.bind(null, actorScope, params)
      });
    }
    if (actions3) {
      intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions3, extra, retries);
    }
  }
  return intermediateSnapshot;
}
function resolveActionsAndContext(currentSnapshot, event, actorScope, actions2, internalQueue, deferredActorIds) {
  const retries = deferredActorIds ? [] : void 0;
  const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions2, {
    internalQueue,
    deferredActorIds
  }, retries);
  retries?.forEach(([builtinAction, params]) => {
    builtinAction.retryResolve(actorScope, nextState, params);
  });
  return nextState;
}
function macrostep(snapshot, event, actorScope, internalQueue) {
  let nextSnapshot = snapshot;
  const microstates = [];
  function addMicrostate(microstate, event2, transitions) {
    actorScope.system._sendInspectionEvent({
      type: "@xstate.microstep",
      actorRef: actorScope.self,
      event: event2,
      snapshot: microstate,
      _transitions: transitions
    });
    microstates.push(microstate);
  }
  if (event.type === XSTATE_STOP) {
    nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
      status: "stopped"
    });
    addMicrostate(nextSnapshot, event, []);
    return {
      snapshot: nextSnapshot,
      microstates
    };
  }
  let nextEvent = event;
  if (nextEvent.type !== XSTATE_INIT) {
    const currentEvent = nextEvent;
    const isErr = isErrorActorEvent(currentEvent);
    const transitions = selectTransitions(currentEvent, nextSnapshot);
    if (isErr && !transitions.length) {
      nextSnapshot = cloneMachineSnapshot(snapshot, {
        status: "error",
        error: currentEvent.error
      });
      addMicrostate(nextSnapshot, currentEvent, []);
      return {
        snapshot: nextSnapshot,
        microstates
      };
    }
    nextSnapshot = microstep(
      transitions,
      snapshot,
      actorScope,
      nextEvent,
      false,
      // isInitial
      internalQueue
    );
    addMicrostate(nextSnapshot, currentEvent, transitions);
  }
  let shouldSelectEventlessTransitions = true;
  while (nextSnapshot.status === "active") {
    let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];
    const previousState = enabledTransitions.length ? nextSnapshot : void 0;
    if (!enabledTransitions.length) {
      if (!internalQueue.length) {
        break;
      }
      nextEvent = internalQueue.shift();
      enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
    }
    nextSnapshot = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
    shouldSelectEventlessTransitions = nextSnapshot !== previousState;
    addMicrostate(nextSnapshot, nextEvent, enabledTransitions);
  }
  if (nextSnapshot.status !== "active") {
    stopChildren(nextSnapshot, nextEvent, actorScope);
  }
  return {
    snapshot: nextSnapshot,
    microstates
  };
}
function stopChildren(nextState, event, actorScope) {
  return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map((child) => stopChild(child)), [], void 0);
}
function selectTransitions(event, nextState) {
  return nextState.machine.getTransitionData(nextState, event);
}
function selectEventlessTransitions(nextState, event) {
  const enabledTransitionSet = /* @__PURE__ */ new Set();
  const atomicStates = nextState._nodes.filter(isAtomicStateNode);
  for (const stateNode of atomicStates) {
    loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, void 0))) {
      if (!s.always) {
        continue;
      }
      for (const transition of s.always) {
        if (transition.guard === void 0 || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
          enabledTransitionSet.add(transition);
          break loop;
        }
      }
    }
  }
  return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
}
function resolveStateValue(rootNode, stateValue) {
  const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
  return getStateValue(rootNode, [...allStateNodes]);
}
function isMachineSnapshot(value) {
  return !!value && typeof value === "object" && "machine" in value && "value" in value;
}
var machineSnapshotMatches = function matches(testValue) {
  return matchesState(testValue, this.value);
};
var machineSnapshotHasTag = function hasTag(tag) {
  return this.tags.has(tag);
};
var machineSnapshotCan = function can(event) {
  const transitionData = this.machine.getTransitionData(this, event);
  return !!transitionData?.length && // Check that at least one transition is not forbidden
  transitionData.some((t) => t.target !== void 0 || t.actions.length);
};
var machineSnapshotToJSON = function toJSON() {
  const {
    _nodes: nodes,
    tags,
    machine,
    getMeta: getMeta2,
    toJSON: toJSON2,
    can: can2,
    hasTag: hasTag2,
    matches: matches2,
    ...jsonValues
  } = this;
  return {
    ...jsonValues,
    tags: Array.from(tags)
  };
};
var machineSnapshotGetMeta = function getMeta() {
  return this._nodes.reduce((acc, stateNode) => {
    if (stateNode.meta !== void 0) {
      acc[stateNode.id] = stateNode.meta;
    }
    return acc;
  }, {});
};
function createMachineSnapshot(config, machine) {
  return {
    status: config.status,
    output: config.output,
    error: config.error,
    machine,
    context: config.context,
    _nodes: config._nodes,
    value: getStateValue(machine.root, config._nodes),
    tags: new Set(config._nodes.flatMap((sn) => sn.tags)),
    children: config.children,
    historyValue: config.historyValue || {},
    matches: machineSnapshotMatches,
    hasTag: machineSnapshotHasTag,
    can: machineSnapshotCan,
    getMeta: machineSnapshotGetMeta,
    toJSON: machineSnapshotToJSON
  };
}
function cloneMachineSnapshot(snapshot, config = {}) {
  return createMachineSnapshot({
    ...snapshot,
    ...config
  }, snapshot.machine);
}
function serializeHistoryValue(historyValue) {
  if (typeof historyValue !== "object" || historyValue === null) {
    return {};
  }
  const result = {};
  for (const key in historyValue) {
    const value = historyValue[key];
    if (Array.isArray(value)) {
      result[key] = value.map((item) => ({
        id: item.id
      }));
    }
  }
  return result;
}
function getPersistedSnapshot(snapshot, options) {
  const {
    _nodes: nodes,
    tags,
    machine,
    children,
    context,
    can: can2,
    hasTag: hasTag2,
    matches: matches2,
    getMeta: getMeta2,
    toJSON: toJSON2,
    ...jsonValues
  } = snapshot;
  const childrenJson = {};
  for (const id in children) {
    const child = children[id];
    childrenJson[id] = {
      snapshot: child.getPersistedSnapshot(options),
      src: child.src,
      systemId: child.systemId,
      syncSnapshot: child._syncSnapshot
    };
  }
  const persisted = {
    ...jsonValues,
    context: persistContext(context),
    children: childrenJson,
    historyValue: serializeHistoryValue(jsonValues.historyValue)
  };
  return persisted;
}
function persistContext(contextPart) {
  let copy;
  for (const key in contextPart) {
    const value = contextPart[key];
    if (value && typeof value === "object") {
      if ("sessionId" in value && "send" in value && "ref" in value) {
        copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
          ...contextPart
        };
        copy[key] = {
          xstate$$type: $$ACTOR_TYPE,
          id: value.id
        };
      } else {
        const result = persistContext(value);
        if (result !== value) {
          copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          };
          copy[key] = result;
        }
      }
    }
  }
  return copy ?? contextPart;
}
function resolveRaise(_, snapshot, args, actionParams, {
  event: eventOrExpr,
  id,
  delay
}, {
  internalQueue
}) {
  const delaysMap = snapshot.machine.implementations.delays;
  if (typeof eventOrExpr === "string") {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`
    );
  }
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  let resolvedDelay;
  if (typeof delay === "string") {
    const configDelay = delaysMap && delaysMap[delay];
    resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
  } else {
    resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
  }
  if (typeof resolvedDelay !== "number") {
    internalQueue.push(resolvedEvent);
  }
  return [snapshot, {
    event: resolvedEvent,
    id,
    delay: resolvedDelay
  }, void 0];
}
function executeRaise(actorScope, params) {
  const {
    event,
    delay,
    id
  } = params;
  if (typeof delay === "number") {
    actorScope.defer(() => {
      const self2 = actorScope.self;
      actorScope.system.scheduler.schedule(self2, self2, event, delay, id);
    });
    return;
  }
}
function raise(eventOrExpr, options) {
  function raise2(_args, _params) {
  }
  raise2.type = "xstate.raise";
  raise2.event = eventOrExpr;
  raise2.id = options?.id;
  raise2.delay = options?.delay;
  raise2.resolve = resolveRaise;
  raise2.execute = executeRaise;
  return raise2;
}

// node_modules/xstate/actors/dist/xstate-actors.esm.js
function fromTransition(transition, initialContext) {
  return {
    config: transition,
    transition: (snapshot, event, actorScope) => {
      return {
        ...snapshot,
        context: transition(snapshot.context, event, actorScope)
      };
    },
    getInitialSnapshot: (_, input) => {
      return {
        status: "active",
        output: void 0,
        error: void 0,
        context: typeof initialContext === "function" ? initialContext({
          input
        }) : initialContext
      };
    },
    getPersistedSnapshot: (snapshot) => snapshot,
    restoreSnapshot: (snapshot) => snapshot
  };
}
var emptyLogic = fromTransition((_) => void 0, void 0);

// node_modules/xstate/dist/assign-5d7df46f.esm.js
function createSpawner(actorScope, {
  machine,
  context
}, event, spawnedChildren) {
  const spawn = (src, options) => {
    if (typeof src === "string") {
      const logic = resolveReferencedActor(machine, src);
      if (!logic) {
        throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
      }
      const actorRef = createActor(logic, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: typeof options?.input === "function" ? options.input({
          context,
          event,
          self: actorScope.self
        }) : options?.input,
        src,
        systemId: options?.systemId
      });
      spawnedChildren[actorRef.id] = actorRef;
      return actorRef;
    } else {
      const actorRef = createActor(src, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: options?.input,
        src,
        systemId: options?.systemId
      });
      return actorRef;
    }
  };
  return (src, options) => {
    const actorRef = spawn(src, options);
    spawnedChildren[actorRef.id] = actorRef;
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
    return actorRef;
  };
}
function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
  assignment
}) {
  if (!snapshot.context) {
    throw new Error("Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.");
  }
  const spawnedChildren = {};
  const assignArgs = {
    context: snapshot.context,
    event: actionArgs.event,
    spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
    self: actorScope.self,
    system: actorScope.system
  };
  let partialUpdate = {};
  if (typeof assignment === "function") {
    partialUpdate = assignment(assignArgs, actionParams);
  } else {
    for (const key of Object.keys(assignment)) {
      const propAssignment = assignment[key];
      partialUpdate[key] = typeof propAssignment === "function" ? propAssignment(assignArgs, actionParams) : propAssignment;
    }
  }
  const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
  return [cloneMachineSnapshot(snapshot, {
    context: updatedContext,
    children: Object.keys(spawnedChildren).length ? {
      ...snapshot.children,
      ...spawnedChildren
    } : snapshot.children
  }), void 0, void 0];
}
function assign(assignment) {
  function assign2(_args, _params) {
  }
  assign2.type = "xstate.assign";
  assign2.assignment = assignment;
  assign2.resolve = resolveAssign;
  return assign2;
}

// node_modules/xstate/dist/StateMachine-d08f7a0b.esm.js
var cache = /* @__PURE__ */ new WeakMap();
function memo(object, key, fn) {
  let memoizedData = cache.get(object);
  if (!memoizedData) {
    memoizedData = {
      [key]: fn()
    };
    cache.set(object, memoizedData);
  } else if (!(key in memoizedData)) {
    memoizedData[key] = fn();
  }
  return memoizedData[key];
}
var EMPTY_OBJECT = {};
var toSerializableAction = (action) => {
  if (typeof action === "string") {
    return {
      type: action
    };
  }
  if (typeof action === "function") {
    if ("resolve" in action) {
      return {
        type: action.type
      };
    }
    return {
      type: action.name
    };
  }
  return action;
};
var StateNode = class _StateNode {
  constructor(config, options) {
    this.config = config;
    this.key = void 0;
    this.id = void 0;
    this.type = void 0;
    this.path = void 0;
    this.states = void 0;
    this.history = void 0;
    this.entry = void 0;
    this.exit = void 0;
    this.parent = void 0;
    this.machine = void 0;
    this.meta = void 0;
    this.output = void 0;
    this.order = -1;
    this.description = void 0;
    this.tags = [];
    this.transitions = void 0;
    this.always = void 0;
    this.parent = options._parent;
    this.key = options._key;
    this.machine = options._machine;
    this.path = this.parent ? this.parent.path.concat(this.key) : [];
    this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
    this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? "compound" : this.config.history ? "history" : "atomic");
    this.description = this.config.description;
    this.order = this.machine.idMap.size;
    this.machine.idMap.set(this.id, this);
    this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
      const stateNode = new _StateNode(stateConfig, {
        _parent: this,
        _key: key,
        _machine: this.machine
      });
      return stateNode;
    }) : EMPTY_OBJECT;
    if (this.type === "compound" && !this.config.initial) {
      throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
    }
    this.history = this.config.history === true ? "shallow" : this.config.history || false;
    this.entry = toArray(this.config.entry).slice();
    this.exit = toArray(this.config.exit).slice();
    this.meta = this.config.meta;
    this.output = this.type === "final" || !this.parent ? this.config.output : void 0;
    this.tags = toArray(config.tags).slice();
  }
  /** @internal */
  _initialize() {
    this.transitions = formatTransitions(this);
    if (this.config.always) {
      this.always = toTransitionConfigArray(this.config.always).map((t) => formatTransition(this, NULL_EVENT, t));
    }
    Object.keys(this.states).forEach((key) => {
      this.states[key]._initialize();
    });
  }
  /** The well-structured state node definition. */
  get definition() {
    return {
      id: this.id,
      key: this.key,
      version: this.machine.version,
      type: this.type,
      initial: this.initial ? {
        target: this.initial.target,
        source: this,
        actions: this.initial.actions.map(toSerializableAction),
        eventType: null,
        reenter: false,
        toJSON: () => ({
          target: this.initial.target.map((t) => `#${t.id}`),
          source: `#${this.id}`,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null
        })
      } : void 0,
      history: this.history,
      states: mapValues(this.states, (state) => {
        return state.definition;
      }),
      on: this.on,
      transitions: [...this.transitions.values()].flat().map((t) => ({
        ...t,
        actions: t.actions.map(toSerializableAction)
      })),
      entry: this.entry.map(toSerializableAction),
      exit: this.exit.map(toSerializableAction),
      meta: this.meta,
      order: this.order || -1,
      output: this.output,
      invoke: this.invoke,
      description: this.description,
      tags: this.tags
    };
  }
  /** @internal */
  toJSON() {
    return this.definition;
  }
  /** The logic invoked as actors by this state node. */
  get invoke() {
    return memo(this, "invoke", () => toArray(this.config.invoke).map((invokeConfig, i) => {
      const {
        src,
        systemId
      } = invokeConfig;
      const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i);
      const sourceName = typeof src === "string" ? src : `xstate.invoke.${createInvokeId(this.id, i)}`;
      return {
        ...invokeConfig,
        src: sourceName,
        id: resolvedId,
        systemId,
        toJSON() {
          const {
            onDone,
            onError,
            ...invokeDefValues
          } = invokeConfig;
          return {
            ...invokeDefValues,
            type: "xstate.invoke",
            src: sourceName,
            id: resolvedId
          };
        }
      };
    }));
  }
  /** The mapping of events to transitions. */
  get on() {
    return memo(this, "on", () => {
      const transitions = this.transitions;
      return [...transitions].flatMap(([descriptor, t]) => t.map((t2) => [descriptor, t2])).reduce((map, [descriptor, transition]) => {
        map[descriptor] = map[descriptor] || [];
        map[descriptor].push(transition);
        return map;
      }, {});
    });
  }
  get after() {
    return memo(this, "delayedTransitions", () => getDelayedTransitions(this));
  }
  get initial() {
    return memo(this, "initial", () => formatInitialTransition(this, this.config.initial));
  }
  /** @internal */
  next(snapshot, event) {
    const eventType = event.type;
    const actions2 = [];
    let selectedTransition;
    const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
    for (const candidate of candidates) {
      const {
        guard
      } = candidate;
      const resolvedContext = snapshot.context;
      let guardPassed = false;
      try {
        guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
      } catch (err) {
        const guardType = typeof guard === "string" ? guard : typeof guard === "object" ? guard.type : void 0;
        throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ""}in transition for event '${eventType}' in state node '${this.id}':
${err.message}`);
      }
      if (guardPassed) {
        actions2.push(...candidate.actions);
        selectedTransition = candidate;
        break;
      }
    }
    return selectedTransition ? [selectedTransition] : void 0;
  }
  /** All the event types accepted by this state node and its descendants. */
  get events() {
    return memo(this, "events", () => {
      const {
        states
      } = this;
      const events = new Set(this.ownEvents);
      if (states) {
        for (const stateId of Object.keys(states)) {
          const state = states[stateId];
          if (state.states) {
            for (const event of state.events) {
              events.add(`${event}`);
            }
          }
        }
      }
      return Array.from(events);
    });
  }
  /**
   * All the events that have transitions directly from this state node.
   *
   * Excludes any inert events.
   */
  get ownEvents() {
    const keys = Object.keys(Object.fromEntries(this.transitions));
    const events = new Set(keys.filter((descriptor) => {
      return this.transitions.get(descriptor).some((transition) => !(!transition.target && !transition.actions.length && !transition.reenter));
    }));
    return Array.from(events);
  }
};
var STATE_IDENTIFIER2 = "#";
var StateMachine = class _StateMachine {
  constructor(config, implementations) {
    this.config = config;
    this.version = void 0;
    this.schemas = void 0;
    this.implementations = void 0;
    this.__xstatenode = true;
    this.idMap = /* @__PURE__ */ new Map();
    this.root = void 0;
    this.id = void 0;
    this.states = void 0;
    this.events = void 0;
    this.id = config.id || "(machine)";
    this.implementations = {
      actors: implementations?.actors ?? {},
      actions: implementations?.actions ?? {},
      delays: implementations?.delays ?? {},
      guards: implementations?.guards ?? {}
    };
    this.version = this.config.version;
    this.schemas = this.config.schemas;
    this.transition = this.transition.bind(this);
    this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
    this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
    this.restoreSnapshot = this.restoreSnapshot.bind(this);
    this.start = this.start.bind(this);
    this.root = new StateNode(config, {
      _key: this.id,
      _machine: this
    });
    this.root._initialize();
    this.states = this.root.states;
    this.events = this.root.events;
  }
  /**
   * Clones this state machine with the provided implementations.
   *
   * @param implementations Options (`actions`, `guards`, `actors`, `delays`) to
   *   recursively merge with the existing options.
   * @returns A new `StateMachine` instance with the provided implementations.
   */
  provide(implementations) {
    const {
      actions: actions2,
      guards: guards2,
      actors,
      delays
    } = this.implementations;
    return new _StateMachine(this.config, {
      actions: {
        ...actions2,
        ...implementations.actions
      },
      guards: {
        ...guards2,
        ...implementations.guards
      },
      actors: {
        ...actors,
        ...implementations.actors
      },
      delays: {
        ...delays,
        ...implementations.delays
      }
    });
  }
  resolveState(config) {
    const resolvedStateValue = resolveStateValue(this.root, config.value);
    const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
    return createMachineSnapshot({
      _nodes: [...nodeSet],
      context: config.context || {},
      children: {},
      status: isInFinalState(nodeSet, this.root) ? "done" : config.status || "active",
      output: config.output,
      error: config.error,
      historyValue: config.historyValue
    }, this);
  }
  /**
   * Determines the next snapshot given the current `snapshot` and received
   * `event`. Calculates a full macrostep from all microsteps.
   *
   * @param snapshot The current snapshot
   * @param event The received event
   */
  transition(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).snapshot;
  }
  /**
   * Determines the next state given the current `state` and `event`. Calculates
   * a microstep.
   *
   * @param state The current state
   * @param event The received event
   */
  microstep(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).microstates;
  }
  getTransitionData(snapshot, event) {
    return transitionNode(this.root, snapshot.value, snapshot, event) || [];
  }
  /**
   * The initial state _before_ evaluating any microsteps. This "pre-initial"
   * state is provided to initial actions executed in the initial state.
   */
  getPreInitialState(actorScope, initEvent, internalQueue) {
    const {
      context
    } = this.config;
    const preInitial = createMachineSnapshot({
      context: typeof context !== "function" && context ? context : {},
      _nodes: [this.root],
      children: {},
      status: "active"
    }, this);
    if (typeof context === "function") {
      const assignment = ({
        spawn,
        event,
        self: self2
      }) => context({
        spawn,
        input: event.input,
        self: self2
      });
      return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, void 0);
    }
    return preInitial;
  }
  /**
   * Returns the initial `State` instance, with reference to `self` as an
   * `ActorRef`.
   */
  getInitialSnapshot(actorScope, input) {
    const initEvent = createInitEvent(input);
    const internalQueue = [];
    const preInitialState = this.getPreInitialState(actorScope, initEvent, internalQueue);
    const nextState = microstep([{
      target: [...getInitialStateNodes(this.root)],
      source: this.root,
      reenter: true,
      actions: [],
      eventType: null,
      toJSON: null
      // TODO: fix
    }], preInitialState, actorScope, initEvent, true, internalQueue);
    const {
      snapshot: macroState
    } = macrostep(nextState, initEvent, actorScope, internalQueue);
    return macroState;
  }
  start(snapshot) {
    Object.values(snapshot.children).forEach((child) => {
      if (child.getSnapshot().status === "active") {
        child.start();
      }
    });
  }
  getStateNodeById(stateId) {
    const fullPath = toStatePath(stateId);
    const relativePath = fullPath.slice(1);
    const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER2.length) : fullPath[0];
    const stateNode = this.idMap.get(resolvedStateId);
    if (!stateNode) {
      throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
    }
    return getStateNodeByPath(stateNode, relativePath);
  }
  get definition() {
    return this.root.definition;
  }
  toJSON() {
    return this.definition;
  }
  getPersistedSnapshot(snapshot, options) {
    return getPersistedSnapshot(snapshot, options);
  }
  restoreSnapshot(snapshot, _actorScope) {
    const children = {};
    const snapshotChildren = snapshot.children;
    Object.keys(snapshotChildren).forEach((actorId) => {
      const actorData = snapshotChildren[actorId];
      const childState = actorData.snapshot;
      const src = actorData.src;
      const logic = typeof src === "string" ? resolveReferencedActor(this, src) : src;
      if (!logic) {
        return;
      }
      const actorRef = createActor(logic, {
        id: actorId,
        parent: _actorScope.self,
        syncSnapshot: actorData.syncSnapshot,
        snapshot: childState,
        src,
        systemId: actorData.systemId
      });
      children[actorId] = actorRef;
    });
    function resolveHistoryReferencedState(root, referenced) {
      if (referenced instanceof StateNode) {
        return referenced;
      }
      try {
        return root.machine.getStateNodeById(referenced.id);
      } catch {
      }
    }
    function reviveHistoryValue(root, historyValue) {
      if (!historyValue || typeof historyValue !== "object") {
        return {};
      }
      const revived = {};
      for (const key in historyValue) {
        const arr = historyValue[key];
        for (const item of arr) {
          const resolved = resolveHistoryReferencedState(root, item);
          if (!resolved) {
            continue;
          }
          revived[key] ??= [];
          revived[key].push(resolved);
        }
      }
      return revived;
    }
    const revivedHistoryValue = reviveHistoryValue(this.root, snapshot.historyValue);
    const restoredSnapshot = createMachineSnapshot({
      ...snapshot,
      children,
      _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value))),
      historyValue: revivedHistoryValue
    }, this);
    const seen = /* @__PURE__ */ new Set();
    function reviveContext(contextPart, children2) {
      if (seen.has(contextPart)) {
        return;
      }
      seen.add(contextPart);
      for (const key in contextPart) {
        const value = contextPart[key];
        if (value && typeof value === "object") {
          if ("xstate$$type" in value && value.xstate$$type === $$ACTOR_TYPE) {
            contextPart[key] = children2[value.id];
            continue;
          }
          reviveContext(value, children2);
        }
      }
    }
    reviveContext(restoredSnapshot.context, children);
    return restoredSnapshot;
  }
};

// node_modules/xstate/dist/log-46a8697a.esm.js
function resolveEmit(_, snapshot, args, actionParams, {
  event: eventOrExpr
}) {
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  return [snapshot, {
    event: resolvedEvent
  }, void 0];
}
function executeEmit(actorScope, {
  event
}) {
  actorScope.defer(() => actorScope.emit(event));
}
function emit(eventOrExpr) {
  function emit2(_args, _params) {
  }
  emit2.type = "xstate.emit";
  emit2.event = eventOrExpr;
  emit2.resolve = resolveEmit;
  emit2.execute = executeEmit;
  return emit2;
}
var SpecialTargets = /* @__PURE__ */ function(SpecialTargets2) {
  SpecialTargets2["Parent"] = "#_parent";
  SpecialTargets2["Internal"] = "#_internal";
  return SpecialTargets2;
}({});
function resolveSendTo(actorScope, snapshot, args, actionParams, {
  to,
  event: eventOrExpr,
  id,
  delay
}, extra) {
  const delaysMap = snapshot.machine.implementations.delays;
  if (typeof eventOrExpr === "string") {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Only event objects may be used with sendTo; use sendTo({ type: "${eventOrExpr}" }) instead`
    );
  }
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  let resolvedDelay;
  if (typeof delay === "string") {
    const configDelay = delaysMap && delaysMap[delay];
    resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
  } else {
    resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
  }
  const resolvedTarget = typeof to === "function" ? to(args, actionParams) : to;
  let targetActorRef;
  if (typeof resolvedTarget === "string") {
    if (resolvedTarget === SpecialTargets.Parent) {
      targetActorRef = actorScope.self._parent;
    } else if (resolvedTarget === SpecialTargets.Internal) {
      targetActorRef = actorScope.self;
    } else if (resolvedTarget.startsWith("#_")) {
      targetActorRef = snapshot.children[resolvedTarget.slice(2)];
    } else {
      targetActorRef = extra.deferredActorIds?.includes(resolvedTarget) ? resolvedTarget : snapshot.children[resolvedTarget];
    }
    if (!targetActorRef) {
      throw new Error(`Unable to send event to actor '${resolvedTarget}' from machine '${snapshot.machine.id}'.`);
    }
  } else {
    targetActorRef = resolvedTarget || actorScope.self;
  }
  return [snapshot, {
    to: targetActorRef,
    targetId: typeof resolvedTarget === "string" ? resolvedTarget : void 0,
    event: resolvedEvent,
    id,
    delay: resolvedDelay
  }, void 0];
}
function retryResolveSendTo(_, snapshot, params) {
  if (typeof params.to === "string") {
    params.to = snapshot.children[params.to];
  }
}
function executeSendTo(actorScope, params) {
  actorScope.defer(() => {
    const {
      to,
      event,
      delay,
      id
    } = params;
    if (typeof delay === "number") {
      actorScope.system.scheduler.schedule(actorScope.self, to, event, delay, id);
      return;
    }
    actorScope.system._relay(
      actorScope.self,
      // at this point, in a deferred task, it should already be mutated by retryResolveSendTo
      // if it initially started as a string
      to,
      event.type === XSTATE_ERROR ? createErrorActorEvent(actorScope.self.id, event.data) : event
    );
  });
}
function sendTo(to, eventOrExpr, options) {
  function sendTo2(_args, _params) {
  }
  sendTo2.type = "xstate.sendTo";
  sendTo2.to = to;
  sendTo2.event = eventOrExpr;
  sendTo2.id = options?.id;
  sendTo2.delay = options?.delay;
  sendTo2.resolve = resolveSendTo;
  sendTo2.retryResolve = retryResolveSendTo;
  sendTo2.execute = executeSendTo;
  return sendTo2;
}
function sendParent(event, options) {
  return sendTo(SpecialTargets.Parent, event, options);
}
function resolveEnqueueActions(actorScope, snapshot, args, actionParams, {
  collect
}) {
  const actions2 = [];
  const enqueue = function enqueue2(action) {
    actions2.push(action);
  };
  enqueue.assign = (...args2) => {
    actions2.push(assign(...args2));
  };
  enqueue.cancel = (...args2) => {
    actions2.push(cancel(...args2));
  };
  enqueue.raise = (...args2) => {
    actions2.push(raise(...args2));
  };
  enqueue.sendTo = (...args2) => {
    actions2.push(sendTo(...args2));
  };
  enqueue.sendParent = (...args2) => {
    actions2.push(sendParent(...args2));
  };
  enqueue.spawnChild = (...args2) => {
    actions2.push(spawnChild(...args2));
  };
  enqueue.stopChild = (...args2) => {
    actions2.push(stopChild(...args2));
  };
  enqueue.emit = (...args2) => {
    actions2.push(emit(...args2));
  };
  collect({
    context: args.context,
    event: args.event,
    enqueue,
    check: (guard) => evaluateGuard(guard, snapshot.context, args.event, snapshot),
    self: actorScope.self,
    system: actorScope.system
  }, actionParams);
  return [snapshot, void 0, actions2];
}
function enqueueActions(collect) {
  function enqueueActions2(_args, _params) {
  }
  enqueueActions2.type = "xstate.enqueueActions";
  enqueueActions2.collect = collect;
  enqueueActions2.resolve = resolveEnqueueActions;
  return enqueueActions2;
}
function resolveLog(_, snapshot, actionArgs, actionParams, {
  value,
  label
}) {
  return [snapshot, {
    value: typeof value === "function" ? value(actionArgs, actionParams) : value,
    label
  }, void 0];
}
function executeLog({
  logger
}, {
  value,
  label
}) {
  if (label) {
    logger(label, value);
  } else {
    logger(value);
  }
}
function log(value = ({
  context,
  event
}) => ({
  context,
  event
}), label) {
  function log2(_args, _params) {
  }
  log2.type = "xstate.log";
  log2.value = value;
  log2.label = label;
  log2.resolve = resolveLog;
  log2.execute = executeLog;
  return log2;
}

// node_modules/xstate/dist/xstate.esm.js
function createMachine(config, implementations) {
  return new StateMachine(config, implementations);
}
function setup({
  schemas,
  actors,
  actions: actions2,
  guards: guards2,
  delays
}) {
  return {
    assign,
    sendTo,
    raise,
    log,
    cancel,
    stopChild,
    enqueueActions,
    emit,
    spawnChild,
    createStateConfig: (config) => config,
    createAction: (fn) => fn,
    createMachine: (config) => createMachine({
      ...config,
      schemas
    }, {
      actors,
      actions: actions2,
      guards: guards2,
      delays
    }),
    extend: (extended) => setup({
      schemas,
      actors,
      actions: {
        ...actions2,
        ...extended.actions
      },
      guards: {
        ...guards2,
        ...extended.guards
      },
      delays: {
        ...delays,
        ...extended.delays
      }
    })
  };
}

// src/guards.ts
var guards = {
  hasRemainingStories: ({ context }) => context.product_backlog_count > 0,
  noRemainingStories: ({ context }) => context.product_backlog_count === 0
};

// src/actions.ts
var actions = {
  assignTeamName: assign({
    team_name: ({ event }) => event.team_name
  }),
  assignCreatedAt: assign({
    created_at: () => (/* @__PURE__ */ new Date()).toISOString()
  }),
  assignDomainFlags: assign({
    has_ai_ml: ({ event }) => event.has_ai_ml,
    has_analytics: ({ event }) => event.has_analytics,
    has_frontend_ui: ({ event }) => event.has_frontend_ui
  }),
  incrementSprint: assign({
    current_sprint: ({ context }) => context.current_sprint + 1
  }),
  updateBacklogCount: assign({
    product_backlog_count: ({ event }) => event.product_backlog_count
  })
};

// src/utils.ts
function stateValueToPath(value) {
  if (typeof value === "string") return value;
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    throw new Error(`Unexpected parallel state value: ${JSON.stringify(value)}`);
  }
  const [key, child] = entries[0];
  return `${key}.${stateValueToPath(child)}`;
}
function statePathToFlatDisplay(dotPath) {
  const parts = dotPath.split(".");
  if (parts.length === 1) return { phase: parts[0], step: parts[0] };
  return { phase: parts[0], step: parts.slice(1).join("_") };
}
function resolveStateNode(workflowDef, dotPath) {
  const parts = dotPath.split(".");
  let node = workflowDef;
  for (const part of parts) {
    if (!node.states?.[part]) return null;
    node = node.states[part];
  }
  return node;
}
function findNearestAncestor(workflowDef, dotPath) {
  const parts = dotPath.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = parts.slice(0, i).join(".");
    if (resolveStateNode(workflowDef, candidate)) return candidate;
  }
  return workflowDef.initial || "(root)";
}

// ../../workflow.json
var workflow_default = {
  $schema: "https://stately.ai/schema/xstate-v5.json",
  id: "prdLifecycle",
  version: "2.0.0",
  initial: "specification",
  meta: {
    scaffold: ["arch", "specs", "data", "sprints", "release"],
    invariant: "compass-not-autopilot: every state is a stable checkpoint. NO always transitions, NO onDone auto-transitions. The Lead must explicitly send events to advance."
  },
  context: {
    instance: "",
    team_name: "",
    current_sprint: 0,
    has_ai_ml: false,
    has_analytics: false,
    has_frontend_ui: false,
    created_at: "",
    product_backlog_count: 0
  },
  states: {
    specification: {
      initial: "init",
      states: {
        init: {
          on: {
            SCAFFOLD_COMPLETE: {
              target: "scaffold_complete",
              actions: ["assignTeamName", "assignCreatedAt"]
            }
          },
          meta: {
            nav: {
              resumeAt: "STEP 0: INITIALIZATION \u2014 continue from step after init",
              roles: "(none yet \u2014 still initializing)",
              meaning: "Project scaffold just created",
              previous: "(start)"
            }
          }
        },
        scaffold_complete: {
          on: {
            DOMAINS_DETECTED: {
              target: "domains_detected",
              actions: ["assignDomainFlags"]
            }
          },
          meta: {
            nav: {
              resumeAt: "STEP 0: INITIALIZATION \u2014 continue from step after scaffold_complete",
              roles: "(none yet \u2014 still initializing)",
              meaning: "Team name and base state persisted",
              previous: "init"
            }
          }
        },
        domains_detected: {
          on: {
            PHASE1_SPAWNED: {
              target: "phase1_spawned",
              actions: []
            }
          },
          meta: {
            nav: {
              resumeAt: "STEP 0: INITIALIZATION \u2014 continue from step after domains_detected",
              roles: "(none yet \u2014 still initializing)",
              meaning: "Domain flags set (AI/ML, analytics, frontend)",
              previous: "scaffold_complete"
            }
          }
        },
        phase1_spawned: {
          on: {
            CEREMONY1_COMPLETE: {
              target: "ceremony1_complete",
              actions: []
            }
          },
          meta: {
            nav: {
              resumeAt: "PHASE 1 \u2014 resume ceremonies (check which ceremony is next)",
              roles: "architect, data-engineer, qa-engineer, security-reviewer, tech-writer",
              conditionalRoles: {
                has_ai_ml: "applied-ai-engineer",
                has_analytics: "data-scientist",
                has_frontend_ui: "ux-ui-designer"
              },
              meaning: "Phase 1 specialists spawned and active",
              previous: "domains_detected"
            }
          }
        },
        ceremony1_complete: {
          on: {
            CEREMONY2_COMPLETE: {
              target: "ceremony2_complete",
              actions: []
            }
          },
          meta: {
            nav: {
              resumeAt: "PHASE 1 \u2014 CEREMONY 2: Epic Decomposition",
              roles: "(Phase 1 specialists should still be active)",
              meaning: "Story Specification done \u2014 stories have acceptance criteria, initial T-shirt sizing, and profiles",
              previous: "phase1_spawned"
            }
          }
        },
        ceremony2_complete: {
          on: {
            PHASE1_COMPLETE: {
              target: "#prdLifecycle.execution",
              actions: ["updateBacklogCount"]
            }
          },
          meta: {
            nav: {
              resumeAt: "PHASE 1 \u2014 CEREMONY 3: Spec Validation + Backlog Finalization",
              roles: "(Phase 1 specialists should still be active)",
              meaning: "Epic decomposition done \u2014 epics defined, stories rationalized",
              previous: "ceremony1_complete"
            }
          }
        }
      }
    },
    execution: {
      initial: "refinement",
      states: {
        refinement: {
          on: {
            REFINEMENT_DONE: {
              target: "sprint_planning",
              actions: ["updateBacklogCount"]
            }
          },
          meta: {
            nav: {
              loadFile: "phases/phase2-sprints.md",
              resumeAt: "REFINEMENT (R.1) \u2014 detail user stories into tasks with executor team",
              roles: "scrum-master (facilitates), product-manager (clarifies PRD), executors (estimate + decompose)",
              meaning: "Execution entered \u2014 Phase 1 specialists shut down. Refine backlog stories into tasks with SP.",
              previous: "ceremony2_complete or retro_done"
            }
          }
        },
        sprint_planning: {
          on: {
            PLANNING_DONE: {
              target: "sprint",
              actions: ["incrementSprint"]
            }
          },
          meta: {
            nav: {
              loadFile: "phases/phase2-sprints.md",
              resumeAt: "SPRINT PLANNING (P.1) \u2014 decide what enters the sprint",
              roles: "scrum-master (presents velocity + capacity)",
              meaning: "Backlog refined \u2014 TL + SM decide sprint scope. NOTE: current_sprint is PREVIOUS sprint number here \u2014 incrementSprint fires AFTER PLANNING_DONE.",
              previous: "refinement"
            }
          }
        },
        sprint: {
          initial: "setup",
          states: {
            setup: {
              on: {
                BUILD_STARTED: {
                  target: "build",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE A: BUILD \u2014 spawn dev teammates (A.1)",
                  roles: "dev-1, dev-2",
                  conditionalRoles: {
                    has_ai_ml: "applied-ai-engineer (if AI stories in sprint)",
                    has_frontend_ui: "ux-ui-designer (if UI stories in sprint)",
                    has_analytics: "data-scientist (if analytics stories in sprint)"
                  },
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "Sprint directory created, stories assigned to sprint from sprint-backlog.json",
                  previous: "sprint_planning"
                }
              }
            },
            build: {
              on: {
                BUILD_DONE: {
                  target: "build_done",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE A: BUILD \u2014 continue (teammates should be working)",
                  roles: "dev-1, dev-2 (should be active)",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "BUILD teammates spawned and working",
                  previous: "sprint_setup"
                }
              }
            },
            build_done: {
              on: {
                VERIFY_STARTED: {
                  target: "verify",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE B: VERIFY + REVIEW \u2014 spawn reviewers (B.1)",
                  roles: "qa-engineer, security-reviewer, performance-reviewer, code-reviewer",
                  extraRoles: "data-engineer (if data-heavy)",
                  conditionalRoles: {
                    has_ai_ml: "applied-ai-engineer",
                    has_analytics: "data-scientist",
                    has_frontend_ui: "ux-ui-designer"
                  },
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "BUILD complete \u2014 dev teammates shut down, code committed",
                  previous: "sprint_build"
                }
              }
            },
            verify: {
              on: {
                VERIFY_DONE: {
                  target: "verify_done",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE B: VERIFY \u2014 continue (reviewers should be working)",
                  roles: "qa-engineer, security-reviewer, performance-reviewer, code-reviewer (should be active)",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "VERIFY reviewers spawned and reviewing",
                  previous: "sprint_build_done"
                }
              }
            },
            verify_done: {
              on: {
                ARCH_REVIEW_STARTED: {
                  target: "arch_review",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE C: ARCHITECTURE REVIEW \u2014 spawn architect (C.1)",
                  roles: "architect",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "All reviews complete \u2014 reviewer teammates shut down",
                  previous: "sprint_verify"
                }
              }
            },
            arch_review: {
              on: {
                ARCH_DONE: {
                  target: "arch_done",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SUB-PHASE C: ARCHITECTURE REVIEW \u2014 continue (C.2-C.4)",
                  roles: "architect (should be active)",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "Architecture review in progress",
                  previous: "sprint_verify_done"
                }
              }
            },
            arch_done: {
              on: {
                REVIEW_DONE: {
                  target: "review_done",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SPRINT REVIEW \u2014 lead writes GO/NO-GO (R.1)",
                  roles: "(lead only \u2014 no teammates needed)",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "Architecture review passed or fixes applied",
                  previous: "sprint_arch_review"
                }
              }
            },
            review_done: {
              on: {
                RETRO_DONE: {
                  target: "retro_done",
                  actions: []
                }
              },
              meta: {
                nav: {
                  loadFile: "phases/phase2-sprints.md",
                  resumeAt: "SPRINT RETROSPECTIVE \u2014 collect retro input (T.1)",
                  roles: "(message remaining active teammates)",
                  artifactRef: "sprints/sprint-{current_sprint}/sprint-backlog.json",
                  meaning: "GO/NO-GO decision made by lead",
                  previous: "sprint_arch_done"
                }
              }
            },
            retro_done: {
              on: {
                START_REFINEMENT: {
                  guard: "hasRemainingStories",
                  target: "#prdLifecycle.execution.refinement",
                  actions: ["updateBacklogCount"]
                },
                START_PLANNING: {
                  guard: "hasRemainingStories",
                  target: "#prdLifecycle.execution.sprint_planning",
                  actions: ["updateBacklogCount"]
                },
                START_RELEASE: {
                  guard: "noRemainingStories",
                  target: "#prdLifecycle.release",
                  actions: ["updateBacklogCount"]
                }
              },
              meta: {
                nav: {
                  resumeAt: "(dynamic \u2014 depends on remaining stories)",
                  resumeAtIfStories: "Execute retro-transition checklist (T.4a-T.4f) then route based on check-refinement.sh",
                  resumeAtIfNoStories: "PHASE 3: RELEASE \u2014 in SKILL.md (re-read if needed)",
                  loadFileIfStories: "phases/phase2-sprints.md",
                  roles: "(all shut down \u2014 next phase spawns fresh)",
                  lifecycleBeforeAdvancing: "Before advancing: shut down sprint teammates (devs, reviewers, architect). SM stays alive. PM shut down after Sprint Review (if still active). Re-spawn PM at next Refinement if needed.",
                  meaning: "Retrospective compiled, ACE learnings aggregated. Execute T.4a-T.4f checklist: update backlog, check epic status, brain event, record velocity, check refinement, route.",
                  previous: "sprint_review_done"
                }
              }
            }
          }
        }
      }
    },
    release: {
      initial: "release_started",
      states: {
        release_started: {
          on: {
            RELEASE_DONE: {
              target: "release_done",
              actions: []
            }
          },
          meta: {
            nav: {
              resumeAt: "PHASE 3: RELEASE \u2014 continue from release_started in SKILL.md",
              roles: "release-engineer, tech-writer",
              meaning: "Phase 3 entered \u2014 release teammates being spawned",
              previous: "sprint_retro_done"
            }
          }
        },
        release_done: {
          on: {
            LIFECYCLE_COMPLETE: {
              target: "#prdLifecycle.completed",
              actions: []
            }
          },
          meta: {
            nav: {
              resumeAt: "PHASE 3: RELEASE \u2014 continue from release_done in SKILL.md",
              roles: "(none \u2014 release artifacts complete)",
              meaning: "All release artifacts created",
              previous: "release_started"
            }
          }
        }
      }
    },
    completed: {
      type: "final",
      meta: {
        nav: {
          resumeAt: "DONE \u2014 present final report to user",
          roles: "(none)",
          meaning: "Lifecycle fully complete",
          previous: "release_done"
        }
      }
    }
  }
};

// src/engine.ts
function createBrainMachine() {
  return setup({
    types: {},
    guards,
    actions
  }).createMachine(workflow_default);
}
function processEvent(snapshot, event) {
  const machine = createBrainMachine();
  const actor = snapshot ? createActor(machine, { snapshot }).start() : createActor(machine).start();
  const beforePath = stateValueToPath(actor.getSnapshot().value);
  if (event) {
    actor.send(event);
  }
  const afterSnap = actor.getSnapshot();
  const afterPath = stateValueToPath(afterSnap.value);
  const changed = event !== null && beforePath !== afterPath;
  const persisted = actor.getPersistedSnapshot();
  actor.stop();
  return { snapshot: persisted, changed, machine };
}

// src/persistence.ts
var fs = __toESM(require("fs"), 1);
var nodePath = __toESM(require("path"), 1);
var BASE_DIR = "prd-lifecycle";
var STATE_FILE = "state.json";
function getStateDir(instance) {
  return instance ? nodePath.join(BASE_DIR, instance) : BASE_DIR;
}
function stateFilePath(projectRoot, instance) {
  return nodePath.join(projectRoot, getStateDir(instance), STATE_FILE);
}
function validateInstance(instance) {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(instance) || instance.length > 60) {
    throw new Error(
      `Invalid instance slug: "${instance}". Must be lowercase alphanumeric with hyphens (no leading/trailing hyphen), max 60 chars. Underscores should be replaced with hyphens.`
    );
  }
}
function isLegacyFormat(data) {
  return data != null && typeof data.phase === "string" && typeof data.step === "string" && data.value === void 0;
}
function migrateLegacyState(legacy) {
  const { phase, step } = legacy;
  let value;
  if (phase === "completed") {
    value = "completed";
  } else if (phase === "execution" && step === "phase1_complete") {
    value = { execution: "refinement" };
  } else if (phase === "execution" && step.startsWith("sprint_")) {
    const sprintStep = step.slice("sprint_".length);
    value = { execution: { sprint: sprintStep } };
  } else {
    value = { [phase]: step };
  }
  const context = {
    instance: legacy.instance ?? "",
    team_name: legacy.team_name ?? "",
    current_sprint: legacy.current_sprint ?? 0,
    has_ai_ml: legacy.has_ai_ml ?? false,
    has_analytics: legacy.has_analytics ?? false,
    has_frontend_ui: legacy.has_frontend_ui ?? false,
    created_at: legacy.created_at ?? "",
    product_backlog_count: legacy.product_backlog_count ?? 0
  };
  return {
    value,
    context,
    status: legacy.status ?? "active",
    historyValue: {},
    children: {}
  };
}
function readState(projectRoot, instance) {
  const filePath = stateFilePath(projectRoot, instance);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  if (raw.trim() === "") {
    throw new Error(`state.json is empty (0 bytes) at ${filePath}`);
  }
  const data = JSON.parse(raw);
  if (isLegacyFormat(data)) {
    const migrated = migrateLegacyState(data);
    writeState(projectRoot, migrated, instance);
    return migrated;
  }
  return data;
}
function writeState(projectRoot, snapshot, instance) {
  const filePath = stateFilePath(projectRoot, instance);
  const dir = nodePath.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpFile = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2));
  fs.renameSync(tmpFile, filePath);
}
function initializeProject(projectRoot, workflowDef, instance) {
  const filePath = stateFilePath(projectRoot, instance);
  if (fs.existsSync(filePath)) {
    throw new Error(`state.json already exists at ${filePath} \u2014 delete first to reinitialize`);
  }
  const baseDir = nodePath.join(projectRoot, getStateDir(instance));
  fs.mkdirSync(baseDir, { recursive: true });
  const scaffoldDirs = workflowDef.meta?.scaffold || [];
  for (const dir of scaffoldDirs) {
    fs.mkdirSync(nodePath.join(baseDir, dir), { recursive: true });
  }
  fs.writeFileSync(
    nodePath.join(baseDir, "learnings.md"),
    "# ACE Learnings \u2014 Cross-Sprint Compendium\n"
  );
  const machine = setup({
    types: {},
    guards,
    actions
  }).createMachine(workflowDef);
  const actor = createActor(machine).start();
  const snapshot = actor.getPersistedSnapshot();
  actor.stop();
  snapshot.context = {
    ...snapshot.context,
    instance,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeState(projectRoot, snapshot, instance);
}
function listInstances(projectRoot) {
  const baseDir = nodePath.join(projectRoot, BASE_DIR);
  if (!fs.existsSync(baseDir)) return [];
  const results = [];
  const legacyPath = nodePath.join(baseDir, STATE_FILE);
  if (fs.existsSync(legacyPath)) {
    results.push({ slug: "(legacy)", statePath: legacyPath, isLegacy: true });
  }
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const instanceState = nodePath.join(baseDir, entry.name, STATE_FILE);
    if (fs.existsSync(instanceState)) {
      results.push({
        slug: entry.name,
        statePath: instanceState,
        isLegacy: false
      });
    }
  }
  return results;
}

// src/navigation.ts
var nodePath2 = __toESM(require("path"), 1);
var SKILL_DIR = nodePath2.resolve(__dirname, "..", "..", "..");
function computeNavigation(snapshot, workflowDef) {
  const statePath = stateValueToPath(snapshot.value);
  const stateNode = resolveStateNode(workflowDef, statePath);
  if (!stateNode) {
    return {
      loadFile: null,
      resumeAt: `(unknown state: ${statePath})`,
      roles: "(unknown)",
      conditionalRoles: [],
      extraRoles: [],
      meaning: `State ${statePath} not found in workflow definition`,
      previous: "(unknown)",
      lifecycleBeforeAdvancing: null,
      artifactRef: null
    };
  }
  const nav = stateNode.meta?.nav;
  if (!nav) {
    return {
      loadFile: null,
      resumeAt: `(no navigation for ${statePath})`,
      roles: "(unknown)",
      conditionalRoles: [],
      extraRoles: [],
      meaning: `State ${statePath} has no navigation metadata`,
      previous: "(unknown)",
      lifecycleBeforeAdvancing: null,
      artifactRef: null
    };
  }
  const conditionalRoles = [];
  if (nav.conditionalRoles) {
    for (const [flag, role] of Object.entries(nav.conditionalRoles)) {
      if (snapshot.context[flag]) conditionalRoles.push(role);
    }
  }
  const extraRoles = nav.extraRoles ? [nav.extraRoles] : [];
  let resumeAt = nav.resumeAt;
  if (nav.resumeAtIfStories && snapshot.context.product_backlog_count > 0) {
    resumeAt = nav.resumeAtIfStories;
  } else if (nav.resumeAtIfNoStories && snapshot.context.product_backlog_count === 0) {
    resumeAt = nav.resumeAtIfNoStories;
  }
  let rawLoadFile = nav.loadFile || null;
  if (nav.loadFileIfStories && snapshot.context.product_backlog_count > 0) {
    rawLoadFile = nav.loadFileIfStories;
  }
  const loadFile = rawLoadFile ? nodePath2.join(SKILL_DIR, rawLoadFile) : null;
  const lifecycleBeforeAdvancing = nav.lifecycleBeforeAdvancing || null;
  let artifactRef = nav.artifactRef || null;
  if (artifactRef && snapshot.context.current_sprint != null) {
    artifactRef = artifactRef.replace("{current_sprint}", String(snapshot.context.current_sprint));
  }
  return {
    loadFile,
    resumeAt,
    roles: nav.roles,
    conditionalRoles,
    extraRoles,
    meaning: nav.meaning,
    previous: nav.previous,
    lifecycleBeforeAdvancing,
    artifactRef
  };
}

// src/output.ts
var fs2 = __toESM(require("fs"), 1);
var nodePath3 = __toESM(require("path"), 1);
var BOX_WIDTH = 68;
function pad(text) {
  const padded = text.padEnd(BOX_WIDTH - 4);
  return `\u2551  ${padded}\u2551`;
}
function divider() {
  return `\u2560${"\u2550".repeat(BOX_WIDTH - 2)}\u2563`;
}
function boxHeader(title) {
  const top = `\u2554${"\u2550".repeat(BOX_WIDTH - 2)}\u2557`;
  const line = pad(title);
  return `${top}
${line}`;
}
function boxFooter() {
  return `\u255A${"\u2550".repeat(BOX_WIDTH - 2)}\u255D`;
}
function blank() {
  return pad("");
}
var SPRINT_STEPS = [
  "setup",
  "build",
  "build_done",
  "verify",
  "verify_done",
  "arch_review",
  "arch_done",
  "review_done",
  "retro_done"
];
function renderCheatsheet(teamName, instance) {
  const t = teamName || "YOUR_TEAM";
  const inst = instance || "{slug}";
  const lines = [];
  lines.push("---");
  lines.push("");
  lines.push("## LEAD CHEATSHEET");
  lines.push("");
  lines.push("### Your Role");
  lines.push("You are the ORCHESTRATOR. You NEVER write code yourself.");
  lines.push("You delegate ALL work to teammates and make binding decisions.");
  lines.push("");
  lines.push("### Team API");
  lines.push("");
  lines.push("To spawn a teammate (assign work to a specialist):");
  lines.push(`  Task(team_name="${t}", name="role", subagent_type="general-purpose", prompt="preamble+task")`);
  lines.push(`  Always include: role preamble + learnings.md + artifact dir + SendMessage response protocol`);
  lines.push(`  Artifact dir: prd-lifecycle/${inst}/`);
  lines.push("");
  lines.push("To message a teammate (communicate directly):");
  lines.push('  SendMessage(type="message", recipient="NAME", content="...", summary="5-10 words")');
  lines.push("");
  lines.push("To notify all teammates (use sparingly \u2014 costs scale with team size):");
  lines.push('  SendMessage(type="broadcast", content="...", summary="5-10 words")');
  lines.push("");
  lines.push("To shut down a teammate (end their session gracefully):");
  lines.push('  SendMessage(type="shutdown_request", recipient="NAME")');
  lines.push("  Then wait for their shutdown_response before proceeding");
  lines.push("");
  lines.push("To create a task (track work in shared list):");
  lines.push('  TaskCreate(subject="...", description="...", activeForm="...ing")');
  lines.push("");
  lines.push("To assign a task (give ownership to teammate):");
  lines.push('  TaskUpdate(taskId="ID", owner="NAME")');
  lines.push("");
  lines.push("To check all tasks (see progress and blockers):");
  lines.push("  TaskList()");
  lines.push("");
  lines.push("### Your Rules");
  lines.push("- Your plain text output is INVISIBLE to teammates \u2192 ALWAYS use SendMessage");
  lines.push("- Include role preamble + learnings.md in EVERY teammate spawn prompt");
  lines.push("- Transition handshake: VERIFY \u2192 UPDATE \u2192 ORIENT \u2192 LOAD \u2192 EXECUTE");
  lines.push("- Max iterations: 3 ceremony rounds, 3 fix cycles, 5 QA cycles");
  lines.push("- If confused or after compaction \u2192 run brain (no args) immediately");
  return lines.join("\n");
}
function renderNavigationBox(snapshot, nav, projectRoot, instance) {
  const statePath = stateValueToPath(snapshot.value);
  const { phase, step } = statePathToFlatDisplay(statePath);
  const ctx = snapshot.context;
  const inst = instance || ctx.instance || void 0;
  const lines = [];
  lines.push("# BRAIN \u2014 Navigation");
  lines.push("");
  lines.push("## Position");
  lines.push(`Phase: ${phase}`);
  lines.push(`Step: ${step}`);
  lines.push(`Team: ${ctx.team_name || "(not set)"}`);
  if (inst) {
    lines.push(`Instance: ${inst}`);
  }
  if (statePath.startsWith("execution.sprint.")) {
    lines.push(`Sprint: ${ctx.current_sprint}`);
    lines.push(`Backlog: ${ctx.product_backlog_count} stories remaining`);
  }
  lines.push("");
  lines.push("## Came From");
  lines.push(`Previous: ${nav.previous}`);
  lines.push(`Meaning: ${nav.meaning}`);
  lines.push("");
  lines.push("## Go To");
  if (nav.loadFile) {
    lines.push(`Load: ${nav.loadFile}`);
    if (!fs2.existsSync(nav.loadFile)) {
      lines.push("WARNING: Load file not found!");
    }
  }
  lines.push(`Resume at: ${nav.resumeAt}`);
  lines.push(`Roles: ${nav.roles}`);
  if (nav.conditionalRoles.length > 0) {
    lines.push(`Conditional: ${nav.conditionalRoles.join(", ")}`);
  }
  if (nav.extraRoles.length > 0) {
    lines.push(`Extra: ${nav.extraRoles.join(", ")}`);
  }
  lines.push("");
  if (nav.artifactRef) {
    lines.push("## Sprint Artifact");
    lines.push(`Sprint backlog: ${nav.artifactRef}`);
    lines.push("Read this file to recover sprint context (stories, tasks, progress) after compaction.");
    lines.push("");
  }
  if (nav.lifecycleBeforeAdvancing) {
    lines.push("## Teammate Lifecycle");
    lines.push(nav.lifecycleBeforeAdvancing);
    lines.push("");
  }
  if (statePath.startsWith("execution.sprint.")) {
    const sprintStep = statePath.split(".").pop();
    const stepIdx = SPRINT_STEPS.indexOf(sprintStep);
    if (stepIdx >= 0) {
      lines.push("## Sprint Progress");
      lines.push(`Step ${stepIdx + 1} / ${SPRINT_STEPS.length}`);
      lines.push("");
    }
  }
  lines.push("## Progress");
  lines.push(`Backlog: ${ctx.product_backlog_count} stories remaining`);
  lines.push(`Domains: AI/ML=${ctx.has_ai_ml} Analytics=${ctx.has_analytics} Frontend=${ctx.has_frontend_ui}`);
  lines.push("");
  if (projectRoot) {
    lines.push("## Artifacts");
    const baseDir = inst ? nodePath3.join(projectRoot, "prd-lifecycle", inst) : nodePath3.join(projectRoot, "prd-lifecycle");
    if (inst) {
      lines.push(`Artifact dir: prd-lifecycle/${inst}/`);
    }
    const learningsPath = nodePath3.join(baseDir, "learnings.md");
    if (fs2.existsSync(learningsPath)) {
      const lineCount = fs2.readFileSync(learningsPath, "utf-8").split("\n").length;
      lines.push(`learnings.md: ${lineCount} lines`);
    }
    const epicsPath = nodePath3.join(baseDir, "epics.json");
    lines.push(`epics.json: ${fs2.existsSync(epicsPath) ? "exists" : "not found"}`);
    const backlogPath = nodePath3.join(baseDir, "backlog.json");
    lines.push(`backlog.json: ${fs2.existsSync(backlogPath) ? "exists" : "not found"}`);
    if (ctx.current_sprint > 0) {
      const sprintDir = nodePath3.join(baseDir, "sprints", `sprint-${ctx.current_sprint}`);
      lines.push(`sprint-${ctx.current_sprint}/: ${fs2.existsSync(sprintDir) ? "exists" : "not found"}`);
    }
    lines.push("");
  }
  const warnings = [];
  if (phase === "execution" && ctx.current_sprint === 0 && !["refinement", "sprint_planning"].includes(step)) {
    warnings.push("Sprint counter is 0 but past planning phase");
  }
  if (warnings.length > 0) {
    lines.push("## Warnings");
    for (const w of warnings) {
      lines.push(`- ${w}`);
    }
    lines.push("");
  }
  lines.push("## Protocol");
  lines.push("1. Read the file shown in Load");
  lines.push("2. Jump to the section shown in Resume at");
  lines.push("3. Follow instructions from that point");
  lines.push("4. After each sub-step: run brain with new state");
  lines.push("5. If confused or after compaction: run brain (no args)");
  lines.push("");
  lines.push(renderCheatsheet(ctx.team_name, inst));
  return lines.join("\n");
}
function renderInstanceList(instances) {
  const lines = [];
  lines.push("# BRAIN \u2014 Instances");
  lines.push("");
  if (instances.length === 0) {
    lines.push("No PRD instances found.");
    lines.push("");
    lines.push("Start new: `brain . instance={slug} --init`");
  } else {
    lines.push(`Found ${instances.length} instance(s):`);
    lines.push("");
    for (const inst of instances) {
      try {
        const raw = fs2.readFileSync(inst.statePath, "utf-8");
        const state = JSON.parse(raw);
        const path = stateValueToPath(state.value);
        const { phase, step } = statePathToFlatDisplay(path);
        const label = inst.isLegacy ? "**(legacy)**" : `**${inst.slug}**`;
        lines.push(`- ${label} \u2014 ${phase}.${step} (team: ${state.context?.team_name || "(not set)"})`);
      } catch {
        lines.push(`- **${inst.slug}** \u2014 (corrupt state)`);
      }
    }
    lines.push("");
    lines.push("Resume: `brain . instance={slug}`");
    lines.push("New:    `brain . instance={slug} --init`");
  }
  return lines.join("\n");
}
function renderNoStateBox(instance) {
  const lines = [];
  if (instance) {
    lines.push(boxHeader("PRD-LIFECYCLE BRAIN \u2014 No State Found"));
    lines.push(divider());
    lines.push(blank());
    lines.push(pad(`No state.json for instance "${instance}".`));
    lines.push(blank());
    lines.push(pad(`  Fresh start?  Run: brain . instance=${instance} --init`));
    lines.push(pad("  List all:     Run: brain --list"));
  } else {
    lines.push(boxHeader("PRD-LIFECYCLE BRAIN \u2014 No State Found"));
    lines.push(divider());
    lines.push(blank());
    lines.push(pad("No instance specified and no legacy state.json found."));
    lines.push(blank());
    lines.push(pad("  List instances:  brain --list"));
    lines.push(pad("  Fresh start:     brain . instance={slug} --init"));
  }
  lines.push(blank());
  lines.push(boxFooter());
  return lines.join("\n");
}
function renderErrorBox(title, message, hint) {
  const lines = [];
  lines.push(boxHeader(`PRD-LIFECYCLE BRAIN \u2014 ${title}`));
  lines.push(divider());
  lines.push(blank());
  lines.push(pad(message));
  if (hint) {
    lines.push(blank());
    lines.push(pad(hint));
  }
  lines.push(blank());
  lines.push(boxFooter());
  return lines.join("\n");
}

// src/logger.ts
var fs3 = __toESM(require("fs"), 1);
var nodePath4 = __toESM(require("path"), 1);
function createLogger(projectRoot, instance) {
  const logFile = nodePath4.join(projectRoot, getStateDir(instance), "brain.log");
  return {
    log(message) {
      try {
        const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
        fs3.appendFileSync(logFile, `[${ts}] ${message}
`);
      } catch {
      }
    }
  };
}

// src/main.ts
function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const projectRoot = nodePath5.resolve(parsed.projectRoot);
  const instance = parsed.instance || void 0;
  if (parsed.mode === "list") {
    const instances = listInstances(projectRoot);
    console.log(renderInstanceList(instances));
    process.exit(0);
  }
  if (instance) {
    try {
      validateInstance(instance);
    } catch (err) {
      console.error(renderErrorBox("Invalid Instance", err.message));
      process.exit(1);
    }
  }
  const logger = createLogger(projectRoot, instance);
  logger.log(`INVOKE mode=${parsed.mode} instance=${instance || "(none)"} args=[${args.join(" ")}]`);
  if (parsed.ignoredFields.length > 0) {
    logger.log(`DEBUG ignored fields: ${parsed.ignoredFields.join(", ")}`);
  }
  if (parsed.mode === "init") {
    if (!instance) {
      console.error(renderErrorBox(
        "Missing Instance",
        "The instance= parameter is required for --init.",
        "Usage: brain . instance={slug} --init"
      ));
      process.exit(1);
    }
    try {
      initializeProject(projectRoot, workflow_default, instance);
      logger.log("INIT scaffold created");
      const snapshot2 = readState(projectRoot, instance);
      const nav2 = computeNavigation(snapshot2, workflow_default);
      console.log(renderNavigationBox(snapshot2, nav2, projectRoot, instance));
      process.exit(0);
    } catch (err) {
      if (err.message?.includes("already exists")) {
        console.error(renderErrorBox("Init Failed", err.message));
        process.exit(1);
      }
      console.error(renderErrorBox("Init Failed", `Scaffold creation failed: ${err.message}`));
      process.exit(1);
    }
  }
  let snapshot;
  try {
    snapshot = readState(projectRoot, instance);
  } catch (err) {
    console.error(renderErrorBox("Corrupt State", `Failed to parse state.json: ${err.message}`));
    process.exit(1);
  }
  if (snapshot === null) {
    console.log(renderNoStateBox(instance));
    process.exit(0);
  }
  if (instance && snapshot.context.instance !== instance) {
    snapshot.context.instance = instance;
    writeState(projectRoot, snapshot, instance);
  }
  const statePath = stateValueToPath(snapshot.value);
  if (!resolveStateNode(workflow_default, statePath)) {
    const nearest = findNearestAncestor(workflow_default, statePath);
    console.error(renderErrorBox(
      "Invalid State",
      `State "${statePath}" not found in workflow.json`,
      `Nearest valid ancestor: ${nearest}
Fix: edit state.json "value" to a valid state, or delete to reinitialize`
    ));
    process.exit(1);
  }
  logger.log(`STATE_BEFORE ${statePath}`);
  if (parsed.mode === "orient") {
    const nav2 = computeNavigation(snapshot, workflow_default);
    logger.log(`NAVIGATE orient ${statePath}`);
    console.log(renderNavigationBox(snapshot, nav2, projectRoot, instance));
    process.exit(0);
  }
  const event = parsed.event;
  logger.log(`EVENT ${event.type} ${JSON.stringify(event)}`);
  const result = processEvent(snapshot, event);
  if (!result.changed) {
    const stateNode = resolveStateNode(workflow_default, statePath);
    const validEvents = stateNode?.on ? Object.keys(stateNode.on) : [];
    console.error(renderErrorBox(
      "Event Rejected",
      `Event "${event.type}" is not valid at state "${statePath}"`,
      `Valid events: ${validEvents.join(", ") || "(none \u2014 final state)"}`
    ));
    logger.log(`REJECTED ${event.type} at ${statePath}`);
    process.exit(1);
  }
  writeState(projectRoot, result.snapshot, instance);
  const newPath = stateValueToPath(result.snapshot.value);
  logger.log(`STATE_AFTER ${newPath}`);
  const nav = computeNavigation(result.snapshot, workflow_default);
  logger.log(`NAVIGATE transition ${newPath}`);
  console.log(renderNavigationBox(result.snapshot, nav, projectRoot, instance));
  process.exit(0);
}
main();
