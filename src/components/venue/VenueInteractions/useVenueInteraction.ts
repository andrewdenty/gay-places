"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const SESSION_KEY = "gp_session_id";

type Tag = "classic" | "trending" | "underrated" | null;

interface InteractionState {
  beenHere: boolean;
  recommend: boolean;
  tag: Tag;
}

interface Counts {
  beenHereCount: number;
  recommendCount: number;
  classicCount: number;
  trendingCount: number;
  underratedCount: number;
}

function generateId(): string {
  // crypto.randomUUID() requires a secure context (HTTPS / localhost).
  // Fall back to a Math.random-based UUID v4 when unavailable (e.g. LAN HTTP).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useVenueInteraction(
  venueId: string,
  initialCounts: Counts,
  initialInteraction?: { been_here: boolean; recommend: boolean; tag: Tag },
) {
  const [sessionId, setSessionId] = useState("");
  const [state, setState] = useState<InteractionState>({
    beenHere: initialInteraction?.been_here ?? false,
    recommend: initialInteraction?.recommend ?? false,
    tag: initialInteraction?.tag ?? null,
  });
  const [counts, setCounts] = useState<Counts>(initialCounts);

  // Keep a ref to current state so callbacks don't need to use functional setState
  // (avoids calling setCounts as a side effect inside setState updaters, which
  // React Strict Mode would double-invoke, causing count to jump by 2)
  const stateRef = useRef(state);
  stateRef.current = state;

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Check if this session has an existing interaction (client-side fetch)
  useEffect(() => {
    if (!sessionId) return;
    if (initialInteraction) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/venue-interaction?venue_id=${encodeURIComponent(venueId)}&session_id=${encodeURIComponent(sessionId)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.interaction) {
          const restored: InteractionState = {
            beenHere: data.interaction.been_here ?? false,
            recommend: data.interaction.recommend ?? false,
            tag: data.interaction.tag ?? null,
          };
          stateRef.current = restored;
          setState(restored);
        }
      } catch {
        // ignore - non-critical
      }
    })();
    return () => controller.abort();
  }, [sessionId, venueId, initialInteraction]);

  const persist = useCallback(
    (next: InteractionState) => {
      if (!sessionId) return;
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        fetch("/api/venue-interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venue_id: venueId,
            session_id: sessionId,
            been_here: next.beenHere,
            recommend: next.recommend,
            tag: next.tag,
          }),
        }).catch(() => {
          // fail silently — optimistic UI
        });
      }, 150);
    },
    [sessionId, venueId],
  );

  const toggleBeenHere = useCallback(() => {
    const prev = stateRef.current;
    const newBeenHere = !prev.beenHere;
    const next = { ...prev, beenHere: newBeenHere };
    stateRef.current = next;
    setState(next);
    setCounts((c) => ({
      ...c,
      beenHereCount: c.beenHereCount + (newBeenHere ? 1 : -1),
    }));
    persist(next);
  }, [persist]);

  const toggleRecommend = useCallback(() => {
    const prev = stateRef.current;
    const wasRecommend = prev.recommend;
    const next: InteractionState = {
      ...prev,
      recommend: !wasRecommend,
      tag: wasRecommend ? null : prev.tag,
    };
    stateRef.current = next;
    setState(next);
    setCounts((c) => {
      const newCounts = {
        ...c,
        recommendCount: c.recommendCount + (next.recommend ? 1 : -1),
      };
      if (wasRecommend && prev.tag) {
        const key = `${prev.tag}Count` as keyof Counts;
        newCounts[key] = (c[key] as number) - 1;
      }
      return newCounts;
    });
    persist(next);
  }, [persist]);

  const selectTag = useCallback(
    (tag: Tag) => {
      const prev = stateRef.current;
      if (!prev.recommend) return;
      const isSame = prev.tag === tag;
      const next: InteractionState = {
        ...prev,
        tag: isSame ? null : tag,
      };
      stateRef.current = next;
      setState(next);
      setCounts((c) => {
        const newCounts = { ...c };
        if (prev.tag) {
          const oldKey = `${prev.tag}Count` as keyof Counts;
          newCounts[oldKey] = (c[oldKey] as number) - 1;
        }
        if (!isSame && tag) {
          const newKey = `${tag}Count` as keyof Counts;
          newCounts[newKey] = (c[newKey] as number) + 1;
        }
        return newCounts;
      });
      persist(next);
    },
    [persist],
  );

  return {
    sessionId,
    state,
    counts,
    toggleBeenHere,
    toggleRecommend,
    selectTag,
  };
}
