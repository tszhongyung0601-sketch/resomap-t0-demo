import { POI_TW_NORTH } from "./poi.tw-north";
import { POI_TW_SOUTH } from "./poi.tw-south";
import { POI_TW_EAST } from "./poi.tw-east";
import { POI_OVERSEAS } from "./poi.overseas";
import type { Poi } from "../types";

/**
 * One place to reach the demo dataset from.
 *
 * The POI list is split by region in source only — it is one flat collection at
 * runtime, and every lookup goes through here. Splitting it kept four authors
 * out of each other's way; merging it here keeps every screen from having to
 * know which file a place happens to live in.
 */
export const POIS: Poi[] = [
  ...POI_TW_NORTH,
  ...POI_TW_SOUTH,
  ...POI_TW_EAST,
  ...POI_OVERSEAS,
];

export const BY_POI: Record<string, Poi> = Object.fromEntries(
  POIS.map((p) => [p.id, p]),
);

/**
 * Throws in development if an id is wrong. A silent `undefined` here surfaces
 * three screens later as a blank card, which is a miserable thing to debug.
 */
export function poi(id: string): Poi {
  const p = BY_POI[id];
  if (!p && import.meta.env.DEV) throw new Error(`unknown poi: ${id}`);
  return p;
}

export const poisForDest = (destId: string) => POIS.filter((p) => p.destId === destId);

export const poisWithStory = () => POIS.filter((p) => p.storyId);

export * from "./affiliatePartners";
export * from "./affiliateProducts";
export * from "./destinations";
export * from "./services";
export * from "./stories";
export * from "./travellers";
export * from "./trips";
export * from "./deals";
