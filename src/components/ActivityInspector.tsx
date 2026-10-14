import { AlertTriangle, Clock3, Fingerprint, ShieldAlert } from "lucide-react";

import type { ActivityRecord } from "../lib/activity";
import { humanize } from "../lib/derive";
import { ContextInspector } from "./ContextInspector";

interface ActivityInspectorProps {
  record: ActivityRecord | null;
}

export function ActivityInspector({ record }: ActivityInspectorProps) {
  if (record?.kind === "event") {
    return <ContextInspector event={record.event} />;
  }

  return (
    <aside className="context-inspector" aria-labelledby="activity-context-heading">
      <div className="inspector-heading">
        <div>
          <span className="section-kicker">Selected record</span>
          <h2 id="activity-context-heading">Context</h2>
        </div>
      </div>
      {!record ? (
        <div className="inspector-empty">
          <Fingerprint aria-hidden="true" size={28} />
          <p>Select an activity record to inspect its safe metadata.</p>
        </div>
      ) : (
        <>
          <section className="inspector-section quarantine-summary">
            <span className="inspector-label"><ShieldAlert aria-hidden="true" size={14} /> Quarantined record</span>
            <h3>{humanize(record.sourceSystem)} record withheld</h3>
            <p>{record.detail}</p>
          </section>
          <dl className="inspector-facts">
            <div><dt>Source</dt><dd>{humanize(record.sourceSystem)}</dd></div>
            <div><dt>Status</dt><dd>Quarantined</dd></div>
            <div><dt>Source event</dt><dd>{record.quarantine.source_event_id}</dd></div>
            <div><dt>Quarantine ID</dt><dd>{record.quarantine.quarantine_id}</dd></div>
          </dl>
          <section className="inspector-section quarantine-boundary">
            <span className="inspector-label"><AlertTriangle aria-hidden="true" size={14} /> Boundary</span>
            <p>The candidate payload is intentionally not available through Signal Room. Review the source system or Observer ledger under an authorized workflow.</p>
          </section>
          <div className="inspector-footer">
            <Clock3 aria-hidden="true" size={13} />
            <span title={record.occurredAt}>{new Date(record.occurredAt).toLocaleString()}</span>
          </div>
        </>
      )}
    </aside>
  );
}
