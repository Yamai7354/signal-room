import { agentName, humanize } from "./derive";
import type { ObservedEvent, QuarantineRecord } from "./observer-types";

export const ACTIVITY_SOURCES = ["all", "ape", "mar", "business", "kgk", "map"] as const;
export const ACTIVITY_STATES = ["all", "failures", "unlinked", "quarantined"] as const;

export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];
export type ActivityState = (typeof ACTIVITY_STATES)[number];

export interface EventActivityRecord {
  kind: "event";
  id: string;
  occurredAt: string;
  sourceSystem: string;
  title: string;
  detail: string;
  status: string;
  agent: string;
  reference: string;
  unlinked: boolean;
  event: ObservedEvent;
}

export interface QuarantineActivityRecord {
  kind: "quarantine";
  id: string;
  occurredAt: string;
  sourceSystem: string;
  title: string;
  detail: string;
  status: "quarantined";
  agent: "No agent";
  reference: string;
  unlinked: false;
  quarantine: QuarantineRecord;
}

export type ActivityRecord = EventActivityRecord | QuarantineActivityRecord;

const FAILURE_STATES = new Set([
  "cancelled",
  "conflict",
  "degraded",
  "failed",
  "rejected",
  "stale",
  "unavailable",
]);

export function deriveActivityRecords(
  events: ObservedEvent[],
  unlinkedEventIds: ReadonlySet<string>,
  quarantine: QuarantineRecord[],
): ActivityRecord[] {
  const observed: EventActivityRecord[] = events.map((event) => ({
    kind: "event",
    id: event.observer_event_id,
    occurredAt: event.occurred_at,
    sourceSystem: event.source_system.toLowerCase(),
    title: humanize(event.source_event_type),
    detail: event.summary || `Observed ${humanize(event.category)} activity.`,
    status: event.status,
    agent: agentName(event.ape_agent_id),
    reference: event.trace_id ?? event.run_id ?? event.source_event_id,
    unlinked: unlinkedEventIds.has(event.observer_event_id),
    event,
  }));
  const quarantined: QuarantineActivityRecord[] = quarantine.map((item) => ({
    kind: "quarantine",
    id: `quarantine-${item.quarantine_id}`,
    occurredAt: item.quarantined_at,
    sourceSystem: item.source_system.toLowerCase(),
    title: "Record quarantined",
    detail: item.reason,
    status: "quarantined",
    agent: "No agent",
    reference: item.source_event_id,
    unlinked: false,
    quarantine: item,
  }));

  return [...observed, ...quarantined].sort((left, right) => {
    const timeDifference = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
    if (timeDifference !== 0) return timeDifference;
    if (left.kind === "event" && right.kind === "event") {
      return right.event.ingest_sequence - left.event.ingest_sequence;
    }
    return right.kind === "quarantine" ? 1 : -1;
  });
}

export function filterActivityRecords(
  records: ActivityRecord[],
  source: ActivitySource,
  state: ActivityState,
): ActivityRecord[] {
  return records.filter((record) => {
    const sourceMatches = source === "all" || record.sourceSystem === source;
    const stateMatches =
      state === "all" ||
      (state === "quarantined" && record.kind === "quarantine") ||
      (state === "unlinked" && record.kind === "event" && record.unlinked) ||
      (state === "failures" && record.kind === "event" && FAILURE_STATES.has(record.status.toLowerCase()));
    return sourceMatches && stateMatches;
  });
}
