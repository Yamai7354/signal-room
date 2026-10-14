import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadHealth,
  loadInitialEvents,
  loadQuarantine,
  loadUnlinked,
  openObserverStream,
} from "./observer-client";
import type {
  ConnectionState,
  ObservedEvent,
  ObserverHealth,
  QuarantineRecord,
} from "./observer-types";

const MAX_RETAINED_EVENTS = 5000;

function mergeEvent(previous: ObservedEvent[], incoming: ObservedEvent): ObservedEvent[] {
  if (previous.some((event) => event.observer_event_id === incoming.observer_event_id)) {
    return previous;
  }
  return [...previous, incoming]
    .sort((left, right) => left.ingest_sequence - right.ingest_sequence)
    .slice(-MAX_RETAINED_EVENTS);
}

export interface ObserverState {
  events: ObservedEvent[];
  health: ObserverHealth | null;
  connection: ConnectionState;
  error: string | null;
  truncated: boolean;
  unlinkedEventIds: ReadonlySet<string>;
  unlinkedTotal: number;
  quarantine: QuarantineRecord[];
  quarantineTotal: number;
  retry: () => void;
}

export function useObserver(): ObserverState {
  const [events, setEvents] = useState<ObservedEvent[]>([]);
  const [health, setHealth] = useState<ObserverHealth | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [unlinkedEventIds, setUnlinkedEventIds] = useState<ReadonlySet<string>>(new Set());
  const [unlinkedTotal, setUnlinkedTotal] = useState(0);
  const [quarantine, setQuarantine] = useState<QuarantineRecord[]>([]);
  const [quarantineTotal, setQuarantineTotal] = useState(0);
  const [generation, setGeneration] = useState(0);
  const retry = useCallback(() => setGeneration((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let stream: ReturnType<typeof openObserverStream> | null = null;
    let auxiliaryTimer: number | null = null;

    const refreshHealth = async () => {
      try {
        const nextHealth = await loadHealth(controller.signal);
        if (!disposed) setHealth(nextHealth);
      } catch (caught) {
        if (!disposed && !(caught instanceof DOMException && caught.name === "AbortError")) {
          setHealth(null);
        }
      }
    };

    const applyReviewRecords = (
      unlinked: Awaited<ReturnType<typeof loadUnlinked>>,
      quarantined: Awaited<ReturnType<typeof loadQuarantine>>,
    ) => {
      setUnlinkedEventIds(new Set(unlinked.events.map((event) => event.observer_event_id)));
      setUnlinkedTotal(unlinked.total_count);
      setQuarantine(quarantined.records);
      setQuarantineTotal(quarantined.total_count);
    };

    const refreshReviewRecords = async () => {
      try {
        const [unlinked, quarantined] = await Promise.all([
          loadUnlinked(controller.signal),
          loadQuarantine(controller.signal),
        ]);
        if (!disposed) applyReviewRecords(unlinked, quarantined);
      } catch (caught) {
        if (!disposed && !(caught instanceof DOMException && caught.name === "AbortError")) {
          setError(caught instanceof Error ? caught.message : "Observer review records are unavailable.");
        }
      }
    };

    const connect = async () => {
      setConnection("loading");
      setError(null);
      try {
        const [snapshot, , reviewRecords] = await Promise.all([
          loadInitialEvents(controller.signal),
          refreshHealth(),
          Promise.all([
            loadUnlinked(controller.signal),
            loadQuarantine(controller.signal),
          ]),
        ]);
        if (disposed) return;
        setEvents(snapshot.events);
        setTruncated(snapshot.truncated);
        applyReviewRecords(...reviewRecords);
        const cursor = snapshot.events.at(-1)?.ingest_sequence ?? 0;
        stream = openObserverStream(cursor, {
          onEvent: (event) => setEvents((current) => mergeEvent(current, event)),
          onOpen: () => {
            setConnection("live");
            setError(null);
            void refreshHealth();
            void refreshReviewRecords();
          },
          onError: () => setConnection("reconnecting"),
        });
        auxiliaryTimer = window.setInterval(() => {
          void refreshHealth();
          void refreshReviewRecords();
        }, 15_000);
      } catch (caught) {
        if (disposed || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setConnection("offline");
        setError(caught instanceof Error ? caught.message : "Observer is unavailable.");
      }
    };

    void connect();
    return () => {
      disposed = true;
      controller.abort();
      stream?.close();
      if (auxiliaryTimer !== null) window.clearInterval(auxiliaryTimer);
    };
  }, [generation]);

  return useMemo(
    () => ({
      events,
      health,
      connection,
      error,
      truncated,
      unlinkedEventIds,
      unlinkedTotal,
      quarantine,
      quarantineTotal,
      retry,
    }),
    [
      events,
      health,
      connection,
      error,
      truncated,
      unlinkedEventIds,
      unlinkedTotal,
      quarantine,
      quarantineTotal,
      retry,
    ],
  );
}
