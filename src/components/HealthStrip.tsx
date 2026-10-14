import { Activity, AudioLines, BrainCircuit, Database, Radio } from "lucide-react";

import { componentHealth, humanize } from "../lib/derive";
import type { ConnectionState, ObserverHealth } from "../lib/observer-types";

interface HealthStripProps {
  connection: ConnectionState;
  health: ObserverHealth | null;
}

const statusClass = (state: string) =>
  state === "healthy" || state === "live" ? "is-healthy" : state === "unknown" ? "is-unknown" : "is-degraded";

export function HealthStrip({ connection, health }: HealthStripProps) {
  const items = [
    { label: connection === "live" ? "Observer live" : `Observer ${humanize(connection)}`, state: connection, icon: Radio },
    { label: `APE ${componentHealth(health, "ape")}`, state: componentHealth(health, "ape"), icon: BrainCircuit },
    { label: `MAR ${componentHealth(health, "mar")}`, state: componentHealth(health, "mar"), icon: Activity },
    { label: `MAP ${componentHealth(health, "map")}`, state: componentHealth(health, "map"), icon: AudioLines },
    { label: `KGK ${componentHealth(health, "kgk")}`, state: componentHealth(health, "kgk"), icon: Database },
  ];

  return (
    <div className="health-strip" aria-label="System health">
      {items.map(({ label, state, icon: Icon }) => (
        <span className={`health-item ${statusClass(state)}`} key={label}>
          <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

