export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };

export interface ObservedEvent {
  observer_event_id: string;
  schema_version: number;
  source_system: string;
  source_event_id: string;
  source_event_type: string;
  category: string;
  occurred_at: string;
  ingested_at: string;
  ingest_sequence: number;
  source_clock_id: string | null;
  source_monotonic_ns: number | null;
  session_id: string | null;
  trace_id: string | null;
  correlation_id: string | null;
  causation_ref: string | null;
  ape_agent_id: string | null;
  mar_agent_id: string | null;
  run_id: string | null;
  parent_run_id: string | null;
  authority_ref: string | null;
  status: string;
  summary: string;
  safe_payload: Record<string, JsonValue>;
  source_refs: string[];
  sensitivity: string;
  retention_class: string;
  payload_hash: string;
}

export interface ObserverAdapterHealth {
  adapter_id: string;
  state: ObserverHealthState;
  last_source_event_id: string | null;
  source_cursor: Record<string, JsonValue>;
  updated_at: string;
  detail: string;
}

export type ObserverHealthState =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "stale"
  | "unknown";

export interface ObserverHealth {
  state: ObserverHealthState;
  event_count: number;
  unlinked_count: number;
  quarantined_count: number;
  detail: string;
  adapters: ObserverAdapterHealth[];
}

export interface EventPage {
  after_sequence: number;
  next_after_sequence: number;
  events: ObservedEvent[];
}

export interface UnlinkedPage {
  total_count: number;
  events: ObservedEvent[];
}

export interface QuarantineRecord {
  quarantine_id: number;
  source_system: string;
  source_event_id: string;
  reason: string;
  quarantined_at: string;
}

export interface QuarantinePage {
  total_count: number;
  records: QuarantineRecord[];
}

export type ConnectionState = "loading" | "live" | "reconnecting" | "offline";
