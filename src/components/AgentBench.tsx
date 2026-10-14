import { BriefcaseBusiness, Code2, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AgentId, AttentionView } from "../lib/derive";

interface AgentBenchProps {
  attention: AttentionView[];
  selectedAgentId: string | null;
  onSelect: (agent: AttentionView) => void;
}

const icons = {
  business: BriefcaseBusiness,
  technical: Code2,
  personal: Heart,
} satisfies Record<AgentId, LucideIcon>;

export function AgentBench({ attention, selectedAgentId, onSelect }: AgentBenchProps) {
  return (
    <section className="agent-bench" aria-labelledby="attention-heading">
      <div className="bench-heading">
        <div>
          <span className="section-kicker">Attention bench</span>
          <h2 id="attention-heading">Who noticed</h2>
        </div>
        <span>APE decisions</span>
      </div>
      <div className="agent-grid">
        {attention.map((agent) => {
          const Icon = icons[agent.id];
          const selected = selectedAgentId === agent.id;
          return (
            <button
              className={`agent-card accent-${agent.accent}${agent.isFloorOwner ? " has-floor" : ""}${selected ? " is-selected" : ""}`}
              key={agent.id}
              onClick={() => onSelect(agent)}
              type="button"
              aria-pressed={selected}
            >
              <span className="agent-icon"><Icon aria-hidden="true" size={22} strokeWidth={1.8} /></span>
              <span className="agent-name">{agent.name}</span>
              <span className="agent-role">{agent.role}</span>
              <span className="agent-action">{agent.action}</span>
              <span className="agent-score">
                {agent.score === null ? "—" : agent.score.toFixed(2)}
              </span>
              <span className="attention-meter" aria-hidden="true">
                <span style={{ width: `${Math.max(4, (agent.score ?? 0) * 100)}%` }} />
              </span>
              {agent.isFloorOwner && <span className="floor-marker">Floor</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
