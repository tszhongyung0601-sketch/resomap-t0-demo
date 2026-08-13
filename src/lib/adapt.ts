import { spot } from "../data/demo";
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
 * is, and pulled forward by whatever a dropped stop frees up — never earlier
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
    const moved = Math.max(original, original + delay - freed);
    out.push({ ...s, at: toHHMM(moved) });
  }
  return out;
}

export interface AdaptPreview {
  trip: Trip;
  /** Arrival at the last stop of the day once the plan is applied. */
  endAt: string;
  /** What that same stop would slip to if nothing were changed. */
  doNothingEndAt: string;
  droppedNames: string[];
  swappedTo: string | null;
  swappedFrom: string | null;
  savedMetres: number;
}

/** One computation, shared by the proposal card and the apply step, so the card
 *  can never promise a time the timeline then contradicts. */
export function previewAdapt(trip: Trip, adapt: Adapt): AdaptPreview {
  const delay = adapt.delayMin ?? 0;
  const droppedNames: string[] = [];
  let swappedTo: string | null = null;
  let swappedFrom: string | null = null;
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
        if (adapt.plan.drop.includes(s.id)) {
          droppedNames.push(spot(s.spotId).name);
          savedMetres += s.from?.metres ?? 0;
        }
      }

      let stops = shift(t.stops, adapt.plan.drop, delay);

      if (adapt.plan.swap) {
        const swap = adapt.plan.swap;
        stops = stops.map((s) => {
          if (!swap[s.id]) return s;
          swappedFrom = spot(s.spotId).name;
          swappedTo = spot(swap[s.id]).name;
          return { ...s, spotId: swap[s.id], changed: "改成室內" };
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
    swappedTo,
    swappedFrom,
    savedMetres,
  };
}

export const applyAdapt = (trip: Trip, adapt: Adapt): Trip =>
  previewAdapt(trip, adapt).trip;
