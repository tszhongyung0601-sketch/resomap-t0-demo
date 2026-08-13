import type { Adapt, Agreement, Conflict, Trip } from "../types";

/**
 * Three demo itineraries, each carrying one scenario.
 *
 *   台南  ongoing  — running late, mid-trip. The app's flagship story city.
 *   花蓮  in 2 days — rain forecast for the afternoon.
 *   東京  planning — four people, one disagreement, a split day.
 *
 * Every clock time here is a decision somebody made, not a sum of walking
 * times. That matters because `lib/adapt.ts` shifts these times rather than
 * recomputing them: a dinner at 18:30 is at 18:30 because a table was booked,
 * and an assistant that quietly moves it to 16:09 to "optimise" the day is an
 * assistant people stop trusting.
 */

/* ------------------------------------------------------- 台南・進行中 */

export const TAINAN_TRIP: Trip = {
  id: "trip-tainan",
  destId: "tainan",
  title: "台南 3 天 2 夜",
  dates: "8/12 - 8/14",
  nights: 2,
  phase: "ongoing",
  today: 2,
  /* The four from the 一起規劃 room. This trip is what 接受 AI 建議 adopts
     (Together.tsx), and every receipt in data/expenses.ts is split between the
     same four, so a solo roster here contradicted both: the group agreed on it
     together and then landed on a trip that said they were alone, above a 旅費
     ledger with four names in it. Tracks stay `who: []` — that means "everyone",
     not "nobody", and the whole group does every stop on this trip. */
  travellers: ["mickey", "amy", "john", "susan"],
  days: [
    {
      n: 1,
      date: "8 月 12 日",
      weekday: "星期三",
      tracks: [
        {
          id: "tn-d1",
          who: [],
          stops: [
            { id: "tn-d1-a", poiId: "hayashi", at: "13:30", stayMin: 60 },
            {
              id: "tn-d1-b",
              poiId: "blueprint",
              at: "15:00",
              stayMin: 70,
              from: { mode: "walk", min: 11, metres: 750 },
            },
            {
              id: "tn-d1-c",
              poiId: "shuijiao",
              at: "17:00",
              stayMin: 50,
              meal: "dinner",
              from: { mode: "walk", min: 9, metres: 670 },
            },
            {
              id: "tn-d1-d",
              poiId: "guohua",
              at: "18:30",
              stayMin: 70,
              from: { mode: "walk", min: 16, metres: 1200 },
            },
          ],
        },
      ],
    },
    {
      n: 2,
      date: "8 月 13 日",
      weekday: "星期四",
      tracks: [
        {
          id: "tn-d2",
          who: [],
          stops: [
            { id: "tn-d2-a", poiId: "shennong", at: "09:20", stayMin: 50 },
            {
              id: "tn-d2-b",
              poiId: "chihkan",
              at: "10:30",
              stayMin: 60,
              from: { mode: "walk", min: 9, metres: 620 },
            },
            {
              id: "tn-d2-c",
              poiId: "guohua",
              at: "12:00",
              stayMin: 70,
              meal: "lunch",
              from: { mode: "walk", min: 4, metres: 300 },
            },
            {
              id: "tn-d2-d",
              poiId: "tainan-confucius",
              at: "13:40",
              stayMin: 50,
              from: { mode: "walk", min: 20, metres: 1500 },
            },
            {
              /* The out-and-back the AI offers to drop when the day slips. */
              id: "tn-d2-e",
              poiId: "fuzhong",
              at: "14:50",
              stayMin: 60,
              from: { mode: "walk", min: 3, metres: 190 },
            },
            {
              id: "tn-d2-f",
              poiId: "anping-tree",
              at: "16:20",
              stayMin: 60,
              from: { mode: "bus", min: 24, metres: 5400 },
            },
            {
              /* Booked table. Nothing may move this without saying so. */
              id: "tn-d2-g",
              poiId: "tainan-beef",
              at: "18:30",
              stayMin: 70,
              meal: "dinner",
              from: { mode: "bus", min: 22, metres: 5100 },
            },
          ],
        },
      ],
    },
    {
      n: 3,
      date: "8 月 14 日",
      weekday: "星期五",
      tracks: [
        {
          id: "tn-d3",
          who: [],
          stops: [
            { id: "tn-d3-a", poiId: "anping-fort", at: "09:30", stayMin: 70 },
            {
              id: "tn-d3-b",
              poiId: "chimei",
              at: "11:40",
              stayMin: 120,
              from: { mode: "taxi", min: 26, metres: 11800 },
            },
            {
              id: "tn-d3-c",
              poiId: "tainan-beef",
              at: "14:30",
              stayMin: 50,
              meal: "lunch",
              from: { mode: "taxi", min: 22, metres: 9600 },
            },
          ],
        },
      ],
    },
  ],
};

