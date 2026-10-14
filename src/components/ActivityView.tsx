import { AlertTriangle, Filter, Link2Off, RadioTower, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ACTIVITY_SOURCES,
  ACTIVITY_STATES,
  deriveActivityRecords,
  filterActivityRecords,
} from "../lib/activity";
import type { ActivitySource, ActivityState } from "../lib/activity";
import { formatRelativeTime, humanize } from "../lib/derive";
import type { ObservedEvent, QuarantineRecord } from "../lib/observer-types";
import { ActivityInspector } from "./ActivityInspector";

interface ActivityViewProps {
  events: ObservedEvent[];
  unlinkedEventIds: ReadonlySet<string>;
  unlinkedTotal: number;
  quarantine: QuarantineRecord[];
  quarantineTotal: number;
}

const STATE_LABELS: Record<ActivityState, string> = {
  all: "All activity",
  failures: "Failures",
  unlinked: "Unlinked",
  quarantined: "Quarantined",
};

export function ActivityView({
  events,
  unlinkedEventIds,
  unlinkedTotal,
  quarantine,
  quarantineTotal,
}: ActivityViewProps) {
  const [source, setSource] = useState<ActivitySource>("all");
  const [state, setState] = useState<ActivityState>("all");
  const [requestedRecordId, setRequestedRecordId] = useState<string | null>(null);
  const records = useMemo(
    () => deriveActivityRecords(events, unlinkedEventIds, quarantine),
    [events, unlinkedEventIds, quarantine],
  );
  const filtered = useMemo(
    () => filterActivityRecords(records, source, state),
    [records, source, state],
  );
  const selected = filtered.find((record) => record.id === requestedRecordId) ?? filtered[0] ?? null;

  const stateCount = (candidate: ActivityState) => {
    if (candidate === "unlinked") return unlinkedTotal;
    if (candidate === "quarantined") return quarantineTotal;
    return filterActivityRecords(records, "all", candidate).length;
  };

  return (
    <main className="activity-layout">
      <aside className="activity-filters" aria-label="Activity filters">
        <div className="rail-heading">
          <div>
            <span className="section-kicker">Cross-system</span>
            <h2><Filter aria-hidden="true" size={16} /> Filters</h2>
          </div>
        </div>

        <fieldset className="filter-group">
          <legend>Source</legend>
          {ACTIVITY_SOURCES.map((item) => (
            <button
              className={source === item ? "is-active" : ""}
              key={item}
              onClick={() => setSource(item)}
              type="button"
              aria-pressed={source === item}
            >
              <span>{humanize(item)}</span>
              {item !== "all" && <small>{records.filter((record) => record.sourceSystem === item).length}</small>}
            </button>
          ))}
        </fieldset>

        <fieldset className="filter-group">
          <legend>State</legend>
          {ACTIVITY_STATES.map((item) => (
            <button
              className={state === item ? "is-active" : ""}
              key={item}
              onClick={() => setState(item)}
              type="button"
              aria-pressed={state === item}
            >
              <span>{STATE_LABELS[item]}</span>
              <small>{stateCount(item)}</small>
            </button>
          ))}
        </fieldset>

        <p className="filter-boundary">Filters change this local view only. They do not retry, release, or modify records.</p>
      </aside>

      <section className="activity-canvas" aria-labelledby="activity-heading">
        <div className="activity-heading">
          <div>
            <span className="section-kicker">Observer ledger</span>
            <h1 id="activity-heading">Activity</h1>
          </div>
          <span>{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <div className="activity-empty">
            <RadioTower aria-hidden="true" size={30} />
            <h2>No matching records</h2>
            <p>The Observer has no records for this source and state combination.</p>
          </div>
        ) : (
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr><th>Time</th><th>Source</th><th>Event</th><th>Status</th><th>Agent</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const isSelected = selected?.id === record.id;
                  return (
                    <tr className={isSelected ? "is-selected" : ""} key={record.id}>
                      <td data-label="Time" title={record.occurredAt}>{formatRelativeTime(record.occurredAt)}</td>
                      <td data-label="Source"><span className={`source-mark source-${record.sourceSystem}`} />{humanize(record.sourceSystem)}</td>
                      <td data-label="Event">
                        <button
                          className="activity-select"
                          onClick={() => setRequestedRecordId(record.id)}
                          type="button"
                          aria-pressed={isSelected}
                        >
                          <strong>{record.title}</strong>
                          <span>{record.detail}</span>
                        </button>
                      </td>
                      <td data-label="Status">
                        <span className={`status-chip status-${record.status.toLowerCase()}`}>
                          {record.kind === "quarantine" && <ShieldAlert aria-hidden="true" size={12} />}
                          {record.kind === "event" && record.unlinked && <Link2Off aria-hidden="true" size={12} />}
                          {record.kind === "event" && ["failed", "conflict", "cancelled", "rejected"].includes(record.status.toLowerCase()) && <AlertTriangle aria-hidden="true" size={12} />}
                          {record.unlinked ? "Unlinked" : humanize(record.status)}
                        </span>
                      </td>
                      <td data-label="Agent">{record.agent}</td>
                      <td className="activity-reference" data-label="Reference" title={record.reference}>{record.reference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ActivityInspector record={selected} />
    </main>
  );
}
