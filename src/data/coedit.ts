import type { Trip, TravellerId } from "../types";
import { BY_POI, poisForDest } from "./index";
import { BY_TRAVELLER, ME } from "./travellers";

/**
 * The script behind 一起編輯 — and the reason it is a script.
 *
 * ResoMap has no server. Nothing here is synced, received, or sent: this file
 * holds a handful of edits that a demo reveals on a timer so the idea of two
 * people working on the same itinerary can be shown rather than described. The
 * screen says so in plain language, once, above everything else it draws.
 *
 * Two rules this file exists to keep:
 *
 *   1. Never invent a person. Every `who` is a TravellerId from
 *      data/travellers.ts, and `coEditScript` drops any event whose author is
 *      not actually on the trip. A stranger appearing in the feed would be a
 *      claim about a shared account that does not exist.
 *   2. Never invent a place. Every `poiId` resolves through BY_POI, and a move
 *      or a removal is dropped unless the place really is on that day of that
 *      trip. The feed has to refer to something the reader can see underneath
 *      it, or it is just decoration that happens to be in Chinese.
 *
 * A note carries no text of its own: it prints the traveller's own constraint
 * from data/travellers.ts (Susan's 不想走太多路, Amy's 不喜歡樂園). Writing
 * fresh dialogue here would be putting words in the mouth of a character the
 * rest of the app describes precisely.
 */

export type CoEditKind = "add" | "move" | "remove" | "note";

export interface CoEditEvent {
  id: string;
  /** Always someone on the trip. Never a name invented for this screen. */
  who: TravellerId;
  kind: CoEditKind;
  /** The place the edit is about. Always a real POI id. */
  poiId: string;
  /** Where the place ends up. Absent on a note. */
  day?: number;
  /** Where a move started. Only on a move. */
  fromDay?: number;
}

/** One day, flattened to the places on it — the shape the screen animates. */
export interface DayPlan {
  n: number;
  date: string;
  poiIds: string[];
}

/* The pacing of the reveal. Slow enough to read one line before the next
   arrives, quick enough that a demo does not stall on an empty list. */
export const REVEAL_FIRST_MS = 2200;
export const REVEAL_GAP_MS = 3600;

/* ---------------------------------------------------------------- scripts */

/**
 * 台南 — Day 2 is seven stops long and the group is quietly fixing that.
 *
 * Susan's line lands before the removal on purpose: the edit that follows it
 * then reads as somebody responding to her rather than as an app rearranging
 * things on its own.
 */
const TAINAN: CoEditEvent[] = [
  { id: "tn-1", who: "amy", kind: "move", poiId: "anping-tree", fromDay: 2, day: 3 },
  { id: "tn-2", who: "susan", kind: "note", poiId: "fuzhong" },
  { id: "tn-3", who: "john", kind: "remove", poiId: "fuzhong", day: 2 },
  { id: "tn-4", who: "john", kind: "add", poiId: "tainan-art", day: 3 },
];

/**
 * 東京 — Day 4 has four stops and Day 5 has two, so teamLab moves.
 *
 * Amy's 不喜歡樂園 sits on the Disney day, which is the disagreement the 一起規劃
 * room is already built around. Same person, same objection, said once.
 */
const TOKYO: CoEditEvent[] = [
  { id: "tk-1", who: "john", kind: "remove", poiId: "tnm", day: 5 },
  { id: "tk-2", who: "amy", kind: "note", poiId: "disney" },
  { id: "tk-3", who: "susan", kind: "move", poiId: "teamlab", fromDay: 4, day: 5 },
];

/* 一起規劃 hands you trip-tainan-room, which is TAINAN_TRIP's itinerary under a
   different name and date — so it takes the same script. */
const SCRIPTS: Record<string, CoEditEvent[]> = {
  "trip-tainan": TAINAN,
  "trip-tainan-room": TAINAN,
  "trip-tokyo": TOKYO,
};

/* -------------------------------------------------------------- the plan */

/** The trip's days as flat place lists. Tracks are concatenated in order. */
export function dayPlan(trip: Trip): DayPlan[] {
  return trip.days.map((d) => ({
    n: d.n,
    date: d.date,
    poiIds: d.tracks.flatMap((t) => t.stops.map((s) => s.poiId)),
  }));
}

/**
 * Apply one revealed event to the plan.
 *
 * Immutable, and total: an event that cannot apply returns the plan unchanged
 * rather than throwing. The feed is a simulation, and a mistimed line is a much
 * cheaper failure than a blank screen.
 */
