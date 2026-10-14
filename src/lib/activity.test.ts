import { describe, expect, it } from "vitest";

import { deriveActivityRecords, filterActivityRecords } from "./activity";
import type { ObservedEvent, QuarantineRecord } from "./observer-types";

function event(sequence: number, changes: Partial<ObservedEvent> = {}): ObservedEvent {
  return {
    observer_event_id: `oev-${sequence}`,
    schema_version: 1,
    source_system: "ape",
    source_event_id: `source-${sequence}`,
    source_event_type: "AttentionEvaluated",
    category: "attention",
    occurred_at: `2026-09-19T12:00:0${sequence}+00:00`,
    ingested_at: `2026-09-19T12:00:0${sequence}+00:00`,
    ingest_sequence: sequence,
    source_clock_id: null,
    source_monotonic_ns: null,
    session_id: null,
    trace_id: "trace-1",
    correlation_id: null,
    causation_ref: null,
    ape_agent_id: "business",
    mar_agent_id: null,
    run_id: null,
    parent_run_id: null,
    authority_ref: null,
    status: "engage",
    summary: "Misaka attention decision",
    safe_payload: {},
    source_refs: [],
    sensitivity: "internal",
    retention_class: "standard",
    payload_hash: `hash-${sequence}`,
    ...changes,
  };
}

const quarantine: QuarantineRecord = {
  quarantine_id: 3,
  source_system: "kgk",
  source_event_id: "kgk-unsupported",
  reason: "unsupported schema_version=2; supported=1",
  quarantined_at: "2026-09-19T12:00:04+00:00",
};

describe("Activity view projections", () => {
  it("keeps exact Observer unlinked identity and stable agent display mapping", () => {
    const records = deriveActivityRecords(
      [event(1), event(2, { observer_event_id: "oev-unlinked", trace_id: null })],
      new Set(["oev-unlinked"]),
      [],
    );

    expect(records.find((record) => record.id === "oev-unlinked")?.unlinked).toBe(true);
    expect(records.find((record) => record.id === "oev-1")?.agent).toBe("Misaka");
  });

  it("filters failures, unlinked events, quarantine, and source independently", () => {
    const records = deriveActivityRecords(
      [
        event(1),
        event(2, { observer_event_id: "oev-failed", source_system: "map", status: "failed" }),
        event(3, { observer_event_id: "oev-unlinked", source_system: "mar" }),
      ],
      new Set(["oev-unlinked"]),
      [quarantine],
    );

    expect(filterActivityRecords(records, "all", "failures").map((item) => item.id)).toEqual(["oev-failed"]);
    expect(filterActivityRecords(records, "all", "unlinked").map((item) => item.id)).toEqual(["oev-unlinked"]);
    expect(filterActivityRecords(records, "all", "quarantined").map((item) => item.id)).toEqual(["quarantine-3"]);
    expect(filterActivityRecords(records, "map", "all").map((item) => item.id)).toEqual(["oev-failed"]);
    expect(filterActivityRecords(records, "kgk", "all").map((item) => item.id)).toEqual(["quarantine-3"]);
  });
});
