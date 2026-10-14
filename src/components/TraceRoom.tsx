import { AlertTriangle, ArrowRight, CircleDot, RadioTower, Sparkles } from "lucide-react";

import {
  agentName,
  floorOwner,
  floorReason,
  formatRelativeTime,
  humanize,
} from "../lib/derive";
import type { ObservedEvent } from "../lib/observer-types";

interface TraceRoomProps {
  events: ObservedEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: ObservedEvent) => void;
}

function eventTone(event: ObservedEvent): string {
  if (["failed", "conflict", "cancelled"].includes(event.status)) return "danger";
  if (event.category === "floor") return "accent";
  if (event.source_system === "map") return "map";
  return "neutral";
}

export function TraceRoom({ events, selectedEventId, onSelectEvent }: TraceRoomProps) {
  if (events.length === 0) {
    return (
      <section className="room-canvas room-empty" aria-labelledby="room-empty-heading">
        <RadioTower aria-hidden="true" size={32} strokeWidth={1.5} />
        <h1 id="room-empty-heading">Waiting for observed activity</h1>
        <p>Start the Event Observer transport and run a traced interaction. Signal Room will update without issuing commands.</p>
      </section>
    );
  }

  const ingress = events.find((event) => event.category === "ingress") ?? events[0];
  const ingressEventType =
    typeof ingress.safe_payload.event_type === "string"
      ? ingress.safe_payload.event_type
      : ingress.source_event_type;
  const owner = floorOwner(events);
  const keyEvents = events
    .filter((event) => event.category !== "attention")
    .slice(-6);

  return (
    <section className="room-canvas" aria-labelledby="room-heading">
      <div className="semantic-banner">
        <div>
          <span className="section-kicker">Current event</span>
          <h1 id="room-heading">{humanize(ingressEventType)}</h1>
        </div>
        <div className="event-origin">
          <CircleDot aria-hidden="true" size={14} />
          <span>{humanize(ingress.source_system)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatRelativeTime(ingress.occurred_at)}</span>
        </div>
      </div>

      <div className={`floor-grant${owner ? " is-granted" : ""}`}>
        <span className="floor-symbol"><Sparkles aria-hidden="true" size={25} /></span>
        <div>
          <span className="floor-label">Response floor</span>
          <h2>{owner ? `${owner.name} has the floor` : "No floor owner observed"}</h2>
          <p>{floorReason(events)}</p>
        </div>
      </div>

      <div className="trace-heading">
        <div>
          <span className="section-kicker">Trace spine</span>
          <h2>What happened</h2>
        </div>
        <span>{events.length} records</span>
      </div>

      <div className="trace-list" aria-label="Trace events">
        {keyEvents.map((event) => {
          const selected = selectedEventId === event.observer_event_id;
          return (
            <button
              className={`trace-event tone-${eventTone(event)}${selected ? " is-selected" : ""}`}
              key={event.observer_event_id}
              onClick={() => onSelectEvent(event)}
              type="button"
              aria-pressed={selected}
            >
              <span className="trace-node" aria-hidden="true" />
              <span className="trace-event-copy">
                <span className="trace-event-meta">
                  {humanize(event.source_system)} · {humanize(event.category)}
                </span>
                <strong>{event.summary || humanize(event.source_event_type)}</strong>
                <span>{agentName(event.ape_agent_id)} · {humanize(event.status)}</span>
              </span>
              {event.status === "failed" ? (
                <AlertTriangle aria-hidden="true" size={18} />
              ) : (
                <ArrowRight aria-hidden="true" size={18} />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
