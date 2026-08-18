import { POIS } from "../data";
import type { Poi } from "../types";

/**
 * Turning a pasted Google Maps link into a place ResoMap already knows.
 *
 * Deliberately offline. There is no backend, and the browser cannot fetch
 * google.com — CORS forbids it — so nothing here resolves anything over the
 * network. Everything comes out of the URL string itself, which is enough for
 * the long links a desktop Google Maps produces and honestly not enough for the
 * short ones a phone produces. Saying which is which is most of this file's job:
 * a feature that fails silently on the most common input teaches the traveller
 * that the app ignores them.
 */

export type PlaceLink =
  /** A name was recovered — from a URL or typed straight in. */
  | { kind: "name"; name: string }
  /** maps.app.goo.gl/… — carries neither a name nor coordinates. */
  | { kind: "short" }
  /** A URL, but not one of Google Maps' shapes. */
  | { kind: "unknown" };

const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl", "maps.google.link"];

/** "%E8%B5%A4%E5%B4%81%E6%A8%93" and "Chihkan+Tower" both come back readable. */
function readable(segment: string): string {
  let out = segment.replace(/\+/g, " ");
  try {
    out = decodeURIComponent(out);
  } catch {
    /* A malformed escape is not worth throwing over — the raw text is still a
       better guess than nothing, and matchPoi simply will not find it. */
  }
  return out.trim();
}

export function parseGoogleMapsLink(input: string): PlaceLink {
  const text = input.trim();
  if (!text) return { kind: "unknown" };

  /* Not a URL at all: treat it as a place name. Somebody typing 赤崁樓 into a
     field labelled "paste a link" is not making a mistake, they are taking the
     shortcut, and refusing them would be pedantry. */
  if (!/^https?:\/\//i.test(text) && !/^(www\.|maps\.)/i.test(text)) {
    return { kind: "name", name: text };
  }

  let url: URL;
  try {
    url = new URL(text.startsWith("http") ? text : `https://${text}`);
  } catch {
    return { kind: "unknown" };
  }

  const host = url.hostname.replace(/^www\./, "");
  if (SHORT_HOSTS.includes(host)) return { kind: "short" };
  if (!/(^|\.)google\./.test(host)) return { kind: "unknown" };

  /* /maps/place/<name>/@lat,lng,17z — the desktop share URL. */
  const place = url.pathname.match(/\/maps\/place\/([^/@]+)/);
  if (place?.[1]) {
    const name = readable(place[1]);
    if (name) return { kind: "name", name };
  }

  /* /maps/search/?api=1&query=<name>, and ?q= on the older shapes. */
  const query = url.searchParams.get("query") ?? url.searchParams.get("q");
  if (query) {
    /* A bare coordinate pair is a pin, not a place — it names nothing we could
       match, so it is honestly "unknown" rather than a failed lookup. */
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(query.trim())) return { kind: "unknown" };
    const name = readable(query);
    if (name) return { kind: "name", name };
  }

  return { kind: "unknown" };
}

/**
 * The pasted name against the 80 places ResoMap holds.
 *
 * Two-way containment after the exact test, because Google and ResoMap rarely
 * agree on how much of a name to print: Google says 台南赤崁樓 or "Chihkan Tower
 * (Fort Provintia)", the data says 赤崁樓. Requiring either string to contain the
 * other catches both directions while still refusing 台北車站, which shares no
 * substring with anything in the set.
 */
export function matchPoi(name: string): Poi | undefined {
  const q = name.trim().toLowerCase();
  if (q.length < 2) return undefined;

  const exact = POIS.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact;

  /* Longest name first. 安平古堡 and 安平樹屋 both contain 安平; taking the longest
     match means the more specific name wins instead of whichever happens to sit
     earlier in the dataset. */
  return [...POIS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((p) => {
      const n = p.name.toLowerCase();
      return n.includes(q) || q.includes(n);
    });
}

/** Parse and match in one step, keeping the reason a lookup failed. */
export type PlaceLookup =
  | { kind: "found"; poi: Poi; name: string }
  | { kind: "not-in-data"; name: string }
  | { kind: "short" }
  | { kind: "unknown" };

export function lookupPlaceLink(input: string): PlaceLookup {
  const parsed = parseGoogleMapsLink(input);
  if (parsed.kind !== "name") return parsed;
  const hit = matchPoi(parsed.name);
  return hit
    ? { kind: "found", poi: hit, name: parsed.name }
    : { kind: "not-in-data", name: parsed.name };
}
