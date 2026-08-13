import type { DealCategory, EventName, PartnerId, TrackedEvent } from "../types";

/**
 * Mock affiliate tracking.
 *
 * There is no affiliate API here and no commission engine. This records the
 * same five events a real integration would emit — impression, click, outbound,
 * booking, commission — into localStorage, so the business demo can show the
 * shape of the funnel without anybody mistaking it for revenue.
 *
 * Every surface that reads this data is required to label it Demo Data.
 */

const KEY = "resomap_events";
const CAP = 2000;

/** Indicative commission rates. Public affiliate ranges, not negotiated terms. */
const RATE: Record<DealCategory, number> = {
  ticket: 0.05,
  stay: 0.04,
  transport: 0.04,
  esim: 0.08,
  insurance: 0.1,
  local: 0.06,
};

function read(): TrackedEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrackedEvent[]) : [];
  } catch {
    return [];
  }
}

function write(list: TrackedEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP)));
  } catch {
    /* private mode, quota — tracking is never worth breaking a screen over */
  }
}

export function track(
  name: EventName,
  meta: Omit<TrackedEvent, "name" | "at"> = {},
) {
  const list = read();
  list.push({ name, at: Date.now(), ...meta });
  write(list);
}

export const events = read;

export function clearEvents() {
  write([]);
}

/**
 * Fire an impression once per deal per session. Without this an OTA card that
 * re-renders on every keystroke would inflate the funnel's top by an order of
 * magnitude, and a funnel whose top is wrong tells you nothing.
 */
const seen = new Set<string>();
export function impression(dealId: string, partner: PartnerId, category: DealCategory) {
  if (seen.has(dealId)) return;
  seen.add(dealId);
  track("affiliate_impression", { dealId, partner, category });
}

export interface Funnel {
  impressions: number;
  clicks: number;
  outbound: number;
  bookings: number;
  /** Simulated gross booking value, TWD. */
  gmvTwd: number;
  /** Simulated commission at the indicative rates above, TWD. */
  commissionTwd: number;
  byPartner: { partner: PartnerId; clicks: number; commissionTwd: number }[];
  byCategory: { category: DealCategory; clicks: number; commissionTwd: number }[];
  byDest: { destId: string; clicks: number }[];
}

/** Click-through from impression to click, as a fraction. 0 when nothing shown. */
export const ctr = (f: Funnel) => (f.impressions ? f.clicks / f.impressions : 0);

export function funnel(): Funnel {
  const list = read();
  const partners = new Map<PartnerId, { clicks: number; commissionTwd: number }>();
  const cats = new Map<DealCategory, { clicks: number; commissionTwd: number }>();
  const dests = new Map<string, number>();

  const f: Funnel = {
    impressions: 0,
    clicks: 0,
    outbound: 0,
    bookings: 0,
    gmvTwd: 0,
    commissionTwd: 0,
    byPartner: [],
    byCategory: [],
    byDest: [],
  };

  for (const e of list) {
    if (e.name === "affiliate_impression") f.impressions++;
    if (e.name === "affiliate_outbound") f.outbound++;

    if (e.name === "affiliate_click") {
      f.clicks++;
      if (e.partner) {
        const p = partners.get(e.partner) ?? { clicks: 0, commissionTwd: 0 };
        p.clicks++;
        partners.set(e.partner, p);
      }
      if (e.category) {
        const c = cats.get(e.category) ?? { clicks: 0, commissionTwd: 0 };
        c.clicks++;
        cats.set(e.category, c);
      }
      if (e.destId) dests.set(e.destId, (dests.get(e.destId) ?? 0) + 1);
    }

    if (e.name === "mock_booking") {
      f.bookings++;
      const value = e.valueTwd ?? 0;
      const commission = Math.round(value * (e.category ? RATE[e.category] : 0.05));
      f.gmvTwd += value;
      f.commissionTwd += commission;
      if (e.partner) {
        const p = partners.get(e.partner) ?? { clicks: 0, commissionTwd: 0 };
        p.commissionTwd += commission;
        partners.set(e.partner, p);
      }
      if (e.category) {
        const c = cats.get(e.category) ?? { clicks: 0, commissionTwd: 0 };
        c.commissionTwd += commission;
        cats.set(e.category, c);
      }
    }
  }

  f.byPartner = [...partners].map(([partner, v]) => ({ partner, ...v }));
  f.byCategory = [...cats].map(([category, v]) => ({ category, ...v }));
  f.byDest = [...dests]
    .map(([destId, clicks]) => ({ destId, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  f.byPartner.sort((a, b) => b.clicks - a.clicks);
  f.byCategory.sort((a, b) => b.clicks - a.clicks);
  return f;
}