export function applyCoEdit(plan: DayPlan[], e: CoEditEvent): DayPlan[] {
  const drop = (d: DayPlan, poiId: string): DayPlan => {
    const i = d.poiIds.indexOf(poiId);
    if (i < 0) return d;
    return { ...d, poiIds: [...d.poiIds.slice(0, i), ...d.poiIds.slice(i + 1)] };
  };

  switch (e.kind) {
    case "note":
      return plan;
    case "add":
      return plan.map((d) =>
        d.n === e.day && !d.poiIds.includes(e.poiId)
          ? { ...d, poiIds: [...d.poiIds, e.poiId] }
          : d,
      );
    case "remove":
      return plan.map((d) => (d.n === e.day ? drop(d, e.poiId) : d));
    case "move":
      return plan.map((d) => {
        if (d.n === e.fromDay) return drop(d, e.poiId);
        if (d.n === e.day && !d.poiIds.includes(e.poiId)) {
          return { ...d, poiIds: [...d.poiIds, e.poiId] };
        }
        return d;
      });
  }
}

/* --------------------------------------------------------------- building */

/** True when this event describes something that is really there to edit. */
function playable(e: CoEditEvent, trip: Trip, plan: DayPlan[]): boolean {
  if (!BY_POI[e.poiId]) return false;
  if (!trip.travellers.includes(e.who)) return false;
  if (e.who === ME.id) return false;

  const on = (n: number | undefined) =>
    plan.find((d) => d.n === n)?.poiIds.includes(e.poiId) ?? false;

  /* The day the edit claims to put the place on has to be a day this trip
     actually has. `applyCoEdit` maps over the plan, so an event naming Day 6 of
     a three-day trip silently applies to nothing — and a `move` is worse than
     nothing: it drops the place off its old day and has nowhere to put it, so
     the feed announces a move while the place vanishes from the list. */
  const hasDay = (n: number | undefined) => plan.some((d) => d.n === n);

  switch (e.kind) {
    /* A note has to point at a place the reader can see on the trip. */
    case "note":
      return Boolean(BY_TRAVELLER[e.who].note) && plan.some((d) => on(d.n));
    /* Adding something the trip already has would produce a line that changes
       nothing on screen — the one thing this feed must never do. */
    case "add":
      return hasDay(e.day) && !plan.some((d) => on(d.n));
    case "remove":
      return on(e.day);
    /* `!on(e.day)` for the same reason: several POIs sit on two days of the same
       trip (國華街 on 台南 Day 1 and Day 2, 阿美橫丁 on 東京 Day 4 and Day 5), and
       moving one onto a day that already has it drops it from the old day while
       the target is left alone — a line saying 移到 Day N above a list where the
       place only ever disappeared. */
    case "move":
      return e.day !== e.fromDay && on(e.fromDay) && hasDay(e.day) && !on(e.day);
  }
}

/**
 * A script for a trip nobody wrote one for — a trip created during the demo.
 *
 * Two edits, both derived from the trip in front of the reader: rebalance the
 * longest day onto the shortest, and add one place from the same city the trip
 * has not used. Nothing invented.
 *
 * No note event here, deliberately. A note prints a traveller's own constraint
 * against a place, and the pairing only means anything when a person chose it —
 * Amy's 不喜歡樂園 on the Disney day says something, and the same line stapled to
 * whichever stop happens to be first in an arbitrary trip says nothing while
 * looking like it does. Two edits that land beat three where one is noise.
 */
function derive(trip: Trip, plan: DayPlan[]): CoEditEvent[] {
  const others = trip.travellers.filter((id) => id !== ME.id);
  if (others.length === 0 || plan.length === 0) return [];

  let turn = 0;
  const next = (): TravellerId => others[turn++ % others.length];

  const byLength = [...plan].sort((a, b) => b.poiIds.length - a.poiIds.length);
  const busiest = byLength[0];
  const lightest = byLength[byLength.length - 1];

  const out: CoEditEvent[] = [];

  if (busiest.n !== lightest.n && busiest.poiIds.length > 1) {
    out.push({
      id: "auto-move",
      who: next(),
      kind: "move",
      poiId: busiest.poiIds[busiest.poiIds.length - 1],
      fromDay: busiest.n,
      day: lightest.n,
    });
  }

  const used = new Set(plan.flatMap((d) => d.poiIds));
  const fresh = poisForDest(trip.destId).find((p) => !used.has(p.id));
  if (fresh) {
    out.push({ id: "auto-add", who: next(), kind: "add", poiId: fresh.id, day: lightest.n });
  }

  return out;
}

/**
 * The events this trip's simulation will play, in order.
 *
 * Validated against the live trip rather than trusted: the fixtures move, and a
 * script that outlives its data would announce that somebody moved a stop which
 * is not on the itinerary printed directly underneath.
 */
export function coEditScript(trip: Trip): CoEditEvent[] {
  const plan = dayPlan(trip);
  const raw = SCRIPTS[trip.id] ?? derive(trip, plan);

  /* Checked against the plan as it stands when each event fires, not against
     the original — otherwise 拿掉府中街 validates against a day that the move
     before it already changed. */
  const out: CoEditEvent[] = [];
  let running = plan;
  for (const e of raw) {
    if (!playable(e, trip, running)) continue;
    out.push(e);
    running = applyCoEdit(running, e);
  }
  return out;
}

/** Who the simulation can show as editing — everyone on the trip but you. */
export const coEditors = (trip: Trip): TravellerId[] =>
  trip.travellers.filter((id) => id !== ME.id);
