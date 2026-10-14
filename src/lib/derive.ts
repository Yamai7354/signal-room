import type { JsonValue, ObservedEvent, ObserverHealth } from "./observer-types";

export const AGENT_IDS = ["business", "technical", "personal"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export interface AgentPresentation {
  id: AgentId;
  name: string;
  role: string;
  accent: "amber" | "blue" | "lilac";
}

export const AGENTS: Record<AgentId, AgentPresentation> = {
  business: { id: "business", name: "Misaka", role: "Business", accent: "amber" },
  technical: { id: "technical", name: "Technical", role: "Technical", accent: "blue" },
  personal: { id: "personal", name: "Personal", role: "Personal", accent: "lilac" },
};

export interface TraceSession {
  traceId: string;
  events: ObservedEvent[];
  latestSequence: number;
  title: string;
  subtitle: string;
  occurredAt: string;
  status: string;
}

export interface AttentionView extends AgentPresentation {
  action: string;
  score: number | null;
  reason: string;
  isFloorOwner: boolean;
  event: ObservedEvent | null;
}

export interface VoiceView {
  state: "idle" | "preparing" | "rendering" | "ready" | "playing" | "finished" | "failed";
  label: string;
  detail: string;
  event: ObservedEvent | null;
}

function stringValue(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function humanize(value: string): string {
  return value
    .replaceAll(/[._-]+/g, " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

export function agentName(agentId: string | null): string {
  if (agentId && agentId in AGENTS) {
    return AGENTS[agentId as AgentId].name;
  }
  return agentId ? humanize(agentId) : "No agent";
}

export function groupTraceSessions(events: ObservedEvent[]): TraceSession[] {
  const grouped = new Map<string, ObservedEvent[]>();
  for (const event of events) {
    if (!event.trace_id) continue;
    const group = grouped.get(event.trace_id) ?? [];
    group.push(event);
    grouped.set(event.trace_id, group);
  }

  return [...grouped.entries()]
    .map(([traceId, traceEvents]) => {
      traceEvents.sort((left, right) => left.ingest_sequence - right.ingest_sequence);
      const ingress = traceEvents.find((event) => event.category === "ingress");
      const floor = [...traceEvents].reverse().find((event) => event.category === "floor");
      const latest = traceEvents.at(-1)!;
      const eventType = stringValue(ingress?.safe_payload.event_type);
      return {
        traceId,
        events: traceEvents,
        latestSequence: latest.ingest_sequence,
        title: eventType ? humanize(eventType) : humanize(ingress?.source_event_type ?? "Observed activity"),
        subtitle: floor?.ape_agent_id
          ? `${agentName(floor.ape_agent_id)} received the floor`
          : humanize(latest.source_event_type),
        occurredAt: ingress?.occurred_at ?? latest.occurred_at,
        status: latest.status,
      };
    })
    .sort((left, right) => right.latestSequence - left.latestSequence);
}

export function deriveAttention(events: ObservedEvent[]): AttentionView[] {
  const floor = [...events].reverse().find((event) => event.category === "floor");
  const owner =
    stringValue(floor?.safe_payload.winner) ?? floor?.ape_agent_id ?? null;

  return AGENT_IDS.map((id) => {
    const event = [...events]
      .reverse()
      .find((candidate) => candidate.category === "attention" && candidate.ape_agent_id === id);
    const action = stringValue(event?.safe_payload.action) ?? event?.status ?? "unknown";
    return {
      ...AGENTS[id],
      action: humanize(action),
      score: numberValue(event?.safe_payload.score),
      reason: stringValue(event?.safe_payload.reason) ?? "No attention decision recorded.",
      isFloorOwner: owner === id,
      event: event ?? null,
    };
  });
}

export function floorOwner(events: ObservedEvent[]): AgentPresentation | null {
  const floor = [...events].reverse().find((event) => event.category === "floor");
  const id = stringValue(floor?.safe_payload.winner) ?? floor?.ape_agent_id;
  return id && id in AGENTS ? AGENTS[id as AgentId] : null;
}

export function floorReason(events: ObservedEvent[]): string {
  const floor = [...events].reverse().find((event) => event.category === "floor");
  if (!floor) return "No response-floor decision has been observed.";
  const decidedBy = stringValue(floor.safe_payload.decided_by);
  return decidedBy ? `Selected by ${humanize(decidedBy)}.` : floor.summary;
}

export function deriveVoice(events: ObservedEvent[]): VoiceView {
  const event = [...events]
    .reverse()
    .find((candidate) => candidate.source_system === "map" && ["synthesis", "playback"].includes(candidate.category));
  if (!event) {
    return { state: "idle", label: "No voice activity", detail: "Waiting for a MAP lifecycle event.", event: null };
  }

  const type = event.source_event_type.toLowerCase();
  let state: VoiceView["state"] = "preparing";
  if (event.status === "failed" || type.endsWith("failed")) state = "failed";
  else if (type.includes("playback") && event.status === "started") state = "playing";
  else if (type.includes("playback") && event.status === "completed") state = "finished";
  else if (type.includes("synthesis") && event.status === "completed") state = "ready";
  else if (type.includes("synthesis")) state = "rendering";

  return {
    state,
    label: humanize(event.source_event_type),
    detail: event.summary || `MAP reported ${humanize(event.status)}.`,
    event,
  };
}

export function componentHealth(
  health: ObserverHealth | null,
  prefix: string,
): "healthy" | "degraded" | "unknown" {
  const matching = health?.adapters.filter((adapter) => adapter.adapter_id.startsWith(prefix)) ?? [];
  if (matching.length === 0) return "unknown";
  return matching.every((adapter) => adapter.state === "healthy") ? "healthy" : "degraded";
}

export function formatRelativeTime(isoTime: string, now = Date.now()): string {
  const timestamp = Date.parse(isoTime);
  if (!Number.isFinite(timestamp)) return "Unknown time";
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return seconds < 5 ? "Now" : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