/* --------------------------------------------------- 花蓮・兩天後出發 */

export const HUALIEN_TRIP: Trip = {
  id: "trip-hualien",
  destId: "hualien",
  title: "花蓮 3 天 2 夜",
  dates: "8/15 - 8/17",
  nights: 2,
  phase: "soon",
  daysUntil: 2,
  today: 1,
  travellers: [],
  /* No accommodation booked — the app offers to help, once, in context. */
  needsStay: true,
  days: [
    {
      n: 1,
      date: "8 月 15 日",
      weekday: "星期六",
      tracks: [
        {
          id: "hl-d1",
          who: [],
          stops: [
            { id: "hl-d1-a", poiId: "pine-garden", at: "14:00", stayMin: 60 },
            {
              id: "hl-d1-b",
              poiId: "stone-museum",
              at: "15:30",
              stayMin: 80,
              from: { mode: "walk", min: 12, metres: 800 },
            },
            {
              id: "hl-d1-c",
              poiId: "dongdamen",
              at: "18:00",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "walk", min: 14, metres: 950 },
            },
            /* 花蓮文創園區 is deliberately NOT here: it is Day 2's wet-weather
               alternative, and an AI that moves you to somewhere you are already
               going tomorrow has not solved anything. */
          ],
        },
      ],
    },
    {
      n: 2,
      date: "8 月 16 日",
      weekday: "星期日",
      tracks: [
        {
          id: "hl-d2",
          who: [],
          stops: [
            { id: "hl-d2-a", poiId: "taroko", at: "09:00", stayMin: 110 },
            {
              id: "hl-d2-b",
              poiId: "shakadang",
              at: "11:20",
              stayMin: 80,
              from: { mode: "drive", min: 15, metres: 6200 },
            },
            {
              /* Outdoor, exposed, and the first thing rain makes pointless. */
              id: "hl-d2-c",
              poiId: "qixingtan",
              at: "14:00",
              stayMin: 90,
              from: { mode: "drive", min: 42, metres: 27800 },
            },
            {
              id: "hl-d2-d",
              poiId: "dongdamen",
              at: "18:00",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "drive", min: 16, metres: 6400 },
            },
          ],
        },
      ],
    },
    {
      n: 3,
      date: "8 月 17 日",
      weekday: "星期一",
      tracks: [
        {
          id: "hl-d3",
          who: [],
          stops: [
            { id: "hl-d3-a", poiId: "hualien-sugar", at: "10:00", stayMin: 60 },
            {
              id: "hl-d3-b",
              poiId: "dongdamen",
              at: "12:30",
              stayMin: 70,
              meal: "lunch",
              from: { mode: "drive", min: 48, metres: 34000 },
            },
          ],
        },
      ],
    },
  ],
};

/* -------------------------------------------------------- 東京・規劃中 */

