import { AudioLines, CircleSlash2, Volume2 } from "lucide-react";

import type { VoiceView } from "../lib/derive";

interface VoiceDockProps {
  voice: VoiceView;
}

const bars = [12, 20, 31, 18, 42, 27, 52, 35, 22, 45, 62, 38, 50, 26, 17, 31, 22, 13, 9, 16, 8, 12, 6, 9];

export function VoiceDock({ voice }: VoiceDockProps) {
  const active = voice.state !== "idle";
  return (
    <footer className={`voice-dock voice-${voice.state}`} aria-label="MAP voice status">
      <div className="voice-mark">
        {active ? <Volume2 aria-hidden="true" size={25} /> : <CircleSlash2 aria-hidden="true" size={23} />}
      </div>
      <div className="voice-copy">
        <span className="section-kicker">MAP voice</span>
        <strong>{voice.label}</strong>
        <span>{voice.detail}</span>
      </div>
      <div className="waveform" aria-hidden="true">
        {bars.map((height, index) => <i key={`${height}-${index}`} style={{ height }} />)}
      </div>
      <div className="voice-boundary">
        <AudioLines aria-hidden="true" size={18} />
        <span>Lifecycle only</span>
        <small>Media stays in MAP</small>
      </div>
    </footer>
  );
}

