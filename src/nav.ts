import { createContext, useContext } from "react";
import type { Deal, ServiceId, StoryLength, Trip } from "./types";

/**
 * A route stack on top of the tabs. No router library: every flow in this app
 * is short and linear, and a dependency that exists to express `push`/`pop`
 * would be paying rent on a problem we do not have.
 */
export type Route =
  | { k: "search"; q: string }
  | { k: "dest"; id: string }
  | { k: "poi"; id: string }
  | { k: "create"; destId?: string }
  | { k: "trip"; id: string }
  | { k: "day"; tripId: string; n: number }
  | { k: "tripmap"; tripId: string; n: number }
  | { k: "travellers"; tripId: string }
  | { k: "consensus"; tripId: string }
  | { k: "alternatives"; tripId: string }
  | { k: "stay"; destId?: string }
  | { k: "tickets"; destId?: string }
  | { k: "product"; id: string }
  | { k: "transport"; destId?: string }
  | { k: "carrental"; destId?: string }
  | { k: "service"; id: ServiceId }
  | { k: "admin" }
  | { k: "demo" };

export type Tab = "explore" | "map" | "trips" | "deals" | "profile";

/**
 * Everything a screen is allowed to do to the rest of the app.
 *
 * Screens receive this and nothing else — no store, no dispatch, no direct
 * setState. It keeps each screen independently readable, and it is the reason
 * a screen can be rewritten without reading App.tsx.
 */
export interface Nav {
  go: (r: Route) => void;
  back: () => void;
  /** Switch tab and clear the stack. */
  tab: (t: Tab) => void;

  /**
   * The traveller's LIVE trips.
   *
   * Screens must read this, never the static exports in data/trips.ts. Those
   * are the starting fixtures; the moment somebody adds a stop or applies an
   * adjustment they are stale, and a screen reading them will cheerfully report
   * success against a trip that no longer exists.
   */
  trips: Trip[];

  /* ---- things that open over the current screen rather than replacing it -- */
  /** Open the outbound sheet for a commercial link. */
  openDeal: (d: Deal) => void;
  /** Open the "you have arrived" prompt for a POI with a story. */
  arrive: (poiId: string) => void;
  /**
   * Open the audio story directly (from a POI page or the arrival sheet).
   * `length` picks the edit: the 30 秒 one people play in a queue, or the full
   * one. Defaults to the full edit when the caller has no opinion.
   */
  play: (poiId: string, length?: StoryLength) => void;
  /** Open the quick-add sheet for an itinerary day. */
  addTo: (tripId: string, day: number) => void;
  /** Open the 更多服務 sheet. */
  moreServices: () => void;

  /* ---------------------------------------------------------- trip state -- */
  /** Add a POI to a trip day. Returns the day it landed on. */
  addPoi: (tripId: string, day: number, poiId: string) => void;
  /** Create the demo trip for a destination and open it. */
  createTrip: (destId: string) => void;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const n = useContext(NavContext);
  if (!n) throw new Error("useNav outside NavContext");
  return n;
}
