import type { Service } from "../types";

/**
 * Five on the home screen. Not six, not nine.
 *
 * The app has around twenty things it can do. Nineteen of them are worth
 * nothing to somebody who just opened it, so the home screen shows the four
 * they might actually want plus one honest door to the rest. Progressive
 * disclosure is not a way of hiding features — it is a way of making the four
 * that matter findable.
 */
export const HOME_SERVICES: Service[] = [
  { id: "plan", label: "規劃行程", icon: "🗓️" },
  { id: "tickets", label: "門票・體驗", icon: "🎟️" },
  { id: "stay", label: "找住宿", icon: "🛏️" },
  { id: "transport", label: "交通", icon: "🚄" },
  { id: "more", label: "更多服務", icon: "⋯" },
];

/** Behind 更多服務. Entry points and mock flows — no booking engines. */
export const MORE_SERVICES: Service[] = [
  { id: "flight", label: "機票", icon: "✈️", note: "比價後前往訂票平台" },
  { id: "car", label: "租車", icon: "🚗", note: "甲地租乙地還" },
  { id: "airport", label: "機場接送", icon: "🚐", note: "四人座 / 七人座" },
  { id: "esim", label: "eSIM", icon: "📶", note: "落地即可上網" },
  { id: "insurance", label: "旅平險", icon: "🛡️", note: "單次投保" },
  { id: "coupon", label: "優惠券", icon: "🏷️", note: "我的折扣碼" },
  { id: "tools", label: "旅行工具", icon: "🧰", note: "記帳、行李、離線行程" },
];
