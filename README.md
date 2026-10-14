# Signal Room

Signal Room is a separate, read-only operator interface for Event Observer.
It shows traced sessions, APE attention decisions, response-floor ownership,
safe cross-system event summaries, adapter health, MAP voice lifecycle, and a
filterable cross-system Activity view for failures, unlinked events, and
quarantined records.

It does **not** import APE domain code, connect to MAR/MAP/KGK buses, query
canonical Business storage, send agent input, play reference-only media,
approve work, retry a run, or expose commands to an agent.

## Run locally

Start Event Observer on its default loopback port, then run the Vite server:

```powershell
# E:\ai\event-observer
event-observer-serve --db .\data\observer.db

# E:\ai\signal-room
npm install
npm run dev
```

Open `http://127.0.0.1:4173`. Vite proxies `/v1` to
`http://127.0.0.1:8765`, preserving the Observer's no-CORS boundary. Override
the development target with `OBSERVER_TRANSPORT_URL` only when deliberately
testing another local endpoint.

## Production-style local serving

Build Signal Room and let Event Observer serve the static output on the same
loopback origin:

```powershell
# E:\ai\signal-room
npm run build

# E:\ai\event-observer
event-observer-serve `
  --db .\data\observer.db `
  --ui-dir E:\ai\signal-room\dist
```

Open `http://127.0.0.1:8765`.

## Boundary and delivery semantics

- All browser requests are relative `/v1` reads.
- Initial history is cursor-paged from the Observer Ledger.
- Live updates use resumable SSE and deduplicate by `observer_event_id`.
- Unlinked and quarantine state comes from dedicated Observer projections; the
  browser does not infer either state.
- Activity filters are local view controls only. They cannot retry, release,
  approve, or mutate a record.
- The browser retains at most 5,000 events; the ledger remains authoritative.
- `Misaka` is a display label over the stable APE ID `business`.
- Raw content and MAP media are not fetched by this frontend.
- An unavailable transport produces an explicit offline state, not demo data.
- Transport responses are validated at runtime before they enter UI state.

## Verification

```powershell
npm run lint
npm test
npm run build
```