export const TOKYO_TRIP: Trip = {
  id: "trip-tokyo",
  destId: "tokyo",
  title: "東京 5 天 4 夜",
  dates: "8/20 - 8/24",
  nights: 4,
  phase: "upcoming",
  daysUntil: 7,
  today: 1,
  travellers: ["mickey", "amy", "john", "susan"],
  days: [
    {
      n: 1,
      date: "8 月 20 日",
      weekday: "星期四",
      tracks: [
        {
          id: "tk-d1",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "tk-d1-a", poiId: "sensoji", at: "14:00", stayMin: 60 },
            {
              id: "tk-d1-b",
              poiId: "nakamise",
              at: "15:10",
              stayMin: 40,
              from: { mode: "walk", min: 6, metres: 350 },
            },
            {
              id: "tk-d1-c",
              poiId: "skytree",
              at: "16:20",
              stayMin: 80,
              from: { mode: "train", min: 12, metres: 2100 },
            },
            {
              id: "tk-d1-d",
              poiId: "asakusa-dinner",
              at: "18:30",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "train", min: 12, metres: 2100 },
            },
          ],
        },
      ],
    },
    {
      n: 2,
      date: "8 月 21 日",
      weekday: "星期五",
      tracks: [
        {
          id: "tk-d2",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "tk-d2-a", poiId: "meiji", at: "09:30", stayMin: 60 },
            {
              id: "tk-d2-b",
              poiId: "harajuku",
              at: "10:45",
              stayMin: 70,
              from: { mode: "walk", min: 10, metres: 800 },
            },
            {
              id: "tk-d2-c",
              poiId: "kagari",
              at: "12:30",
              stayMin: 60,
              meal: "lunch",
              from: { mode: "train", min: 21, metres: 6720 },
            },
            {
              id: "tk-d2-d",
              poiId: "ginza",
              at: "13:45",
              stayMin: 100,
              from: { mode: "walk", min: 2, metres: 150 },
            },
            {
              id: "tk-d2-e",
              poiId: "shibuya",
              at: "16:00",
              stayMin: 60,
              from: { mode: "train", min: 18, metres: 6900 },
            },
            {
              id: "tk-d2-f",
              poiId: "shibuya-dinner",
              at: "18:30",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "walk", min: 3, metres: 200 },
            },
          ],
        },
      ],
    },
    {
      n: 3,
      date: "8 月 22 日",
      weekday: "星期六",
      /* The split day the coordinator proposes. Two tracks, one meeting point. */
      tracks: [
        {
          id: "tk-d3a",
          label: "Mickey ＋ John",
          who: ["mickey", "john"],
          stops: [{ id: "tk-d3a-a", poiId: "disney", at: "09:00", stayMin: 510 }],
        },
        {
          id: "tk-d3b",
          label: "Amy ＋ Susan",
          who: ["amy", "susan"],
          stops: [
            { id: "tk-d3b-a", poiId: "tsukiji", at: "09:30", stayMin: 90 },
            {
              id: "tk-d3b-b",
              poiId: "ginza",
              at: "11:30",
              stayMin: 150,
              from: { mode: "walk", min: 14, metres: 950 },
            },
          ],
        },
        {
          id: "tk-d3c",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            {
              id: "tk-d3c-a",
              poiId: "shinjuku",
              at: "18:30",
              stayMin: 100,
              meal: "dinner",
            },
          ],
        },
      ],
      meetUp: { poiId: "shinjuku", at: "18:30" },
    },
    {
      n: 4,
      date: "8 月 23 日",
      weekday: "星期日",
      tracks: [
        {
          id: "tk-d4",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "tk-d4-a", poiId: "ueno", at: "10:30", stayMin: 70 },
            {
              id: "tk-d4-b",
              poiId: "ameyoko",
              at: "12:00",
              stayMin: 80,
              from: { mode: "walk", min: 9, metres: 600 },
            },
            {
              id: "tk-d4-c",
              poiId: "teamlab",
              at: "14:30",
              stayMin: 120,
              from: { mode: "train", min: 26, metres: 9800 },
            },
            {
              id: "tk-d4-d",
              poiId: "shinjuku",
              at: "18:30",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "train", min: 34, metres: 13200 },
            },
          ],
        },
      ],
    },
    {
      n: 5,
      date: "8 月 24 日",
      weekday: "星期一",
      tracks: [
        {
          id: "tk-d5",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "tk-d5-a", poiId: "tnm", at: "10:00", stayMin: 110 },
            {
              id: "tk-d5-b",
              poiId: "ameyoko",
              at: "12:30",
              stayMin: 70,
              from: { mode: "walk", min: 11, metres: 750 },
            },
          ],
        },
      ],
    },
  ],
};

/* --------------------------------------------- 台南・一起規劃的那一趟 */

/**
 * What 一起規劃 hands you when the group accepts the AI's plan.
 *
 * The same itinerary as TAINAN_TRIP, because that is the plan the room voted
 * on — but it is not the same trip. Accepting used to adopt TAINAN_TRIP itself,
 * which is `phase: "ongoing", today: 2`: four people agreed on a weekend in late
 * August and landed on a trip that started last Wednesday and was already half
 * over, with 8/12 - 8/14 in the header they had just seen dated 8/28 - 8/30.
 *
 * So the room gets its own trip, carrying the room's name and the room's
 * weekend, and it has not departed. The dates here and in data/room.ts are the
 * one thing that must stay in step.
 */
