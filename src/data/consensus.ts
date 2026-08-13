import type { Conflict, Tradeoff, TradeoffPlan, TravellerId } from "../types";

/**
 * The four conflicts the coordinator finds, and the compromises it offers.
 *
 * Design rule for this whole file: every plan must list at least one cost, and
 * no plan may satisfy everybody. A screen that shows four happy faces would
 * quietly undo the argument the demo exists to make.
 */

export const CONFLICTS: Conflict[] = [
  {
    id: "c-disney",
    title: "東京迪士尼 × 不想去樂園",
    sides: [
      { travellerId: "che", claim: "一定要去，而且要完整一天", locked: true },
      { travellerId: "yu", claim: "不想進任何樂園" },
    ],
  },
  {
    id: "c-lodging",
    title: "市中心住宿 × 每晚 NT$2,000 上限",
    sides: [
      { travellerId: "ting", claim: "想住市中心，交通要方便" },
      { travellerId: "kai", claim: "住宿每晚不能超過 NT$2,000" },
    ],
  },
  {
    id: "c-earlystart",
    title: "迪士尼要早出門 × 最早 10:00 才出門",
    sides: [
      { travellerId: "che", claim: "開園前 30 分要到，08:30 就得出發" },
      { travellerId: "ting", claim: "最早 10:00，早起會整天沒精神" },
    ],
  },
  {
    id: "c-walking",
    title: "淺草＋上野＋谷根千 6.8km × 每日步行 ≤ 3km",
    sides: [
      { travellerId: "yu", claim: "老街要慢慢走才有意思" },
      { travellerId: "ting", claim: "一天走不到 3 公里" },
    ],
    resolvedSilently: true,
    silentResolution:
      "D1 移除谷根千、上野段改搭地鐵不用走，婷婷 D1 步行壓到 2.8km。谷根千移入備選清單，小雨的必去項未被動到，因此不需要任何人正式讓步。",
  },
];

/** The active plan of each tradeoff at load time. */
export const DEFAULT_PLAN_IDS: Record<string, string> = {
  "t-disney": "split",
  "t-lodging": "asakusa",
  "t-earlystart": "one-early-day",
};

