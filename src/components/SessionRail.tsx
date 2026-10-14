import { Clock3, RadioTower } from "lucide-react";

import { formatRelativeTime } from "../lib/derive";
import type { TraceSession } from "../lib/derive";

interface SessionRailProps {
  sessions: TraceSession[];
  selectedTraceId: string | null;
  onSelect: (traceId: string) => void;
}

export function SessionRail({ sessions, selectedTraceId, onSelect }: SessionRailProps) {
  return (
    <aside className="session-rail" aria-label="Observed traces">
      <div className="rail-heading">
        <div>
          <span className="section-kicker">Observed traces</span>
          <h2>Sessions</h2>
        </div>
        <span className="rail-count" aria-label={`${sessions.length} traces`}>{sessions.length}</span>
      </div>
      {sessions.length === 0 ? (
        <div className="rail-empty">
          <RadioTower aria-hidden="true" size={22} />
          <p>No traced activity yet.</p>
          <span>New Observer events will appear here.</span>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => {
            const selected = session.traceId === selectedTraceId;
            return (
              <button
                className={`session-row${selected ? " is-selected" : ""}`}
                key={session.traceId}
                onClick={() => onSelect(session.traceId)}
                type="button"
                aria-pressed={selected}
              >
                <span className="session-signal" aria-hidden="true" />
                <span className="session-copy">
                  <span className="session-title">{session.title}</span>
                  <span className="session-subtitle">{session.subtitle}</span>
                </span>
                <span className="session-time">
                  <Clock3 aria-hidden="true" size={12} />
                  {formatRelativeTime(session.occurredAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