export const ROOM_TRIP: Trip = {
  ...TAINAN_TRIP,
  id: "trip-tainan-room",
  title: "台南週末旅行",
  dates: "8/28 - 8/30",
  phase: "upcoming",
  daysUntil: 15,
  today: 1,
  days: TAINAN_TRIP.days.map((d, i) => ({
    ...d,
    date: `8 月 ${28 + i} 日`,
    weekday: ["星期五", "星期六", "星期日"][i] ?? d.weekday,
  })),
};

export const TRIPS: Trip[] = [TAINAN_TRIP, HUALIEN_TRIP, TOKYO_TRIP, ROOM_TRIP];

export const BY_TRIP: Record<string, Trip> = Object.fromEntries(
  TRIPS.map((t) => [t.id, t]),
);

/* --------------------------------------------------------- coordination */

export const AGREED: Agreement[] = [
  { label: "美食", who: ["mickey", "amy", "john", "susan"] },
  { label: "城市散步", who: ["mickey", "amy", "susan"] },
  { label: "拍照", who: ["mickey", "susan"] },
];

/**
 * One disagreement, stated the way a person would state it.
 *
 * No percentages, no "127 combinations evaluated, 119 discarded". A group
 * arguing about Disneyland does not want a score; they want to know who wants
 * what, and what the way out is.
 */
export const CONFLICT: Conflict = {
  topic: "迪士尼",
  wants: ["mickey", "john"],
  against: ["amy"],
  againstReason: "不喜歡樂園",
  suggestion: {
    day: 3,
    groups: [
      { who: ["mickey", "john"], where: "東京迪士尼" },
      { who: ["amy", "susan"], where: "築地 ＋ 銀座" },
    ],
    meet: { at: "18:30", where: "新宿集合吃晚餐" },
  },
  alternatives: [
    {
      id: "half",
      label: "大家一起去，只待半天",
      why: "四個人都在一起，但 Mickey 和 John 只玩得到一半，Amy 還是得進樂園。",
    },
    {
      id: "skip",
      label: "整趟不去迪士尼",
      why: "Amy 最輕鬆，但這是 John 這趟最想去的地方，等於他讓掉全部。",
    },
  ],
};

/* -------------------------------------------------------------- adapts */

export const ADAPTS: Adapt[] = [
  {
    id: "tainan-late",
    tripId: "trip-tainan",
    day: 2,
    trigger: "late",
    icon: "🕘",
    headline: "今天有點延後",
    consequence: "你們還在赤崁樓。",
    choices: ["保留全部景點", "少走一個景點", "延後晚餐"],
    delayMin: 80,
    plan: {
      drop: ["tn-d2-e"],
      keeps: ["赤崁樓", "神農街", "安平樹屋", "晚餐訂位"],
    },
    cta: "幫我重新安排",
  },
  {
    id: "hualien-rain",
    tripId: "trip-hualien",
    day: 2,
    trigger: "rain",
    icon: "🌧️",
    headline: "下午可能下雨",
    consequence: "七星潭是海邊行程，14:00 之後降雨機率 80%。",
    choices: ["照原計畫", "換成室內", "提早去下一站"],
    swapNote: "改成室內",
    plan: {
      drop: [],
      swap: { "hl-d2-c": "hualien-cultural" },
      keeps: ["太魯閣", "砂卡礑步道", "18:00 晚餐不受影響"],
    },
    cta: "換成室內行程",
  },
  {
    id: "tokyo-late",
    tripId: "trip-tokyo",
    day: 2,
    trigger: "late",
    icon: "🕘",
    headline: "行程有點延後",
    consequence: "你們還在明治神宮。",
    choices: ["保留全部景點", "少走一個景點", "延後晚餐"],
    delayMin: 90,
    plan: {
      drop: ["tk-d2-b"],
      keeps: ["明治神宮", "銀座", "澀谷", "晚餐訂位"],
    },
    cta: "幫我重新安排",
  },
];

export const BY_ADAPT: Record<string, Adapt> = Object.fromEntries(
  ADAPTS.map((a) => [a.id, a]),
);

export const adaptsFor = (tripId: string) => ADAPTS.filter((a) => a.tripId === tripId);
