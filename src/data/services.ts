import type { Service } from "../types";

/**
 * Six on the home screen, and no more.
 *
 * Each one is a need a traveller can name — 門票, 住宿, 交通 — never a platform.
 * Klook and Booking do not appear until the traveller has said what they are
 * trying to do, because "找住宿" is a thought somebody actually has and
 * "Agoda" is not. Need first, provider second.
 *
 * 語音導覽 is deliberately absent. It is not a utility you go looking for; it
 * belongs to the place you are standing in front of, which is where it appears.
 */
export const HOME_SERVICES: Service[] = [
  { id: "plan", label: "規劃行程", icon: "🗓️" },
  { id: "tickets", label: "門票・體驗", icon: "🎟️" },
  { id: "stay", label: "找住宿", icon: "🛏️" },
  { id: "transport", label: "交通", icon: "🚄" },
  { id: "carrental", label: "租車・接送", icon: "🚗" },
  { id: "more", label: "更多", icon: "⋯" },
];

/** Behind 更多. Low-frequency services — entry points, not booking engines. */
export const MORE_SERVICES: Service[] = [
  { id: "flight", label: "機票比價", icon: "✈️", note: "比價後前往訂票平台" },
  { id: "esim", label: "eSIM", icon: "📶", note: "落地即可上網" },
  { id: "insurance", label: "旅平險", icon: "🛡️", note: "單次投保" },
  { id: "coupon", label: "優惠券", icon: "🏷️", note: "我的折扣碼" },
  { id: "tools", label: "旅行工具", icon: "🧰", note: "記帳、行李、離線行程" },
];

/** What sits behind 交通 and 租車・接送 once tapped. Demo entries only. */
export const TRANSPORT_MODES: { id: string; label: string; icon: string; note: string }[] = [
  { id: "flight", label: "機票", icon: "✈️", note: "國內線與國際線比價" },
  { id: "rail", label: "大眾運輸", icon: "🚄", note: "高鐵、台鐵、捷運票券" },
  { id: "airport", label: "機場交通", icon: "🚇", note: "機捷、客運與接送" },
];

export const CAR_MODES: { id: string; label: string; icon: string; note: string }[] = [
  { id: "rental", label: "租車", icon: "🚗", note: "甲地租乙地還" },
  { id: "transfer", label: "機場接送", icon: "🚐", note: "四人座 / 七人座" },
];
