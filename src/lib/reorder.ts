import { poi } from "../data";
import { distance } from "./geo";
import type { Day, Leg, LegMode, Stop, Track } from "../types";

/**
 * Editing one day by hand: move a stop, drop a stop, change a time.
 *
 * Pure functions over `Day`. Nothing here knows about React, and nothing here
 * decides what the traveller meant — the screen decides that. This file only
 * answers "given that happened, what does the day look like now".
 *
 * Two rules run through all of it, and both are borrowed rather than invented.
 *
 * 1. The clock shifts; it is never rebuilt.
 *
 *    lib/adapt.ts's header makes the argument in full: a dinner at 18:30 is at
 *    18:30 because somebody booked a table, and an assistant that recomputes
 *    the day as a running sum of walking times quietly moves it. So a stop the
 *    traveller did not touch keeps its own time, and is pushed later only when
 *    the stop in front of it has made that time physically impossible — by
 *    exactly the number of minutes needed, never more. Nothing is ever pulled
 *    earlier: deleting a stop frees time, it does not drag the afternoon
 *    forward on top of a reservation. That is adapt.ts's `Math.max(original,
 *    original + delay - freed)` rule, restated for an edit the traveller made
 *    themselves.
 *
 * 2. Only the legs that actually changed are re-measured.
 *
 *    Moving one stop changes at most three pairs of neighbours; deleting one
 *    changes exactly one. Every other leg in the day was authored by a person
 *    and sits closer to the street than a straight line does — 神農街 → 赤崁樓
 *    is 620 m in the fixture and 778 m as the crow flies. Re-measuring the
 *    whole day after a delete at the bottom of it would rewrite every distance
 *    above the edit with nothing on screen to explain why, which is the same
 *    failure lib/adapt.ts avoids by re-measuring only the legs either side of a
 *    swapped stop.
 *
 * A leg that IS re-measured is measured the way AddPoi measures a newly added
 * stop: `distance()` from lib/geo.ts, on foot at 75 m/min with a five-minute
 * floor. A stop dragged into a slot and a stop added into the same slot
 * therefore report the same distance between the same two places, which is the
 * whole point — two ways of doing one thing must not disagree about the map.
 */

/* Door-to-door metres per minute, not vehicle top speed. Copied from
   lib/adapt.ts, which keeps its table private; if one changes the other has
   to, or the same leg gets two different durations depending on which file
   last touched it. */
const SPEED: Record<LegMode, number> = {
  walk: 75,
  train: 420,
  bus: 330,
  taxi: 620,
  drive: 700,
};

/** Below this nobody boards anything — adapt.ts uses the same threshold. */
const WALKABLE = 1200;

/**
 * Above this, a leg that has no motorised mode of its own becomes a taxi.
 *
 * 2.5 km is a thirty-five minute walk, which is a plan somebody chose or an
 * artefact of a drag — and after a drag it is the artefact. A taxi is the only
 * upgrade available here that invents nothing: it exists between any two
 * points. Turning the leg into 捷運 would be claiming a line runs between two
 * arbitrary places, which is a fabrication of exactly the kind this app is not
 * allowed to make.
 */
const TOO_FAR_TO_WALK = 2500;

