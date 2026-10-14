import { Clock3, Fingerprint, Link2, ShieldCheck } from "lucide-react";

import { agentName, humanize } from "../lib/derive";
import type { JsonValue, ObservedEvent } from "../lib/observer-types";

interface ContextInspectorProps {
  event: ObservedEvent | null;
}

function printable(value: JsonValue): string {
  if (Array.isArray(value)) return value.map(printable).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ContextInspector({ event }: ContextInspectorProps) {
  return (
    <aside className="context-inspector" aria-labelledby="context-heading">
      <div className="inspector-heading">
        <span className="section-kicker">Selected record</span>
        <h2 id="context-heading">Context</h2>
      </div>
      {!event ? (
        <div className="inspector-empty">
          <Fingerprint aria-hidden="true" size={28} />
          <p>Select a trace record or agent decision to inspect its safe metadata.</p>
        </div>
      ) : (
        <>
          <section className="inspector-section">
            <span className="inspector-label">Event</span>
            <h3>{humanize(event.source_event_type)}</h3>
            <p>{event.summary || "No human-readable summary recorded."}</p>
          </section>

          <dl className="inspector-facts">
            <div><dt>Source</dt><dd>{humanize(event.source_system)}</dd></div>
            <div><dt>Status</dt><dd>{humanize(event.status)}</dd></div>
            <div><dt>Agent</dt><dd>{agentName(event.ape_agent_id)}</dd></div>
            <div><dt>Sensitivity</dt><dd>{humanize(event.sensitivity)}</dd></div>
          </dl>

          <section className="inspector-section">
            <span className="inspector-label"><ShieldCheck aria-hidden="true" size={14} /> Safe payload</span>
            {Object.keys(event.safe_payload).length === 0 ? (
              <p>No allowlisted payload fields.</p>
            ) : (
              <dl className="payload-list">
                {Object.entries(event.safe_payload).map(([key, value]) => (
                  <div key={key}>
                    <dt>{humanize(key)}</dt>
                    <dd>{printable(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="inspector-section inspector-refs">
            <span className="inspector-label"><Link2 aria-hidden="true" size={14} /> Authority and references</span>
            <ul>
              {event.authority_ref && <li>{event.authority_ref}</li>}
              {event.source_refs.slice(0, 4).map((reference) => <li key={reference}>{reference}</li>)}
              {!event.authority_ref && event.source_refs.length === 0 && <li>No source references recorded.</li>}
            </ul>
          </section>

          <div className="inspector-footer">
            <Clock3 aria-hidden="true" size={13} />
            <span>Sequence {event.ingest_sequence}</span>
            <span aria-hidden="true">·</span>
            <span title={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</span>
          </div>
        </>
      )}
    </aside>
  );
}

