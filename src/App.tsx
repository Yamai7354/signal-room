import { useMemo, useState } from "react";
import { Activity, Eye, LayoutDashboard, RefreshCw, ShieldCheck } from "lucide-react";

import { AgentBench } from "./components/AgentBench";
import { ActivityView } from "./components/ActivityView";
import { ContextInspector } from "./components/ContextInspector";
import { HealthStrip } from "./components/HealthStrip";
import { SessionRail } from "./components/SessionRail";
import { TraceRoom } from "./components/TraceRoom";
import { VoiceDock } from "./components/VoiceDock";
import {
  deriveAttention,
  deriveVoice,
  groupTraceSessions,
} from "./lib/derive";
import type { AttentionView } from "./lib/derive";
import type { ObservedEvent } from "./lib/observer-types";
import { useObserver } from "./lib/use-observer";

const EMPTY_EVENTS: ObservedEvent[] = [];

function App() {
  const observer = useObserver();
  const [view, setView] = useState<"room" | "activity">("room");
  const sessions = useMemo(() => groupTraceSessions(observer.events), [observer.events]);
  const [requestedTraceId, setRequestedTraceId] = useState<string | null>(null);
  const [requestedEventId, setRequestedEventId] = useState<string | null>(null);

  const selectedSession =
    sessions.find((session) => session.traceId === requestedTraceId) ?? sessions[0] ?? null;
  const selectedTraceId = selectedSession?.traceId ?? null;
  const traceEvents = selectedSession?.events ?? EMPTY_EVENTS;
  const selectedEvent =
    traceEvents.find((event) => event.observer_event_id === requestedEventId) ??
    traceEvents.at(-1) ??
    null;
  const attention = useMemo(() => deriveAttention(traceEvents), [traceEvents]);
  const voice = useMemo(
    () => deriveVoice(view === "room" ? traceEvents : observer.events),
    [view, traceEvents, observer.events],
  );

  const selectTrace = (traceId: string) => {
    setRequestedTraceId(traceId);
    setRequestedEventId(null);
  };

  const selectEvent = (event: ObservedEvent) => setRequestedEventId(event.observer_event_id);
  const selectAgent = (agent: AttentionView) => {
    if (agent.event) selectEvent(agent.event);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark">APE</span>
          <span className="brand-divider" aria-hidden="true" />
          <div>
            <strong>Signal Room</strong>
            <span>Event Observer</span>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Signal Room views">
          <button className={view === "room" ? "is-active" : ""} onClick={() => setView("room")} type="button" aria-pressed={view === "room"}>
            <LayoutDashboard aria-hidden="true" size={15} /> Room
          </button>
          <button className={view === "activity" ? "is-active" : ""} onClick={() => setView("activity")} type="button" aria-pressed={view === "activity"}>
            <Activity aria-hidden="true" size={15} /> Activity
          </button>
        </nav>
        <HealthStrip connection={observer.connection} health={observer.health} />
        <div className="boundary-label" aria-label="Read-only Observer view">
          <Eye aria-hidden="true" size={16} />
          <span>Read-only</span>
        </div>
      </header>

      {observer.error && (
        <div className="connection-alert" role="alert">
          <div><strong>Observer unavailable.</strong> <span>{observer.error}</span></div>
          <button onClick={observer.retry} type="button"><RefreshCw aria-hidden="true" size={15} /> Retry</button>
        </div>
      )}
      {observer.truncated && (
        <div className="retention-alert" role="status">
          <ShieldCheck aria-hidden="true" size={15} /> Showing the newest retained client window; the Observer Ledger remains authoritative.
        </div>
      )}

      {view === "room" ? (
        <main className="signal-layout">
          <SessionRail sessions={sessions} selectedTraceId={selectedTraceId} onSelect={selectTrace} />
          <div className="room-column">
            <TraceRoom events={traceEvents} selectedEventId={selectedEvent?.observer_event_id ?? null} onSelectEvent={selectEvent} />
            <AgentBench attention={attention} selectedAgentId={selectedEvent?.ape_agent_id ?? null} onSelect={selectAgent} />
          </div>
          <ContextInspector event={selectedEvent} />
        </main>
      ) : (
        <ActivityView
          events={observer.events}
          unlinkedEventIds={observer.unlinkedEventIds}
          unlinkedTotal={observer.unlinkedTotal}
          quarantine={observer.quarantine}
          quarantineTotal={observer.quarantineTotal}
        />
      )}

      <VoiceDock voice={voice} />
      <div className="sr-status" aria-live="polite">
        {observer.connection === "live" ? "Signal Room connected to Event Observer." : `Signal Room ${observer.connection}.`}
      </div>
    </div>
  );
}

export default App;
