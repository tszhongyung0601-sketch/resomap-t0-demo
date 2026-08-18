import { STORIES, poi } from "../data";
import type { Story } from "../types";

/**
 * Everything the guide cards need that is not already a field on Story.
 *
 * The one rule this file exists to enforce: nothing here is stored. The home
 * rail and 導覽庫 both read these, so a story cannot show 4.7 in one place and
 * 4.4 in the other — there is no second copy to drift.
 */

/* The demo's like-ratio band. Fixed constants rather than the min and max of
   the current set, because deriving the anchors from the data would make one
   story's rating move when an unrelated story is added — a number that changes
   for no reason the reader can see is worse than a stored one. */
const FLOOR = 0.065;
const CEIL = 0.09;

/**
 * A rating, derived from the likes and plays already on the story.
 *
 * ResoMap has no reviewers, so this is not a measurement — but it is also not a
 * sixteenth invented number. It is a reading of two figures the card prints
 * right next to it, which means a reader who doubts the 4.7 can divide the two
 * numbers underneath it and get the same answer. Both inputs are demo data and
 * the rail says so once, at section level.
 */
export function rating(s: Story): number {
  if (s.plays <= 0) return 0;
  const ratio = s.likes / s.plays;
  const scaled = 4 + ((ratio - FLOOR) / (CEIL - FLOOR));
  return Math.round(Math.min(5, Math.max(4, scaled)) * 10) / 10;
}

/** 12,734 → 1.3 萬. A five-digit play count in a 12px card is unreadable. */
export function playCount(n: number): string {
  if (n < 10000) return n.toLocaleString();
  return `${(Math.round(n / 1000) / 10).toFixed(1)} 萬`;
}

/**
 * The whole phrase, because the unit changes and the spacing changes with it.
 * 「6,473 次播放」takes a space after a Latin numeral; 「1.4 萬次播放」does not —
 * 萬 and 次 are both CJK and a gap between them reads as a typo. Callers used to
 * append " 次播放" themselves and got 「1.4 萬 次播放」 on every card over 10k.
 */
export const playLabel = (n: number) =>
  n < 10000 ? `${n.toLocaleString()} 次播放` : `${playCount(n)}次播放`;

/** Which POIs have a guide. The map tints its pins on this and nothing else. */
export const STORY_POIS: ReadonlySet<string> = new Set(STORIES.map((s) => s.poiId));

export const hasStory = (poiId: string) => STORY_POIS.has(poiId);

/** The destination a story belongs to, read through its POI. */
export const destOfStory = (s: Story) => poi(s.poiId).destId;

/**
 * The home rail: this trip's city first, then everywhere else.
 *
 * Lifted out of Explore because 導覽庫 needs the same ordering — a story that is
 * third on the home screen and eleventh in the library is two different answers
 * to "what should I listen to".
 */
export function storyRail(destId?: string): Story[] {
  if (!destId) return STORIES;
  const here = STORIES.filter((s) => destOfStory(s) === destId);
  const seen = new Set(here.map((s) => s.id));
  return [...here, ...STORIES.filter((s) => !seen.has(s.id))];
}
