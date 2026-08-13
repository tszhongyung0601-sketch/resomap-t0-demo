import { track } from "./track";
import type { LegMode, Poi } from "../types";

/**
 * ResoMap answers "where should I go". Google Maps answers "how do I get there".
 *
 * Building turn-by-turn navigation is a product in itself, and a worse one than
 * the app already on everybody's phone. So the itinerary owns the plan and hands
 * off the moment the traveller actually needs to move — one tap, no sheet asking
 * which mode they meant, because the itinerary already said.
 */

/** ResoMap's leg modes to the three Google Maps supports in this version. */
const TRAVEL_MODE: Record<LegMode, "walking" | "transit" | "driving"> = {
  walk: "walking",
  train: "transit",
  bus: "transit",
  taxi: "driving",
  drive: "driving",
};

/**
 * A place name alone is ambiguous — there is a 中正路 in every city in Taiwan.
 * Sending the name plus its coordinates lets Maps label the pin the way the
 * traveller expects while still landing on the exact spot.
 */
const point = (p: Poi) => `${p.name}, ${p.area}`;

export function directionsUrl(from: Poi | null, to: Poi, mode: LegMode = "walk") {
  const params = new URLSearchParams({
    api: "1",
    destination: point(to),
    destination_place_id: "",
    travelmode: TRAVEL_MODE[mode],
  });
  params.delete("destination_place_id");
  if (from) params.set("origin", point(from));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Opens in a new tab, and `noopener` is not optional: without it the opened
 * page gets a handle on this one through `window.opener` and can navigate it
 * somewhere else. It also keeps the SPA's own history untouched.
 */
export function openDirections(from: Poi | null, to: Poi, mode: LegMode = "walk") {
  track("directions_open", { poiId: to.id });
  window.open(directionsUrl(from, to, mode), "_blank", "noopener,noreferrer");
}
