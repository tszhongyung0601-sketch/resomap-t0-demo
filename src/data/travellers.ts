import type { Traveller, TravellerId } from "../types";

/**
 * Travel companions are optional.
 *
 * A solo trip must work end to end without ever meeting this list — group
 * coordination is a feature you turn on when you have people to coordinate,
 * not a gate you walk through to create an itinerary.
 */
export const TRAVELLERS: Traveller[] = [
  {
    id: "mickey",
    name: "Mickey",
    initial: "M",
    color: "#FF6210",
    likes: ["food", "photo", "shopping"],
  },
  {
    id: "amy",
    name: "Amy",
    initial: "A",
    color: "#2F6FED",
    likes: ["culture", "food"],
    note: "不喜歡樂園",
  },
  {
    id: "john",
    name: "John",
    initial: "J",
    color: "#0E9F6E",
    likes: ["themepark", "nightlife"],
  },
  {
    id: "susan",
    name: "Susan",
    initial: "S",
    color: "#9061F9",
    likes: ["nature", "photo"],
    note: "不想走太多路",
  },
];

export const BY_TRAVELLER: Record<TravellerId, Traveller> = Object.fromEntries(
  TRAVELLERS.map((t) => [t.id, t]),
) as Record<TravellerId, Traveller>;

/** The person using the app. Shown on the profile tab. */
export const ME = BY_TRAVELLER.mickey;
