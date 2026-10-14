import type {
  EventPage,
  JsonValue,
  ObservedEvent,
  ObserverAdapterHealth,
  ObserverHealth,
  ObserverHealthState,
  QuarantinePage,
  QuarantineRecord,
  UnlinkedPage,
} from "./observer-types";

const MAX_INITIAL_EVENTS = 5000;
const PAGE_SIZE = 1000;
const REVIEW_LIMIT = 1000;
const HEALTH_STATES = new Set<ObserverHealthState>([
  "healthy",
  "degraded",
  "unavailable",
  "stale",
  "unknown",
]);

export class ObserverBoundaryError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ObserverBoundaryError";
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ObserverBoundaryError(`Observer returned invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new ObserverBoundaryError(`Observer returned invalid ${label}.`);
  }
  return value;
}

function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ObserverBoundaryError(`Observer returned invalid ${label}.`);
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label);
}

function nullableNumber(value: unknown, label: string): number | null {
  return value === null ? null : number(value, label);
}

function jsonObject(value: unknown, label: string): Record<string, JsonValue> {
  return record(value, label) as Record<string, JsonValue>;
}

export function parseObservedEvent(value: unknown): ObservedEvent {
  const item = record(value, "event");
  if (!Array.isArray(item.source_refs) || !item.source_refs.every((ref) => typeof ref === "string")) {
    throw new ObserverBoundaryError("Observer returned invalid event source_refs.");
  }
  return {
    observer_event_id: string(item.observer_event_id, "event observer_event_id"),
    schema_version: number(item.schema_version, "event schema_version"),
    source_system: string(item.source_system, "event source_system"),
    source_event_id: string(item.source_event_id, "event source_event_id"),
    source_event_type: string(item.source_event_type, "event source_event_type"),
    category: string(item.category, "event category"),
    occurred_at: string(item.occurred_at, "event occurred_at"),
    ingested_at: string(item.ingested_at, "event ingested_at"),
    ingest_sequence: number(item.ingest_sequence, "event ingest_sequence"),
    source_clock_id: nullableString(item.source_clock_id, "event source_clock_id"),
    source_monotonic_ns: nullableNumber(item.source_monotonic_ns, "event source_monotonic_ns"),
    session_id: nullableString(item.session_id, "event session_id"),
    trace_id: nullableString(item.trace_id, "event trace_id"),
    correlation_id: nullableString(item.correlation_id, "event correlation_id"),
    causation_ref: nullableString(item.causation_ref, "event causation_ref"),
    ape_agent_id: nullableString(item.ape_agent_id, "event ape_agent_id"),
    mar_agent_id: nullableString(item.mar_agent_id, "event mar_agent_id"),
    run_id: nullableString(item.run_id, "event run_id"),
    parent_run_id: nullableString(item.parent_run_id, "event parent_run_id"),
    authority_ref: nullableString(item.authority_ref, "event authority_ref"),
    status: string(item.status, "event status"),
    summary: string(item.summary, "event summary"),
    safe_payload: jsonObject(item.safe_payload, "event safe_payload"),
    source_refs: item.source_refs,
    sensitivity: string(item.sensitivity, "event sensitivity"),
    retention_class: string(item.retention_class, "event retention_class"),
    payload_hash: string(item.payload_hash, "event payload_hash"),
  };
}

function parseAdapterHealth(value: unknown): ObserverAdapterHealth {
  const item = record(value, "adapter health");
  const state = string(item.state, "adapter state") as ObserverHealthState;
  if (!HEALTH_STATES.has(state)) {
    throw new ObserverBoundaryError("Observer returned invalid adapter state.");
  }
  return {
    adapter_id: string(item.adapter_id, "adapter_id"),
    state,
    last_source_event_id: nullableString(item.last_source_event_id, "last_source_event_id"),
    source_cursor: jsonObject(item.source_cursor, "source_cursor"),
    updated_at: string(item.updated_at, "adapter updated_at"),
    detail: string(item.detail, "adapter detail"),
  };
}

function parseHealth(value: unknown): ObserverHealth {
  const item = record(value, "health snapshot");
  const state = string(item.state, "health state") as ObserverHealthState;
  if (!HEALTH_STATES.has(state) || !Array.isArray(item.adapters)) {
    throw new ObserverBoundaryError("Observer returned invalid health snapshot.");
  }
  return {
    state,
    event_count: number(item.event_count, "health event_count"),
    unlinked_count: number(item.unlinked_count, "health unlinked_count"),
    quarantined_count: number(item.quarantined_count, "health quarantined_count"),
    detail: string(item.detail, "health detail"),
    adapters: item.adapters.map(parseAdapterHealth),
  };
}

function parseEventPage(value: unknown): EventPage {
  const item = record(value, "event page");
  if (!Array.isArray(item.events)) {
    throw new ObserverBoundaryError("Observer returned invalid event page.");
  }
  return {
    after_sequence: number(item.after_sequence, "event page cursor"),
    next_after_sequence: number(item.next_after_sequence, "event page next cursor"),
    events: item.events.map(parseObservedEvent),
  };
}

function parseUnlinkedPage(value: unknown): UnlinkedPage {
  const item = record(value, "unlinked page");
  if (!Array.isArray(item.events)) {
    throw new ObserverBoundaryError("Observer returned invalid unlinked page.");
  }
  return {
    total_count: number(item.total_count, "unlinked total_count"),
    events: item.events.map(parseObservedEvent),
  };
}

function parseQuarantineRecord(value: unknown): QuarantineRecord {
  const item = record(value, "quarantine record");
  return {
    quarantine_id: number(item.quarantine_id, "quarantine_id"),
    source_system: string(item.source_system, "quarantine source_system"),
    source_event_id: string(item.source_event_id, "quarantine source_event_id"),
    reason: string(item.reason, "quarantine reason"),
    quarantined_at: string(item.quarantined_at, "quarantine quarantined_at"),
  };
}

function parseQuarantinePage(value: unknown): QuarantinePage {
  const item = record(value, "quarantine page");
  if (!Array.isArray(item.records)) {
    throw new ObserverBoundaryError("Observer returned invalid quarantine page.");
  }
  return {
    total_count: number(item.total_count, "quarantine total_count"),
    records: item.records.map(parseQuarantineRecord),
  };
}

async function readJson<T>(
  path: string,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ObserverBoundaryError(
      `Observer returned ${response.status} for ${path}`,
      response.status,
    );
  }
  return parse(await response.json());
}

export async function loadHealth(signal?: AbortSignal): Promise<ObserverHealth> {
  return readJson("/v1/health", parseHealth, signal);
}

export async function loadUnlinked(signal?: AbortSignal): Promise<UnlinkedPage> {
  return readJson(`/v1/events/unlinked?limit=${REVIEW_LIMIT}`, parseUnlinkedPage, signal);
}

export async function loadQuarantine(signal?: AbortSignal): Promise<QuarantinePage> {
  return readJson(`/v1/quarantine?limit=${REVIEW_LIMIT}`, parseQuarantinePage, signal);
}

export async function loadInitialEvents(
  signal?: AbortSignal,
): Promise<{ events: ObservedEvent[]; truncated: boolean }> {
  const events: ObservedEvent[] = [];
  let cursor = 0;

  while (events.length < MAX_INITIAL_EVENTS) {
    const remaining = MAX_INITIAL_EVENTS - events.length;
    const limit = Math.min(PAGE_SIZE, remaining);
    const page = await readJson(
      `/v1/events?after_sequence=${cursor}&limit=${limit}`,
      parseEventPage,
      signal,
    );
    events.push(...page.events);
    if (page.events.length < limit || page.next_after_sequence <= cursor) {
      return { events, truncated: false };
    }
    cursor = page.next_after_sequence;
  }

  return { events, truncated: true };
}

export interface ObserverStream {
  close: () => void;
}

export function openObserverStream(
  afterSequence: number,
  handlers: {
    onEvent: (event: ObservedEvent) => void;
    onOpen: () => void;
    onError: () => void;
  },
): ObserverStream {
  const source = new EventSource(
    `/v1/events/stream?after_sequence=${Math.max(0, afterSequence)}`,
  );
  source.addEventListener("observer.event", (rawEvent) => {
    try {
      handlers.onEvent(parseObservedEvent(JSON.parse((rawEvent as MessageEvent<string>).data)));
    } catch {
      handlers.onError();
    }
  });
  source.addEventListener("open", handlers.onOpen);
  source.addEventListener("error", handlers.onError);
  return { close: () => source.close() };
}
