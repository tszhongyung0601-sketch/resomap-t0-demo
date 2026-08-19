import { PARTNERS } from "./affiliatePartners";
import type { AffiliatePartner, PartnerId } from "../types";

/**
 * The coupon wall, and every row on it is a prop.
 *
 * A coupon page is the single most dangerous screen in a travel prototype: a
 * code is the one thing on a demo a viewer will try to actually use, and a
 * plausible-looking string next to a platform's name is indistinguishable from
 * a claim that the platform issued it. ResoMap has no agreement with Klook,
 * KKday or Trip.com — so the codes here are built to fail the eye test on
 * purpose.
 *
 * Four rules the data enforces, not the screen:
 *
 *   1. Every `code` starts with `DEMO-`. `FU26061000` is a code somebody will
 *      paste into a checkout; `DEMO-KLOOK-1000` is one nobody will.
 *   2. Every `title` carries （示意）and names the platform as a destination,
 *      never as a partner. 獨家 / 全站 / 專屬 / 官方合作 are the words that turn
 *      an affiliate link into a lie, and none of them appear here.
 *   3. Every `terms` and `expiry` is invented and says so. Nothing on this
 *      screen traces to a live feed, because there is no live feed.
 *   4. `featured` is an editorial pick, and the tab it feeds is labelled 精選
 *      for that reason. There is no redemption count, no click count and no
 *      rating in this repo, so 熱門 would be inventing a metric rather than
 *      inventing a discount — a different and worse kind of made-up number.
 *
 * `partner` is a `PartnerId` from affiliatePartners.ts rather than a name typed
 * by hand, so the platform's name on a card can only ever be the one the rest
 * of the app already uses.
 *
 * NOT WIRED: screens/Coupons.tsx, the only consumer of this file, has no route
 * in nav.ts and no case in App.tsx. See the header there before wiring it up —
 * Services.tsx has already answered the 優惠券 question the other way.
 */

/** What the torn-off stub on the right of a card prints. */
export interface CouponDiscount {
  /** The big text: "1,000", "8%", "半價". */
  amount: string;
  /** Sits in front of the amount at a smaller size. "NT$", and so far only. */
  prefix?: string;
  /** What the amount does — 折抵 / 折扣 / 第 2 人. */
  kind: string;
}

export interface DemoCoupon {
  id: string;
  /** An id from PARTNERS. Never a platform name written out here. */
  partner: PartnerId;
  /** Always `DEMO-` prefixed. See rule 1 above. */
  code: string;
  /** Always carries （示意）and never claims a relationship. */
  title: string;
  /** The invented condition. */
  terms: string;
  /** Invented, and rendered with its own 示意 label. */
  expiry: string;
  discount: CouponDiscount;
  /**
   * Surfaces under the 精選 tab.
   *
   * `featured`, not `hot`: the flag is hand-picked in this file and there is no
   * redemption or view count anywhere in the repo to back a popularity claim.
   * 熱門 on a tab would be a number asserted without a source, which is the one
   * thing this screen cannot afford to do.
   */
  featured?: boolean;
}

/**
 * The one line every card has to print next to its code.
 *
 * Kept here rather than in the screen because it belongs to the data: if a row
 * exists in this file, this sentence is true of it.
 */
export const COUPON_DEMO_NOTE = "Demo 示意碼，不可使用";

export const COUPONS: DemoCoupon[] = [
  {
    id: "cp-klook-1000",
    partner: "klook",
    code: "DEMO-KLOOK-1000",
    title: "Klook 門票優惠碼（示意）",
    terms: "示意條件：門票訂單滿 NT$5,000 可折抵 NT$1,000",
    expiry: "2026/12/31",
    discount: { amount: "1,000", prefix: "NT$", kind: "折抵" },
    featured: true,
  },
  {
    id: "cp-klook-300",
    partner: "klook",
    code: "DEMO-KLOOK-300",
    title: "Klook 一日遊優惠碼（示意）",
    terms: "示意條件：一日遊行程滿 NT$2,000 可折抵 NT$300",
    expiry: "2026/10/31",
    discount: { amount: "300", prefix: "NT$", kind: "折抵" },
    featured: true,
  },
  {
    id: "cp-klook-8off",
    partner: "klook",
    code: "DEMO-KLOOK-8OFF",
    title: "Klook 交通票券優惠碼（示意）",
    terms: "示意條件：機場快線與鐵路票券 8% 折扣，單筆上限 NT$400",
    expiry: "2026/09/30",
    discount: { amount: "8%", kind: "折扣" },
  },
  {
    id: "cp-kkday-350",
    partner: "kkday",
    code: "DEMO-KKDAY-350",
    title: "KKday 優惠碼（示意）",
    terms: "示意條件：訂單滿 NT$2,500 可折抵 NT$350",
    expiry: "2026/12/31",
    discount: { amount: "350", prefix: "NT$", kind: "折抵" },
    featured: true,
  },
  {
    id: "cp-kkday-5off",
    partner: "kkday",
    code: "DEMO-KKDAY-5OFF",
    title: "KKday eSIM 優惠碼（示意）",
    terms: "示意條件：eSIM 與網路方案 5% 折扣",
    expiry: "2026/11/30",
    discount: { amount: "5%", kind: "折扣" },
  },
  {
    id: "cp-trip-2p",
    partner: "tripcom",
    code: "DEMO-TRIP-2P",
    title: "Trip.com 訂房優惠碼（示意）",
    terms: "示意條件：兩人同行入住，第 2 人房價半價",
    expiry: "2026/12/31",
    discount: { amount: "半價", kind: "第 2 人" },
    featured: true,
  },
  {
    id: "cp-trip-600",
    partner: "tripcom",
    code: "DEMO-TRIP-600",
    title: "Trip.com 機票優惠碼（示意）",
    terms: "示意條件：國際線機票滿 NT$8,000 可折抵 NT$600",
    expiry: "2026/10/15",
    discount: { amount: "600", prefix: "NT$", kind: "折抵" },
  },
];

/**
 * The platforms that get a tab, derived from the rows above.
 *
 * Reading it off COUPONS rather than listing three names means a tab can never
 * exist with nothing behind it, and a coupon can never exist with no tab that
 * reaches it. Order follows PARTNERS so the strip does not reshuffle when a row
 * is added.
 */
export const COUPON_PARTNERS: AffiliatePartner[] = PARTNERS.filter((p) =>
  COUPONS.some((c) => c.partner === p.id),
);

export const FEATURED_COUPONS: DemoCoupon[] = COUPONS.filter((c) => c.featured);

export const couponsFor = (id: PartnerId): DemoCoupon[] =>
  COUPONS.filter((c) => c.partner === id);
