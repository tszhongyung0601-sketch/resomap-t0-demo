import { poi } from "../data";
import { distance } from "./geo";
import type { Adapt, Stop, Trip } from "../types";

const toMin = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (v: number) =>
  `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;

/**
 * Times shift; they are not recomputed from scratch.
 *
 * A planned day has slack in it — a booking at 18:30 is at 18:30 because
 * somebody booked it, not because it is the sum of the walking times. Rebuilding
 * the clock from the first stop silently squeezes that slack out and moves
 * dinner two hours earlier, which is exactly the kind of "helpful" edit that
 * makes people stop trusting an assistant.
 *
 * So: every stop keeps its original time, pushed back by however late the group
 * is, pulled forward by whatever a dropped stop frees up, and never earlier
 * than it was originally planned.
 */
function shift(stops: Stop[], dropIds: string[], delay: number): Stop[] {
  let freed = 0;
  const out: Stop[] = [];
  for (const s of stops) {
    if (dropIds.includes(s.id)) {
      freed += s.stayMin + (s.from?.min ?? 0);
      continue;
    }
    const original = toMin(s.at);
    out.push({ ...s, at: toHHMM(Math.max(original, original + delay - freed)) });
  }
  return out;
}

/**
 * Distance genuinely saved by removing a stop: the two legs it sat between,
 * minus the direct hop that replaces them.
 *
 * Taking only the inbound leg would overstate it — you still have to travel
 * from wherever you are to wherever you are going next. This is the difference
 * between a number a traveller can check on the map and a number that just
 * sounds good on a card.
 */
function metresSaved(stops: Stop[], dropId: string): number {
  const i = stops.findIndex((s) => s.id === dropId);
  if (i < 0) return 0;
  const inbound = stops[i].from?.metres ?? 0;
  const outbound = stops[i + 1]?.from?.metres ?? 0;
  const prev = stops[i - 1];
  const next = stops[i + 1];
  if (!prev || !next) return inbound + outbound;
  const direct = distance(poi(prev.poiId), poi(next.poiId));
  return Math.max(0, inbound + outbound - direct);
}

export interface AdaptPreview {
  trip: Trip;
  /** Arrival at the last stop of the day once the plan is applied. */
  endAt: string;
  /** What that same stop would slip to if nothing were changed. */
  doNothingEndAt: string;
  droppedNames: string[];
  swappedFrom: string | null;
  swappedTo: string | null;
  /** Minutes handed back by dropping stops. The metric that matters when late. */
  savedMin: number;
  /** Metres genuinely not walked. Only worth showing when it is substantial. */
  savedMetres: number;
}

/**
 * One computation, shared by the proposal card and the apply step, so the card
 * can never promise a time the timeline then contradicts.
 */
export function previewAdapt(trip: Trip, adapt: Adapt): AdaptPreview {
  const delay = adapt.delayMin ?? 0;
  const droppedNames: string[] = [];
  let swappedFrom: string | null = null;
  let swappedTo: string | null = null;
  let savedMin = 0;
  let savedMetres = 0;
  let endAt = "";
  let doNothingEndAt = "";

  const days = trip.days.map((d) => {
    if (d.n !== adapt.day) return d;

    const tracks = d.tracks.map((t) => {
      const untouched = shift(t.stops, [], delay);
      const lastUntouched = untouched[untouched.length - 1];
      if (lastUntouched) doNothingEndAt = lastUntouched.at;

      for (const s of t.stops) {
        if (!adapt.plan.drop.includes(s.id)) continue;
        droppedNames.push(poi(s.poiId).name);
        savedMin += s.stayMin + (s.from?.min ?? 0);
        savedMetres += metresSaved(t.stops, s.id);
      }

      let stops = shift(t.stops, adapt.plan.drop, delay);

      if (adapt.plan.swap) {
        const swap = adapt.plan.swap;
        stops = stops.map((s) => {
          if (!swap[s.id]) return s;
          swappedFrom = poi(s.poiId).name;
          swappedTo = poi(swap[s.id]).name;
          return { ...s, poiId: swap[s.id], changed: adapt.swapNote ?? "已調整" };
        });
      }

      if (delay > 0 && stops[0]) {
        stops = stops.map((s, i) => (i === 0 ? { ...s, changed: "因延後調整" } : s));
      }

      const last = stops[stops.length - 1];
      if (last) endAt = last.at;
      return { ...t, stops };
    });

    return { ...d, tracks };
  });

  return {
    trip: { ...trip, days },
    endAt,
    doNothingEndAt,
    droppedNames,
    swappedFrom,
    swappedTo,
    savedMin,
    savedMetres,
  };
}

export const applyAdapt = (trip: Trip, adapt: Adapt): Trip =>
  previewAdapt(trip, adapt).trip;

/** "80" -> "1 小時 20 分". Used so a duration is never written down twice. */
export function dur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} 分`;
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`;
}
