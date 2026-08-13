import { SPOT_BY_ID } from "../data/spots";
import { WALK_CAP_METRES } from "../types";
import type {
  AdaptOption,
  Branch,
  DayPlan,
  Preference,
  Stop,
  Trip,
  TravellerId,
} from "../types";

/* ------------------------------------------------------------------ clock */

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Re-derive every arrival time in a branch from its first stop onwards. */
export function retime(branch: Branch, startAt?: string): Branch {
  let clock = toMinutes(startAt ?? branch.stops[0]?.arrive ?? "09:00");
  const stops = branch.stops.map((stop, i) => {
    if (i > 0) clock += stop.legFrom?.minutes ?? 0;
    const next: Stop = { ...stop, arrive: toHHMM(clock) };
    clock += stop.stayMin;
    return next;
  });
  return { ...branch, stops };
}

/* -------------------------------------------------------- per-day summary */

export interface DayLoad {
  /** Metres walked, per traveller. Only `walk` legs count. */
  walkMetres: Record<TravellerId, number>;
  /** JPY spent, per traveller: stop costs plus leg costs. */
  spendJpy: Record<TravellerId, number>;
  endsAt: string;
}

const ALL: TravellerId[] = ["che", "yu", "kai", "ting"];

export function loadOfDay(day: DayPlan): DayLoad {
  const walk = Object.fromEntries(ALL.map((t) => [t, 0])) as Record<TravellerId, number>;
  const spend = Object.fromEntries(ALL.map((t) => [t, 0])) as Record<TravellerId, number>;
  let end = 0;

  for (const branch of day.branches) {
    for (const stop of branch.stops) {
      for (const t of branch.travellers) {
        if (stop.legFrom?.mode === "walk") walk[t] += stop.legFrom.metres;
        spend[t] += stop.costJpy + (stop.legFrom?.costJpy ?? 0);
      }
      end = Math.max(end, toMinutes(stop.arrive) + stop.stayMin);
    }
  }
  return { walkMetres: walk, spendJpy: spend, endsAt: toHHMM(end) };
}

/* ----------------------------------------------------------- violations */

export interface Violation {
  travellerId: TravellerId;
  kind: "walk" | "budget";
  message: string;
}

/**
 * The check that runs after a manual drag. Manual editing and the AI are not
 * two separate systems: you move a card, and the app immediately tells you
 * whose constraint you just broke.
 */
export function violationsOfDay(
  day: DayPlan,
  prefs: Record<TravellerId, Preference>,
): Violation[] {
  const load = loadOfDay(day);
  const out: Violation[] = [];

  for (const t of ALL) {
    const pref = prefs[t];
    const cap = WALK_CAP_METRES[pref.walkCap];
    if (load.walkMetres[t] > cap) {
      out.push({
        travellerId: t,
        kind: "walk",
        message: `步行 ${(load.walkMetres[t] / 1000).toFixed(1)}km，超過上限 ${(cap / 1000).toFixed(1)}km`,
      });
    }
    if (load.spendJpy[t] > pref.dailyCap) {
      out.push({
        travellerId: t,
        kind: "budget",
        message: `當日花費 ¥${load.spendJpy[t].toLocaleString()}，超支 ¥${(load.spendJpy[t] - pref.dailyCap).toLocaleString()}`,
      });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- adapt */

/** Apply a chosen mid-trip option to the live trip and re-time what follows. */
export function applyAdapt(
  trip: Trip,
  day: number,
  option: AdaptOption,
  badge: string,
): Trip {
  const days = trip.days.map((d) => {
    if (d.day !== day) return d;

    const effect = option.effect;

    const branches = d.branches.map((branch) => {
      let stops = branch.stops;

      switch (effect.type) {
        case "drop":
          stops = stops.filter((s) => s.stopId !== effect.stopId);
          break;
        case "shorten":
          stops = stops.map((s) =>
            s.stopId === effect.stopId
              ? {
                  ...s,
                  stayMin: Math.max(15, s.stayMin - effect.byMin),
                  adaptedBy: badge,
                }
              : s,
          );
          break;
        case "swap":
          stops = stops.map((s) =>
            s.stopId === effect.stopId
              ? { ...s, spotId: effect.toSpotId, adaptedBy: badge }
              : s,
          );
          break;
        case "mode": {
          const { stopIds, to, extraCostJpy } = effect;
          const share = Math.round(extraCostJpy / Math.max(1, stopIds.length));
          stops = stops.map((s) =>
            stopIds.includes(s.stopId) && s.legFrom
              ? {
                  ...s,
                  adaptedBy: badge,
                  legFrom: {
                    ...s.legFrom,
                    mode: to,
                    // a taxi halves the leg but costs money; a lift skips the climb
                    minutes: Math.max(4, Math.round(s.legFrom.minutes * 0.55)),
                    metres: to === "taxi" ? 0 : s.legFrom.metres,
                    costJpy: s.legFrom.costJpy + share,
                  },
                }
              : s,
          );
          break;
        }
      }
      return retime({ ...branch, stops }, branch.stops[0]?.arrive);
    });

    return { ...d, branches };
  });

  return { ...trip, days };
}

/* -------------------------------------------------------------- helpers */

export function branchDistanceKm(branch: Branch): number {
  const m = branch.stops.reduce(
    (a, s) => a + (s.legFrom?.mode === "walk" ? s.legFrom.metres : 0),
    0,
  );
  return m / 1000;
}

export function dayWalkKm(day: DayPlan): number {
  return Math.max(...ALL.map((t) => loadOfDay(day).walkMetres[t])) / 1000;
}

export function stopName(stop: Stop): string {
  return SPOT_BY_ID[stop.spotId]?.name ?? stop.spotId;
}

export function totalStops(trip: Trip): number {
  return trip.days.reduce(
    (a, d) => a + d.branches.reduce((b, br) => b + br.stops.length, 0),
    0,
  );
}