/** Minutes since midnight. */
export const toMinutes = (at: string): number => {
  const [h, m] = at.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Back to "HH:MM", clamped to the day rather than wrapped.
 *
 * adapt.ts wraps with `% 24`, which is right for a shift of a few minutes and
 * wrong here: a stop pushed past midnight would render as 00:20 above an 18:30
 * dinner and read as a bug rather than as a day that no longer fits.
 */
export const toClock = (v: number): string => {
  const c = Math.max(0, Math.min(23 * 60 + 59, Math.round(v)));
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
};

/**
 * How a re-measured leg is travelled.
 *
 * The mode the traveller already had wins, because it is the only evidence of
 * what is actually available between two places. It is overridden in one
 * direction each way: never a bus for 400 m, never a walk for 4 km.
 */
function pickMode(prior: LegMode | undefined, metres: number): LegMode {
  if (metres < WALKABLE) return "walk";
  if (prior && prior !== "walk") return prior;
  return metres > TOO_FAR_TO_WALK ? "taxi" : "walk";
}

/**
 * The five-minute floor on foot is AddPoi's, and it is a door-to-door floor:
 * nothing in a city is two minutes away once you have found the exit and
 * crossed the road. Motorised legs keep adapt.ts's floor of one.
 */
function legBetween(from: Stop, to: Stop, prior: LegMode | undefined): Leg {
  const metres = distance(poi(from.poiId), poi(to.poiId));
  const mode = pickMode(prior, metres);
  const floor = mode === "walk" ? 5 : 1;
  return { mode, metres, min: Math.max(floor, Math.round(metres / SPEED[mode])) };
}

/**
 * Re-measure the legs whose two ends changed, and leave the rest alone.
 *
 * "Changed" is decided on stop ids, not places: the leg belongs to one specific
 * pair of neighbours, and if that pair is still adjacent in the same direction
 * then nothing about it has moved and its authored figures still stand.
 */
function relegs(before: Stop[], after: Stop[]): Stop[] {
  const adjacent = new Set<string>();
  for (let i = 1; i < before.length; i++) {
    adjacent.add(`${before[i - 1].id}>${before[i].id}`);
  }

  return after.map((s, i) => {
    /* Whoever is first has nothing to arrive from. Leaving a stale `from` here
       prints a walking time above the first line of the day. */
    if (i === 0) return s.from ? { ...s, from: undefined } : s;
    const prev = after[i - 1];
    if (s.from && adjacent.has(`${prev.id}>${s.id}`)) return s;
    return { ...s, from: legBetween(prev, s, s.from?.mode) };
  });
}

/**
 * Put the clock back together.
 *
 * `wishes` carries only what the traveller's edit implies. A stop that is not
 * in it wants the time it already has. A stop mapped to `null` is the one that
 * just moved, and wants the earliest slot its new neighbours allow — it is the
 * one stop whose old time means nothing, because it is no longer where that
 * time was decided for.
 */
function retime(stops: Stop[], wishes: Map<string, number | null>): Stop[] {
  const out: Stop[] = [];
  /** Earliest the next stop could possibly be reached. */
  let floor = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const own = toMinutes(s.at);
    const asked = wishes.has(s.id) ? wishes.get(s.id) : own;
    /* `null` at the head of the day has nothing to be earliest after, so it
       falls back to the time it brought with it. */
    const at = asked == null ? (i === 0 ? own : floor) : Math.max(asked, floor);

    out.push(at === own ? s : { ...s, at: toClock(at) });
    floor = at + s.stayMin + (stops[i + 1]?.from?.min ?? 0);
  }

  return out;
}

const rebuild = (track: Track, after: Stop[], wishes: Map<string, number | null>): Track => ({
  ...track,
  stops: retime(relegs(track.stops, after), wishes),
});

const patch = (day: Day, index: number, track: Track): Day => ({
  ...day,
  tracks: day.tracks.map((t, i) => (i === index ? track : t)),
});

/** Where a flat, day-wide stop index falls. */
function locate(day: Day, flat: number): { track: number; index: number; offset: number } | null {
  let offset = 0;
  for (let t = 0; t < day.tracks.length; t++) {
    const n = day.tracks[t].stops.length;
    if (flat >= offset && flat < offset + n) return { track: t, index: flat - offset, offset };
    offset += n;
  }
  return null;
}

const trackOf = (day: Day, stopId: string) =>
  day.tracks.findIndex((t) => t.stops.some((s) => s.id === stopId));

/**
 * Where a track's stops begin in the day-wide index `moveStop` speaks.
 *
 * A screen renders one list per track and thinks in positions inside that
 * list; this turns those back into the day's own numbering.
 */
export function trackOffset(day: Day, trackId: string): number {
  let offset = 0;
  for (const t of day.tracks) {
    if (t.id === trackId) return offset;
    offset += t.stops.length;
  }
  return 0;
}

