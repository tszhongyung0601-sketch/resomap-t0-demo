import type { Room } from "../types";

/**
 * A demo planning room, mid-argument.
 *
 * The state it starts in is the whole point: three of four people have filled
 * in their preferences, most places have votes, and two places are genuinely
 * contested. A room where everybody already agrees demonstrates nothing — the
 * feature exists for the LINE group with fourteen links and no decision.
 *
 * 花園夜市 is the designed disagreement: two for, two against, and it is the
 * furthest thing from everything else on the list, so the AI's suggestion to
 * swap it has a reason a person can check on the map.
 */
export const ROOM: Room = {
  id: "room-tainan",
  destId: "tainan",
  title: "台南週末旅行",
  /* Must match ROOM_TRIP in data/trips.ts — this is the trip 接受 AI 建議
     produces, and a room advertising one weekend that hands you another is the
     seam the whole feature is judged on. */
  dates: "8/28 - 8/30",
  members: [
    {
      id: "mickey",
      preference: {
        interests: ["food", "photo", "shopping"],
        pace: "normal",
        budget: 2,
        mustGo: "國華街",
        avoid: "",
      },
    },
    {
      id: "amy",
      preference: {
        interests: ["culture", "food"],
        pace: "easy",
        budget: 2,
        mustGo: "奇美博物館",
        avoid: "太晚的夜市",
      },
    },
    {
      id: "john",
      preference: {
        interests: ["food", "nightlife", "photo"],
        pace: "packed",
        budget: 1,
        mustGo: "",
        avoid: "",
      },
    },
    /* Susan has not filled hers in. Every group has one, and the screen has to
       look right while it waits for her. */
    { id: "susan" },
  ],
  poiIds: [
    "chihkan",
    "shennong",
    "guohua",
    "chimei",
    "anping-fort",
    "hayashi",
    "tainan-art",
    "anping-tree",
    "tainan-beef",
    "blueprint",
  ],
  votes: [
    /* 赤崁樓 — 一致同意 */
    { poiId: "chihkan", who: "mickey", value: "yes" },
    { poiId: "chihkan", who: "amy", value: "yes" },
    { poiId: "chihkan", who: "john", value: "yes" },
    { poiId: "chihkan", who: "susan", value: "yes" },

    /* 國華街 — 四個人都選了美食 */
    { poiId: "guohua", who: "mickey", value: "yes" },
    { poiId: "guohua", who: "amy", value: "yes" },
    { poiId: "guohua", who: "john", value: "yes" },
    { poiId: "guohua", who: "susan", value: "yes" },

    /* 府城牛肉湯 — 同上 */
    { poiId: "tainan-beef", who: "mickey", value: "yes" },
    { poiId: "tainan-beef", who: "amy", value: "yes" },
    { poiId: "tainan-beef", who: "john", value: "yes" },
    { poiId: "tainan-beef", who: "susan", value: "yes" },

    /* 神農街 — 一票沒意見 */
    { poiId: "shennong", who: "mickey", value: "yes" },
    { poiId: "shennong", who: "amy", value: "yes" },
    { poiId: "shennong", who: "john", value: "yes" },
    { poiId: "shennong", who: "susan", value: "maybe" },

    /* 安平古堡 */
    { poiId: "anping-fort", who: "mickey", value: "yes" },
    { poiId: "anping-fort", who: "amy", value: "yes" },
    { poiId: "anping-fort", who: "john", value: "yes" },
    { poiId: "anping-fort", who: "susan", value: "maybe" },

    /* 林百貨 */
    { poiId: "hayashi", who: "mickey", value: "yes" },
    { poiId: "hayashi", who: "amy", value: "yes" },
    { poiId: "hayashi", who: "john", value: "yes" },
    { poiId: "hayashi", who: "susan", value: "maybe" },

    /* 安平樹屋 */
    { poiId: "anping-tree", who: "mickey", value: "yes" },
    { poiId: "anping-tree", who: "amy", value: "yes" },
    { poiId: "anping-tree", who: "john", value: "yes" },
    { poiId: "anping-tree", who: "susan", value: "maybe" },

    /* 藍晒圖 */
    { poiId: "blueprint", who: "mickey", value: "yes" },
    { poiId: "blueprint", who: "amy", value: "yes" },
    { poiId: "blueprint", who: "john", value: "yes" },
    { poiId: "blueprint", who: "susan", value: "maybe" },

    /* 奇美博物館 — Amy 堅持，John 不看博物館。真正的分歧之一 */
    { poiId: "chimei", who: "mickey", value: "yes" },
    { poiId: "chimei", who: "amy", value: "yes" },
    { poiId: "chimei", who: "john", value: "maybe" },
    { poiId: "chimei", who: "susan", value: "no" },

    /* 臺南市美術館 — 第二個分歧 */
    { poiId: "tainan-art", who: "mickey", value: "yes" },
    { poiId: "tainan-art", who: "amy", value: "maybe" },
    { poiId: "tainan-art", who: "john", value: "maybe" },
    { poiId: "tainan-art", who: "susan", value: "no" },
  ],
};