export const TRADEOFFS: Tradeoff[] = [
  {
    id: "t-disney",
    conflictId: "c-disney",
    plans: [
      {
        id: "split",
        label: "D2 分頭行動",
        resolution:
          "阿哲＋阿凱 去迪士尼一整天；小雨＋婷婷 去鎌倉；18:30 東京車站會合吃晚餐。",
        satisfies: [
          { travellerId: "che", because: "拿到完整一天，不用切半天" },
          { travellerId: "yu", because: "完全不用進樂園，改走鎌倉古蹟" },
        ],
        costs: [
          { travellerId: "all", because: "三天裡少一天全員同行" },
          { travellerId: "kai", because: "兩邊交通分開買，多 ¥3,800" },
        ],
        satisfaction: { che: 92, yu: 84, kai: 95, ting: 79 },
      },
      {
        id: "half-day",
        label: "全員迪士尼半天",
        resolution:
          "全員 D2 上午進迪士尼，14:00 出園改去淺草補行程，四個人整天都在一起。",
        satisfies: [{ travellerId: "ting", because: "不用分開，行程單純" }],
        costs: [
          { travellerId: "che", because: "半天玩不完，熱門設施排不到" },
          { travellerId: "yu", because: "還是得進樂園，只是時間短一點" },
        ],
        satisfaction: { che: 62, yu: 71, kai: 88, ting: 83 },
      },
      {
        id: "drop-disney",
        label: "取消迪士尼",
        resolution: "三天全部走都心與鎌倉，把迪士尼留到下次。",
        satisfies: [
          { travellerId: "yu", because: "完全不用碰樂園" },
          { travellerId: "kai", because: "省下 ¥9,400 門票" },
        ],
        costs: [
          { travellerId: "che", because: "這是他標記為不可妥協的唯一一項" },
        ],
        satisfaction: { che: 18, yu: 93, kai: 99, ting: 86 },
      },
    ],
  },
  {
    id: "t-lodging",
    conflictId: "c-lodging",
    plans: [
      {
        id: "asakusa",
        label: "住淺草，不住新宿",
        resolution:
          "淺草 APA，4 人 2 房 2 晚，每人每晚 NT$1,850。淺草站步行 3 分，銀座線直通市中心 15 分。",
        satisfies: [
          { travellerId: "kai", because: "壓在 NT$2,000 上限內" },
          { travellerId: "yu", because: "住在淺草寺旁邊，早晚都能逛" },
        ],
        costs: [
          { travellerId: "ting", because: "不是她想的新宿，購物要多搭 15 分鐘" },
        ],
        satisfaction: { che: 92, yu: 84, kai: 95, ting: 79 },
      },
      {
        id: "shinjuku",
        label: "住新宿市中心",
        resolution: "新宿東口商務飯店，每人每晚 NT$3,200，走到百貨與車站都在 5 分內。",
        satisfies: [{ travellerId: "ting", because: "正是她要的市中心位置" }],
        costs: [
          { travellerId: "kai", because: "每晚超出上限 NT$1,200，三天多 NT$2,400" },
        ],
        satisfaction: { che: 92, yu: 80, kai: 41, ting: 94 },
      },
    ],
  },
  {
    id: "t-earlystart",
    conflictId: "c-earlystart",
    plans: [
      {
        id: "one-early-day",
        label: "只有 D2 早起",
        resolution:
          "D2 08:30 出發（迪士尼那天）；D1 與 D3 都 10:30 才出門，讓婷婷用一天換兩天。",
        satisfies: [
          { travellerId: "che", because: "保住迪士尼的有效遊玩時間" },
          { travellerId: "ting", because: "三天裡只需要早起一次" },
        ],
        costs: [{ travellerId: "ting", because: "D2 得 08:30 出門，比她的底線早 90 分" }],
        satisfaction: { che: 92, yu: 84, kai: 95, ting: 79 },
      },
      {
        id: "all-late",
        label: "三天都 10:30 出發",
        resolution: "完全照婷婷的作息，迪士尼當天也 10:30 才出門。",
        satisfies: [{ travellerId: "ting", because: "三天都不用早起" }],
        costs: [
          { travellerId: "che", because: "迪士尼實際遊玩時間少 2.5 小時" },
        ],
        satisfaction: { che: 74, yu: 84, kai: 95, ting: 92 },
      },
    ],
  },
];

export const TRADEOFF_BY_ID: Record<string, Tradeoff> = Object.fromEntries(
  TRADEOFFS.map((t) => [t.id, t]),
);

export const CONFLICT_BY_ID: Record<string, Conflict> = Object.fromEntries(
  CONFLICTS.map((c) => [c.id, c]),
);

export function planOf(tradeoffId: string, planId: string): TradeoffPlan {
  const t = TRADEOFF_BY_ID[tradeoffId];
  const p = t?.plans.find((x) => x.id === planId);
  if (!p) throw new Error(`unknown plan ${tradeoffId}/${planId}`);
  return p;
}

/**
 * Satisfaction is the *minimum* each traveller scores across the active plans:
 * one badly-resolved conflict is enough to ruin a person's trip, and averaging
 * would hide exactly the thing this screen exists to show.
 */
export function satisfactionFor(
  selected: Record<string, string>,
): Record<TravellerId, number> {
  const ids: TravellerId[] = ["che", "yu", "kai", "ting"];
  const out = {} as Record<TravellerId, number>;
  for (const id of ids) {
    let min = 100;
    for (const [tradeoffId, planId] of Object.entries(selected)) {
      const value = planOf(tradeoffId, planId).satisfaction[id];
      if (typeof value === "number") min = Math.min(min, value);
    }
    out[id] = min;
  }
  return out;
}

/** Consensus is the mean of the four, rounded — capped so it never reads 100%. */
export function consensusOf(sat: Record<TravellerId, number>): number {
  const vals = Object.values(sat);
  return Math.min(92, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
}
