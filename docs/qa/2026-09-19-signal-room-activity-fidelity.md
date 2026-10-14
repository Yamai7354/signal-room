# Signal Room Activity View — Fidelity and Boundary Record

Date: 2026-09-19  
Status: implemented and verified

## Delivered surface

The Activity view is a read-only cross-system ledger projection alongside the
existing Room view. It provides:

- source filters for APE, MAR, Business, KGK, and MAP;
- state filters for failures, unlinked events, and quarantined records;
- newest-first safe event summaries with status, agent display identity, and
  trace/run/source references;
- record selection and payload-safe context inspection;
- exact unlinked classification from Event Observer's run-aware projection;
- quarantine metadata without the quarantined candidate payload;
- responsive table-to-card presentation while retaining the MAP lifecycle dock.

`Misaka` remains a display label for the stable APE agent ID `business`.

## Explicit non-capabilities

The view does not send messages, invoke agents, retry work, release quarantine,
approve actions, play media, edit source records, or query canonical systems
directly. Filters change only the local presentation. Event Observer remains
the sole data boundary used by the frontend.

## Concept fidelity

The implementation follows the approved Direction A visual language and the
generated Activity concept: matte dark surfaces, restrained amber selection,
left filters, central ledger, right context, and the persistent voice lifecycle
dock.

The concept included illustrative command-like content (including a client
notification row) and media controls. Those were intentionally not built.
Every rendered row comes from the real Observer transport, and the dock reports
MAP lifecycle state without becoming a player.

## Verification evidence

Validated against a temporary real SQLite Observer Ledger containing seven
admitted cross-system events, one exact unlinked event, and one quarantined
unsupported-schema record.

- desktop viewport: 1584 × 1024, no horizontal overflow;
- mobile viewport: 390 × 844, no document horizontal overflow;
- Activity navigation, source filtering, failure filtering, unlinked filtering,
  quarantine filtering, and selection exercised;
- eight combined activity rows rendered (seven events plus one quarantine);
- MAP source filter returned exactly two records;
- unlinked and quarantine filters each returned exactly one record;
- quarantine inspector confirmed the candidate payload is unavailable;
- zero browser console errors and zero page errors;
- zero Axe violations for WCAG 2 A, 2 AA, and 2.1 AA tags;
- ESLint, Vitest, strict TypeScript, and Vite production build passed.

Temporary ledger, server, screenshots, browser script, and QA-only dependencies
were removed after validation.
