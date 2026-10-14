import { describe, expect, it } from "vitest";

import {
  componentHealth,
  deriveAttention,
  deriveVoice,
  floorOwner,
  groupTraceSessions,
} from "./derive";
import type { JsonValue, ObservedEvent, ObserverHealth } from "./observer-types";

function event(
  sequence: number,
  changes: Partial<ObservedEvent> = {},
): ObservedEvent {
  const safePayload: Record<string, JsonValue> = changes.safe_payload ?? {};
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
    session_id: "session-1",
    trace_id: "trace-1",
    correlation_id: "corr-1",
    causation_ref: null,
    ape_agent_id: "business",
    mar_agent_id: "ape-business",
    run_id: null,
    parent_run_id: null,
    authority_ref: null,
    status: "engage",
    summary: "business chose engage",
    source_refs: [],
    sensitivity: "internal",
    retention_class: "standard",
    payload_hash: `hash-${sequence}`,
    ...changes,
    safe_payload: safePayload,
  };
}

describe("Signal Room observer projections", () => {
  it("groups and orders sessions without copying semantic content", () => {
    const sessions = groupTraceSessions([
      event(2, { trace_id: "trace-older" }),
      event(3, {
        category: "ingress",
        source_event_type: "customer_follow_up",
        safe_payload: { event_type: "customer_follow_up" },
        trace_id: "trace-newer",
      }),
      event(4, {
        category: "floor",
        source_event_type: "ArbitrationDecided",
        ape_agent_id: "business",
        safe_payload: { winner: "business" },
        trace_id: "trace-newer",
      }),
    ]);

    expect(sessions.map((session) => session.traceId)).toEqual([
      "trace-newer",
      "trace-older",
    ]);
    expect(sessions[0].title).toBe("Customer follow up");
    expect(sessions[0].subtitle).toBe("Misaka received the floor");
  });

  it("maps stable business identity to the Misaka display name", () => {
    const events = [
      event(1, { safe_payload: { action: "engage", score: 0.91, reason: "commercial" } }),
      event(2, {
        ape_agent_id: "technical",
        mar_agent_id: "ape-technical",
        safe_payload: { action: "observe", score: 0.3, reason: "technical context" },
      }),
      event(3, {
        ape_agent_id: "personal",
        mar_agent_id: "ape-personal",
        safe_payload: { action: "ignore", score: 0.1, reason: "not personal" },
      }),
      event(4, {
        category: "floor",
        source_event_type: "ArbitrationDecided",
        safe_payload: { winner: "business", decided_by: "highest_score" },
      }),
    ];

    const attention = deriveAttention(events);
    expect(attention[0]).toMatchObject({ id: "business", name: "Misaka", score: 0.91, isFloorOwner: true });
    expect(floorOwner(events)?.name).toBe("Misaka");
  });

  it("derives honest MAP lifecycle state without inventing playable media", () => {
    const voice = deriveVoice([
      event(1, {
        source_system: "map",
        source_event_type: "map.audio.playback.completed",
        category: "playback",
        status: "completed",
        summary: "MAP recorded playback completion",
      }),
    ]);

    expect(voice.state).toBe("finished");
    expect(voice.label).toBe("Map audio playback completed");
    expect(voice.event?.source_system).toBe("map");
  });

  it("reports adapter health only from matching Observer checkpoints", () => {
    const health: ObserverHealth = {
      state: "degraded",
      event_count: 3,
      unlinked_count: 0,
      quarantined_count: 0,
      detail: "",
      adapters: [
        {
          adapter_id: "map.event_bus",
          state: "healthy",
          last_source_event_id: "map-1",
          source_cursor: {},
          updated_at: "2026-09-19T12:00:00+00:00",
          detail: "",
        },
        {
          adapter_id: "mar.event_bus",
          state: "degraded",
          last_source_event_id: "mar-1",
          source_cursor: {},
          updated_at: "2026-09-19T12:00:00+00:00",
          detail: "",
        },
      ],
    };

    expect(componentHealth(health, "map")).toBe("healthy");
    expect(componentHealth(health, "mar")).toBe("degraded");
    expect(componentHealth(health, "kgk")).toBe("unknown");
  });
});
