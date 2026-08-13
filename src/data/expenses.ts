import type { Expense } from "../types";

/**
 * A half-settled trip's receipts.
 *
 * The state matters: Mickey has fronted most of it, one bill was not for
 * everybody (Amy and Susan skipped the beef soup), and one was split by an
 * uneven amount because John only had the small bowl. A demo where every bill
 * is four-ways-even proves the arithmetic works on the one case nobody needs
 * help with.
 */
export const EXPENSES: Expense[] = [
  {
    id: "ex-1",
    tripId: "trip-tainan",
    amountTwd: 1600,
    category: "food",
    note: "國華街晚餐",
    paidBy: "mickey",
    forWhom: ["mickey", "amy", "john", "susan"],
    mode: "even",
    day: 1,
    date: "8 月 12 日",
  },
  {
    id: "ex-2",
    tripId: "trip-tainan",
    amountTwd: 5400,
    category: "stay",
    note: "中西區老屋民宿・兩晚",
    paidBy: "amy",
    forWhom: ["mickey", "amy", "john", "susan"],
    mode: "even",
    day: 1,
    date: "8 月 12 日",
  },
  {
    id: "ex-3",
    tripId: "trip-tainan",
    amountTwd: 1120,
    category: "transport",
    note: "高鐵台北－台南",
    paidBy: "mickey",
    forWhom: ["mickey", "amy", "john", "susan"],
    mode: "even",
    day: 1,
    date: "8 月 12 日",
  },
  {
    /* Two people had already eaten. This is the case that breaks naive apps. */
    id: "ex-4",
    tripId: "trip-tainan",
    amountTwd: 640,
    category: "food",
    note: "府城牛肉湯",
    paidBy: "john",
    forWhom: ["mickey", "john"],
    mode: "even",
    day: 2,
    date: "8 月 13 日",
  },
  {
    id: "ex-5",
    tripId: "trip-tainan",
    amountTwd: 280,
    category: "ticket",
    note: "赤崁樓門票 × 4",
    paidBy: "mickey",
    forWhom: ["mickey", "amy", "john", "susan"],
    mode: "even",
    day: 2,
    date: "8 月 13 日",
  },
  {
    id: "ex-6",
    tripId: "trip-tainan",
    amountTwd: 800,
    category: "shop",
    note: "林百貨伴手禮",
    paidBy: "susan",
    forWhom: ["mickey", "susan"],
    mode: "even",
    day: 2,
    date: "8 月 13 日",
  },
  {
    /* John had the small bowl and said so. An uneven split, stated in TWD. */
    id: "ex-7",
    tripId: "trip-tainan",
    amountTwd: 900,
    category: "food",
    note: "阿明豬心冬粉",
    paidBy: "amy",
    forWhom: ["mickey", "amy", "john"],
    mode: "amount",
    custom: { mickey: 350, amy: 350, john: 200 },
    day: 2,
    date: "8 月 13 日",
  },
  {
    id: "ex-8",
    tripId: "trip-tainan",
    amountTwd: 800,
    category: "ticket",
    note: "奇美博物館 × 4",
    paidBy: "mickey",
    forWhom: ["mickey", "amy", "john", "susan"],
    mode: "even",
    day: 3,
    date: "8 月 14 日",
  },
];
