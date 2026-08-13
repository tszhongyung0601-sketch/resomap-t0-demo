import type { Preference, Traveller, TravellerId } from "../types";

/**
 * The four travellers and their conflicting constraints come straight out of
 * the market-problem study's worked example (A must do Disney / B refuses
 * theme parks / C is capped on lodging / D wants central and will not get up
 * early). Keeping them intact means the demo answers the exact scenario the
 * strategy document says nobody solves.
 */
export const TRAVELLERS: Traveller[] = [
  {
    id: "che",
    name: "阿哲",
    initial: "哲",
    color: "#2C6BD4",
    colorSoft: "#E4EDFB",
    blurb: "這趟就是為了迪士尼來的",
  },
  {
    id: "yu",
    name: "小雨",
    initial: "雨",
    color: "#C0392B",
    colorSoft: "#FBE6E3",
    blurb: "想看老東西、吃在地的",
  },
  {
    id: "kai",
    name: "阿凱",
    initial: "凱",
    color: "#1F8A5B",
    colorSoft: "#E2F1EA",
    blurb: "怎麼省怎麼來",
  },
  {
    id: "ting",
    name: "婷婷",
    initial: "婷",
    color: "#8E44AD",
    colorSoft: "#F0E6F6",
    blurb: "不早起，也走不動",
  },
];

export const TRAVELLER_BY_ID: Record<TravellerId, Traveller> = Object.fromEntries(
  TRAVELLERS.map((t) => [t.id, t]),
) as Record<TravellerId, Traveller>;

export const DEFAULT_PREFERENCES: Record<TravellerId, Preference> = {
  che: {
    travellerId: "che",
    lodgingCap: 14000,
    dailyCap: 18000,
    mustGo: ["disney"],
    wontGo: [],
    interests: ["themepark", "shopping"],
    walkCap: "free",
    earliestStart: "07:00",
    transport: "fast",
    submitted: true,
  },
  yu: {
    travellerId: "yu",
    lodgingCap: 9000,
    dailyCap: 12000,
    mustGo: ["sensoji", "daibutsu"],
    wontGo: ["disney"],
    interests: ["history", "food", "photo"],
    walkCap: "mid",
    earliestStart: "08:00",
    transport: "cheap",
    submitted: true,
  },
  kai: {
    travellerId: "kai",
    lodgingCap: 6500, // ≈ NT$2,000 — the hard cap from the study
    dailyCap: 16000,
    mustGo: [],
    wontGo: [],
    interests: ["budget", "food"],
    walkCap: "free",
    earliestStart: "08:00",
    transport: "cheap",
    submitted: true,
  },
  ting: {
    travellerId: "ting",
    lodgingCap: 11000,
    dailyCap: 13000,
    mustGo: [],
    wontGo: [],
    interests: ["shopping", "cafe"],
    walkCap: "low",
    earliestStart: "10:00",
    transport: "less-walk",
    submitted: true,
  },
};

/** A blank slate so the presenter can fill the cards live if they want to. */
export function emptyPreferences(): Record<TravellerId, Preference> {
  return {
    che: { ...DEFAULT_PREFERENCES.che, submitted: false },
    yu: { ...DEFAULT_PREFERENCES.yu, submitted: false },
    kai: { ...DEFAULT_PREFERENCES.kai, submitted: false },
    ting: { ...DEFAULT_PREFERENCES.ting, submitted: false },
  };
}
