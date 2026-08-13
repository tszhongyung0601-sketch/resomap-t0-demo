import type { Trip } from "../types";

/**
 * Which trip the app is currently about.
 *
 * One rule, in one place, because several screens depend on the answer and they
 * have to agree: the home screen's card, the map's centre, and the deals tab's
 * recommendations. When App and Explore each had their own version, the map
 * could open on a different city than the card the traveller had just tapped.
 */
export function focusTrip(trips: Trip[]): Trip | undefined {
  const ongoing = trips.find((t) => t.phase === "ongoing");
  if (ongoing) return ongoing;
  /* `daysUntil` is optional, so a trip without one sorts to the back rather
     than to the front — an unknown departure is not an imminent one. */
  return [...trips].sort((a, b) => (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999))[0];
}
