import type { DemoEvent, TrackedEvent } from "../types";

const KEY = "resomap_t0_events";

/**
 * Every meaningful interaction lands here. The ops screen reads this back, so
 * the funnel it shows is the presenter's own clicks rather than a static
 * picture of a funnel.
 */
export function track(type: TrackedEvent, payload?: Record<string, unknown>) {
  const events = readEvents();
  events.push({
    id: `e${events.length}`,
    ts: Date.now(),
    type,
    payload,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    /* storage full or blocked — the demo keeps working without it */
  }
  window.dispatchEvent(new CustomEvent("resomap:event"));
}

export function readEvents(): DemoEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as DemoEvent[];
  } catch {
    return [];
  }
}

export function clearEvents() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("resomap:event"));
}

export function countOf(type: TrackedEvent): number {
  return readEvents().filter((e) => e.type === type).length;
}