/**
 * The earliest this stop could be reached, given the one before it. `null` for
 * the first stop of a track, which is bounded by nothing.
 */
export function earliestArrival(day: Day, stopId: string): string | null {
  for (const t of day.tracks) {
    const i = t.stops.findIndex((s) => s.id === stopId);
    if (i < 0) continue;
    if (i === 0) return null;
    const prev = t.stops[i - 1];
    return toClock(toMinutes(prev.at) + prev.stayMin + (t.stops[i].from?.min ?? 0));
  }
  return null;
}

/**
 * Move a stop.
 *
 * `from` and `to` are flat indices across the day's tracks, and `to` is the
 * index the stop should end up at — the same convention as
 * `splice(to, 0, moved)` after the removal, so "drop it into the third slot"
 * is `to === 2` whichever direction it came from.
 *
 * A move that would cross into another track is refused rather than
 * approximated. On a split day the tracks are two groups of people, not two
 * halves of one list; dragging 築地 out of Amy and Susan's morning and into
 * Mickey and John's is a decision about who goes where, and this function has
 * no business making it silently.
 */
export function moveStop(day: Day, from: number, to: number): Day {
  const at = locate(day, from);
  if (!at) return day;

  const track = day.tracks[at.track];
  const localTo = to - at.offset;
  if (localTo < 0 || localTo >= track.stops.length || localTo === at.index) return day;

  const next = [...track.stops];
  const [moved] = next.splice(at.index, 1);
  next.splice(localTo, 0, moved);

  /* Dropped at the head of the day, it inherits the hour the day already
     started at — the traveller reordered their morning, they did not ask to
     start it two hours later because the stop they dragged up was an
     afternoon one. Anywhere else it takes the earliest slot its new
     neighbours allow. */
  const wishes = new Map<string, number | null>([
    [moved.id, localTo === 0 ? toMinutes(track.stops[0].at) : null],
  ]);

  return patch(day, at.track, rebuild(track, next, wishes));
}

/**
 * Drop a stop.
 *
 * Everything that survives keeps its time. The minutes the dropped stop was
 * using are handed back to the traveller as slack, not spent by pulling the
 * rest of the day forward — see rule 1 in the header, and adapt.ts, which only
 * ever spends freed minutes against a delay that already happened.
 */
export function removeStop(day: Day, stopId: string): Day {
  const t = trackOf(day, stopId);
  if (t < 0) return day;

  const track = day.tracks[t];
  const next = track.stops.filter((s) => s.id !== stopId);
  return patch(day, t, rebuild(track, next, new Map()));
}

/**
 * Set one stop's time.
 *
 * The order has not changed, so no leg has changed and none is re-measured —
 * a clock edit that quietly rewrites the distances underneath it would be
 * inexplicable on screen. Later stops are pushed only where the new time makes
 * them impossible; earlier ones are never touched, because the traveller said
 * nothing about them.
 *
 * The time asked for is honoured unless it is earlier than the stop can
 * physically be reached, in which case it lands on the earliest arrival —
 * `earliestArrival()` exists so the control can show that boundary instead of
 * letting the traveller discover it by having their answer changed.
 */
export function setTime(day: Day, stopId: string, at: string): Day {
  const t = trackOf(day, stopId);
  if (t < 0) return day;

  const track = day.tracks[t];
  const wishes = new Map<string, number | null>([[stopId, toMinutes(at)]]);
  return patch(day, t, rebuild(track, [...track.stops], wishes));
}

/* ------------------------------------------------------------ keeping it */

/**
 * A day's hand edits, held as intent rather than as a result.
 *
 * The trip itself lives in App state, which this screen cannot write to, so
 * the edits are kept beside it and replayed over whatever the trip currently
 * says. Storing the finished day instead would be simpler and wrong: a place
 * added from ＋ 加入景點 lands in the trip, and a stored day would hide it
 * behind an older copy of the same afternoon.
 *
 * `base` is what the day said about each stop when the edit was made, and it
 * is the safety catch — see `applyEdits`.
 */
