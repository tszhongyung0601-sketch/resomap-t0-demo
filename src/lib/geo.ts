/** Small geo helpers. Kept in-house — none of this justifies a dependency. */

export interface LatLng {
  lat: number;
  lng: number;
}

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distance(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export const km = (metres: number) =>
  metres < 950 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;

/** Rough walking time at 4.5 km/h, rounded up to the minute. */
export const walkMin = (metres: number) => Math.max(1, Math.ceil(metres / 75));

export interface Cluster<T> {
  items: T[];
  lat: number;
  lng: number;
}

/**
 * Grid clustering.
 *
 * At low zoom a hundred overlapping pins is noise; the only thing worth seeing
 * is roughly where things are dense. Above the split zoom every POI gets its
 * own pin, because by then they no longer collide.
 */
export function cluster<T extends LatLng>(
  items: T[],
  zoom: number,
  splitAt = 14,
): Cluster<T>[] {
  if (zoom >= splitAt) {
    return items.map((i) => ({ items: [i], lat: i.lat, lng: i.lng }));
  }
  const cell = zoom >= 12 ? 0.02 : zoom >= 10 ? 0.08 : zoom >= 8 ? 0.25 : 0.8;
  const buckets = new Map<string, T[]>();
  for (const i of items) {
    const k = `${Math.round(i.lat / cell)}:${Math.round(i.lng / cell)}`;
    const list = buckets.get(k);
    if (list) list.push(i);
    else buckets.set(k, [i]);
  }
  return [...buckets.values()].map((group) => ({
    items: group,
    lat: group.reduce((a, i) => a + i.lat, 0) / group.length,
    lng: group.reduce((a, i) => a + i.lng, 0) / group.length,
  }));
}

/** Bounding box with a little air around it, for fitBounds. */
export function bounds(points: LatLng[], pad = 0.004) {
  if (!points.length) return null;
  let n = -90;
  let s = 90;
  let e = -180;
  let w = 180;
  for (const p of points) {
    n = Math.max(n, p.lat);
    s = Math.min(s, p.lat);
    e = Math.max(e, p.lng);
    w = Math.min(w, p.lng);
  }
  return [
    [s - pad, w - pad],
    [n + pad, e + pad],
  ] as [[number, number], [number, number]];
}
