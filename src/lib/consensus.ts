import { poi } from "../data";
import { distance } from "./geo";
import type { InterestId, Poi, Room, TravellerId, VoteValue } from "../types";
import { INTEREST_LABELS } from "../types";

/**
 * Turning four people's votes into one itinerary.
 *
 * Every number this produces is derived from the votes and preferences in the
 * room — nothing is stored, nothing is assumed. That matters more here than
 * anywhere else in the app: a consensus score is exactly the kind of figure
 * that gets screenshotted into a pitch deck, and the first question anybody
 * sensible asks is "how is that calculated". It has to have an answer.
 *
 * Storing the result would be worse than not having it. Votes change; a saved
 * score drifts out of sync with the list printed underneath it, and a consensus
 * number that contradicts its own evidence is more damaging than no number.
 */

export interface Tally {
  poiId: string;
  yes: number;
  maybe: number;
  no: number;
  /** Who voted which way, so avatars can be rendered without a second pass. */
  by: Record<VoteValue, TravellerId[]>;
}

export interface InterestBar {
  id: InterestId;
  label: string;
  count: number;
  total: number;
}

export interface Suggestion {
  /** The contested place the AI proposes dropping. */
  dropPoiId: string;
  /** What it proposes instead — always something the group already agrees on. */
  addPoiId: string;
  /** Stated in the traveller's terms, with the numbers that produced it. */
  reason: string;
  /** Travel time saved by the swap, in minutes. Derived from coordinates. */
  savedMin: number;
}

export interface Consensus {
  /** 0–1. The share of voted places nobody objects to. */
  score: number;
  filled: number;
  total: number;
  agreed: Tally[];
  contested: Tally[];
  interests: InterestBar[];
  suggestion: Suggestion | null;
}

const EMPTY_BY = (): Record<VoteValue, TravellerId[]> => ({ yes: [], maybe: [], no: [] });

export function tallies(room: Room): Tally[] {
  return room.poiIds.map((poiId) => {
    const by = EMPTY_BY();
    for (const v of room.votes) {
      if (v.poiId === poiId) by[v.value].push(v.who);
    }
    return {
      poiId,
      yes: by.yes.length,
      maybe: by.maybe.length,
      no: by.no.length,
      by,
    };
  });
}

/** Rough door-to-door minutes between two places, for the swap's saving. */
const travelMin = (a: Poi, b: Poi) => Math.round(distance(a, b) / 320);

export function consensus(room: Room): Consensus {
  const people = room.members.length;
  const all = tallies(room);
  /* A place nobody has voted on yet is not evidence of anything, so it is
     excluded from the score rather than counted as disagreement. */
  const voted = all.filter((t) => t.yes + t.maybe + t.no > 0);

  const agreed = voted.filter((t) => t.no === 0 && t.yes > people / 2);
  const contested = voted
    .filter((t) => t.no > 0 && t.yes > 0)
    .sort((a, b) => b.no - a.no);

  const score = voted.length ? agreed.length / voted.length : 0;

  const interests: InterestBar[] = (Object.keys(INTEREST_LABELS) as InterestId[])
    .map((id) => ({
      id,
      label: INTEREST_LABELS[id],
      count: room.members.filter((m) => m.preference?.interests.includes(id)).length,
      total: people,
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    score,
    filled: room.members.filter((m) => m.preference).length,
    total: people,
    agreed,
    contested,
    interests,
    suggestion: suggest(agreed, contested),
  };
}

/**
 * One swap, not a rewrite.
 *
 * The proposal is always "drop the most contested place, keep the one everybody
 * already agreed on that is closest to the rest of the day". Offering three
 * alternatives sounds more helpful and is not: a group that could pick between
 * three options would not have needed the feature.
 */
function suggest(agreed: Tally[], contested: Tally[]): Suggestion | null {
  const worst = contested[0];
  if (!worst || agreed.length === 0) return null;

  const drop = poi(worst.poiId);
  /* Centre of what the group has already settled on — the swap should pull the
     day tighter, not just replace one pin with another. */
  const core = agreed.map((t) => poi(t.poiId));
  const centre = {
    lat: core.reduce((a, p) => a + p.lat, 0) / core.length,
    lng: core.reduce((a, p) => a + p.lng, 0) / core.length,
  };

  const alt = [...core].sort((a, b) => distance(centre, a) - distance(centre, b))[0];
  if (!alt || alt.id === drop.id) return null;

  const savedMin = Math.max(0, travelMin(centre as Poi, drop) - travelMin(centre as Poi, alt));

  return {
    dropPoiId: drop.id,
    addPoiId: alt.id,
    savedMin,
    reason:
      `${drop.name}離今天主要路線比較遠，而且只有 ${worst.yes} 位旅伴想去、` +
      `${worst.no} 位不想去。改成${alt.name}的話 ${agreed.length} 個大家都同意的點會更順`,
  };
}

/** "87%" — the one place this number is formatted, so it cannot drift. */
export const pct = (n: number) => `${Math.round(n * 100)}%`;
