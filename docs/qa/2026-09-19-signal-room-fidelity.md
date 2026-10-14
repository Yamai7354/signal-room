# Signal Room fidelity and boundary check

**Date:** 2026-09-19  
**Accepted concept:** `ape-direction-a-signal-room.png`  
**Native desktop check:** 1584 × 1024  
**Mobile check:** 390 × 844

## Fidelity ledger

| Comparison point | Concept evidence | Browser render evidence | Result |
|---|---|---|---|
| Container model | Session rail, central room, agent bench, right inspector, persistent voice dock. | The same five regions are present at the concept's native desktop dimensions. | Matched. |
| Palette and typography | Matte Night/Slate surfaces, amber floor/Business accent, blue Technical, lilac Personal, Sora plus IBM Plex Sans. | Exact direction tokens and locally bundled font families are used. | Matched. |
| Response-floor hierarchy | Amber bordered floor handoff is the central focal state. | The selected APE winner is rendered as the dominant floor grant. | Matched; `business` is displayed as Misaka by current naming decision. |
| Agent attention | Three distinct decisions with action, score, identity color, and floor indication. | All three APE attention records render with action, numeric score, meter, and separate floor marker. | Matched with compact cards for denser real metadata. |
| Context inspector | Right-side rationale/evidence pane with identifiers behind the main experience. | Selected Observer record shows safe payload, source, status, sensitivity, authority, references, and sequence. | Matched to the implemented Observer contract. |
| Voice dock | Persistent, visually central MAP audio state and waveform. | Persistent MAP lifecycle dock shows synthesis/playback status and makes the reference-only boundary explicit. | Matched structurally; no playback control is shown because Observer exposes no playable media command. |
| Responsive behavior | Agent bench becomes compact and inspector becomes a downstream sheet; voice remains reachable. | At 390 px the sessions scroll horizontally, agents stack, inspector follows, and voice status stays reachable with no horizontal overflow. | Matched. |

## Above-the-fold copy check

Preserved concept language: `APE`, `Signal Room`, `Sessions`, `Current event`,
`Response floor`, `has the floor`, `Context`, agent names/roles, and MAP voice
status. Added boundary copy is limited to `Event Observer`, `Observed traces`,
`Read-only`, `Trace spine`, and `Lifecycle only`; each describes implemented
behavior rather than a new product claim.

## Intentional deviations

1. The concept's sample user/agent conversation is not reproduced. This first
   release has no command or canonical transcript contract, so it renders the
   verified Observer trace instead of fake message content.
2. The concept's New, Settings, playback, captions, volume, composer, and
   push-to-talk controls are absent. None exists in the read-only Observer
   boundary, and inert controls would overstate system capability.
3. `Misaka` is presentation-only for stable APE agent ID `business`; no runtime
   or persistence identifiers changed.
4. MAP audio is lifecycle/reference-only. The dock intentionally does not
   turn a `map:media:` reference into browser file access.

## Browser and accessibility evidence

- Same-origin built frontend and `/v1` API both returned HTTP 200.
- Session selection, agent-decision selection, inspector update, health read,
  and SSE connection ran through the real Observer transport.
- Desktop document size was exactly 1584 × 1024 with no horizontal overflow.
- Mobile width was exactly 390 px with no horizontal overflow.
- Browser console errors: zero.
- Browser page errors: zero.
- Axe WCAG 2 A/AA and 2.1 AA violations: zero after correcting trace-button
  ARIA semantics.
- The in-app browser runtime could not initialize because its internal module
  import was blocked; local Chrome through temporary Playwright Core was used
  as the documented fallback.

## Verdict

The implemented read-only surface is faithful to Direction A's visual and
information hierarchy. The remaining differences are required authority and
data-contract boundaries, not unfinished visual substitutions.