export interface DayEdits {
  /** Track id -> stop ids, in the order the traveller left them. */
  order: Record<string, string[]>;
  /** Stop ids the traveller deleted. */
  gone: string[];
  /** Stop id -> the time it should keep. */
  at: Record<string, string>;
  /** Stop id -> the day's own description of it, at the time of the edit. */
  base: Record<string, string>;
}

const signature = (s: Stop) => `${s.poiId}|${s.at}|${s.stayMin}`;

/**
 * What changed between the day as the trip states it and the day as the
 * traveller left it. Only differences are recorded, so a track nobody touched
 * comes back out of `applyEdits` as the very object that went in.
 */
export function diffDay(base: Day, edited: Day): DayEdits {
  const order: Record<string, string[]> = {};
  const at: Record<string, string> = {};
  const alive = new Set<string>();

  for (const track of edited.tracks) {
    const before = base.tracks.find((b) => b.id === track.id);
    const ids = track.stops.map((s) => s.id);
    const wasIds = before?.stops.map((s) => s.id) ?? [];
    if (ids.length !== wasIds.length || ids.some((id, i) => id !== wasIds[i])) {
      order[track.id] = ids;
    }
    for (const s of track.stops) {
      alive.add(s.id);
      const was = before?.stops.find((x) => x.id === s.id);
      if (!was || was.at !== s.at) at[s.id] = s.at;
    }
  }

  const gone: string[] = [];
  const snapshot: Record<string, string> = {};
  for (const track of base.tracks) {
    for (const s of track.stops) {
      snapshot[s.id] = signature(s);
      if (!alive.has(s.id)) gone.push(s.id);
    }
  }

  return { order, gone, at, base: snapshot };
}

/**
 * Replay an edit over the day as it stands now.
 *
 * `null` means the edit can no longer be trusted: a stop it knew about has
 * disappeared or been rewritten, which is what happens when an AI adjustment
 * is applied or a scenario is reloaded underneath it. Replaying a hand edit
 * over that would put times on screen that quietly contradict the card which
 * had just announced the change — the one screen in this app that has to be
 * checkable against the map. So the edit is discarded and the day speaks for
 * itself.
 *
 * A stop the day has GAINED is fine, and is kept: that is somebody adding a
 * place from ＋ 加入景點, and it joins the end of its track exactly where
 * `nav.addPoi` put it.
 */
export function applyEdits(day: Day, edits: DayEdits): Day | null {
  const now = new Map<string, Stop>();
  for (const track of day.tracks) {
    for (const s of track.stops) now.set(s.id, s);
  }

  for (const id of Object.keys(edits.base)) {
    const s = now.get(id);
    if (!s || signature(s) !== edits.base[id]) return null;
  }

  const gone = new Set(edits.gone);

  return {
    ...day,
    tracks: day.tracks.map((track) => {
      const ids = edits.order[track.id] ?? track.stops.map((s) => s.id);
      const taken = new Set<string>();
      const next: Stop[] = [];

      for (const id of ids) {
        const s = track.stops.find((x) => x.id === id);
        if (!s || gone.has(id) || taken.has(id)) continue;
        taken.add(id);
        next.push(s);
      }
      for (const s of track.stops) {
        if (taken.has(s.id) || gone.has(s.id)) continue;
        next.push(s);
      }

      const wishes = new Map<string, number | null>();
      for (const s of next) {
        const asked = edits.at[s.id];
        if (asked) wishes.set(s.id, toMinutes(asked));
      }

      /* A track nobody edited is handed back untouched, not rebuilt into an
         identical copy. Re-timing it would be harmless only for as long as
         every authored day stays physically possible, and that is not a
         property this file gets to assume about data it did not write. */
      const same =
        wishes.size === 0 &&
        next.length === track.stops.length &&
        next.every((s, i) => s === track.stops[i]);

      return same ? track : rebuild(track, next, wishes);
    }),
  };
}
