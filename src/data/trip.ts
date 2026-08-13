import type { AdaptScenario, Trip } from "../types";

/**
 * Plan A: the itinerary the coordinator produces once the three tradeoffs are
 * resolved the default way. Day 2 splits — that split is the whole point of the
 * screen, so it is modelled as first-class data rather than a rendering trick.
 *
 * Times, stays and leg minutes are hand-checked to be internally consistent;
 * a boss who adds them up should not find a hole.
 */
export const TRIP: Trip = {
  destination: "東京",
  nights: 2,
  lodging: {
    name: "淺草 APA 飯店",
    area: "淺草",
    perNightTwd: 1850,
    note: "4 人 2 房・淺草站步行 3 分",
  },
  days: [
    {
      day: 1,
      date: "11/14",
      weekday: "週五",
      departAt: "10:30",
      branches: [
        {
          id: "d1",
          travellers: ["che", "yu", "kai", "ting"],
          stops: [
            {
              stopId: "d1-s1",
              spotId: "sensoji",
              arrive: "10:45",
              stayMin: 60,
              costJpy: 0,
              forTravellers: ["yu"],
              locked: true,
              legFrom: { mode: "walk", minutes: 12, metres: 850, costJpy: 0 },
              commerceIds: ["nrt-transfer"],
            },
            {
              stopId: "d1-s2",
              spotId: "nakamise",
              arrive: "11:50",
              stayMin: 40,
              costJpy: 800,
              forTravellers: ["ting", "yu"],
              legFrom: { mode: "walk", minutes: 5, metres: 340, costJpy: 0 },
              commerceIds: ["kimono"],
            },
            {
              stopId: "d1-s3",
              spotId: "daikokuya",
              arrive: "12:35",
              stayMin: 50,
              costJpy: 2400,
              forTravellers: [],
              legFrom: { mode: "walk", minutes: 5, metres: 300, costJpy: 0 },
            },
            {
              stopId: "d1-s4",
              spotId: "uenopark",
              arrive: "13:50",
              stayMin: 50,
              costJpy: 0,
              forTravellers: ["yu"],
              legFrom: { mode: "train", minutes: 18, metres: 3200, costJpy: 180 },
              commerceIds: ["ueno-zoo"],
            },
            {
              stopId: "d1-s5",
              spotId: "ameyoko",
              arrive: "14:50",
              stayMin: 60,
              costJpy: 1500,
              forTravellers: ["kai", "ting"],
              legFrom: { mode: "walk", minutes: 10, metres: 700, costJpy: 0 },
            },
            {
              stopId: "d1-s6",
              spotId: "asakusa-yakiniku",
              arrive: "18:00",
              stayMin: 90,
              costJpy: 3800,
              forTravellers: [],
              legFrom: { mode: "train", minutes: 16, metres: 3100, costJpy: 180 },
            },
          ],
        },
      ],
    },
    {
      day: 2,
      date: "11/15",
      weekday: "週六",
      departAt: "08:30",
      rejoin: { spotId: "tokyo-station", at: "18:30" },
      branches: [
        {
          id: "d2-a",
          label: "阿哲＋阿凱 · 舞濱",
          travellers: ["che", "kai"],
          stops: [
            {
              stopId: "d2a-s1",
              spotId: "disney",
              arrive: "09:00",
              stayMin: 540,
              costJpy: 9400,
              forTravellers: ["che"],
              locked: true,
              legFrom: { mode: "train", minutes: 32, metres: 18400, costJpy: 410 },
              commerceIds: ["disney-1day", "luggage"],
            },
          ],
        },
        {
          id: "d2-b",
          label: "小雨＋婷婷 · 鎌倉",
          travellers: ["yu", "ting"],
          stops: [
            {
              stopId: "d2b-s1",
              spotId: "daibutsu",
              arrive: "10:20",
              stayMin: 50,
              costJpy: 300,
              forTravellers: ["yu"],
              locked: true,
              legFrom: { mode: "train", minutes: 96, metres: 52000, costJpy: 1100 },
              commerceIds: ["enoden", "kotokuin"],
            },
            {
              stopId: "d2b-s2",
              spotId: "komachi",
              arrive: "11:35",
              stayMin: 70,
              costJpy: 1800,
              forTravellers: ["yu", "ting"],
              legFrom: { mode: "train", minutes: 12, metres: 2100, costJpy: 200 },
            },
            {
              stopId: "d2b-s3",
              spotId: "kamakurakoko",
              arrive: "13:05",
              stayMin: 40,
              costJpy: 0,
              forTravellers: ["ting"],
              legFrom: { mode: "train", minutes: 18, metres: 5400, costJpy: 200 },
            },
            {
              stopId: "d2b-s4",
              spotId: "enoshima",
              arrive: "14:10",
              stayMin: 60,
              costJpy: 500,
              forTravellers: ["yu"],
              legFrom: { mode: "train", minutes: 12, metres: 3100, costJpy: 200 },
            },
          ],
        },
        {
          id: "d2-join",
          label: "會合",
          travellers: ["che", "yu", "kai", "ting"],
          stops: [
            {
              stopId: "d2-j1",
              spotId: "tokyo-station",
              arrive: "18:30",
              stayMin: 90,
              costJpy: 3200,
              forTravellers: [],
              legFrom: { mode: "train", minutes: 62, metres: 48000, costJpy: 950 },
            },
          ],
        },
      ],
    },
    {
      day: 3,
      date: "11/16",
      weekday: "週日",
      departAt: "10:30",
      branches: [
        {
          id: "d3",
          travellers: ["che", "yu", "kai", "ting"],
          stops: [
            {
              stopId: "d3-s1",
              spotId: "meiji",
              arrive: "11:05",
              stayMin: 50,
              costJpy: 0,
              forTravellers: ["yu"],
              legFrom: { mode: "train", minutes: 28, metres: 9800, costJpy: 210 },
            },
            {
              stopId: "d3-s2",
              spotId: "omotesando",
              arrive: "12:10",
              stayMin: 60,
              costJpy: 2600,
              forTravellers: ["ting"],
              legFrom: { mode: "walk", minutes: 12, metres: 900, costJpy: 0 },
            },
            {
              stopId: "d3-s3",
              spotId: "shibuya",
              arrive: "13:30",
              stayMin: 40,
              costJpy: 0,
              forTravellers: [],
              legFrom: { mode: "walk", minutes: 16, metres: 1300, costJpy: 0 },
            },
            {
              stopId: "d3-s4",
              spotId: "shibuya-sky-spot",
              arrive: "14:20",
              stayMin: 60,
              costJpy: 2500,
              forTravellers: ["che", "ting"],
              legFrom: { mode: "walk", minutes: 6, metres: 350, costJpy: 0 },
              commerceIds: ["shibuya-sky"],
            },
            {
              stopId: "d3-s5",
              spotId: "narita",
              arrive: "17:30",
              stayMin: 0,
              costJpy: 0, // the N'EX fare is on the leg, not the stop

              forTravellers: [],
              legFrom: { mode: "train", minutes: 78, metres: 68000, costJpy: 3070 },
              commerceIds: ["nex", "esim"],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Four mid-trip disruptions. Every option names who pays for it — that column
 * is the difference between a companion and a scheduler.
 */
export const ADAPT_SCENARIOS: AdaptScenario[] = [
  {
    trigger: "overslept",
    day: 3,
    observation: "現在 12:12，你們還在飯店（原定 10:30 出發）",
    consequence: "今天剩 4 個點，照原行程最後兩站會來不及，班機不能改。",
    options: [
      {
        id: "drop-meiji",
        label: "刪掉明治神宮，其餘照舊",
        detail: "直接從飯店搭車到表參道，時間立刻追回來。",
        impact: { travellerId: "yu", because: "明治神宮是她列的歷史文化重點" },
        satisfactionDelta: { yu: -11 },
        effect: { type: "drop", stopId: "d3-s1" },
      },
      {
        id: "squeeze-shibuya",
        label: "壓縮澀谷停留 40 分，全部保留",
        detail: "四個點全部保留，但澀谷只夠拍照不夠逛。",
        impact: { travellerId: "ting", because: "步行變 3.8km，超過她的 3km 上限" },
        satisfactionDelta: { ting: -8 },
        effect: { type: "shorten", stopId: "d3-s3", byMin: 25 },
      },
      {
        id: "taxi-segments",
        label: "兩段改搭計程車，全部保留、時間不變",
        detail: "飯店→明治神宮、表參道→澀谷 兩段改計程車。",
        impact: { travellerId: "kai", because: "預算 +¥3,200，超出他今天的上限" },
        satisfactionDelta: { kai: -14 },
        effect: {
          type: "mode",
          stopIds: ["d3-s1", "d3-s3"],
          to: "taxi",
          extraCostJpy: 3200,
        },
      },
    ],
  },
  {
    trigger: "rain",
    day: 3,
    observation: "表參道一帶開始下雨，預報到 16:00 都不會停",
    consequence: "明治神宮參道是碎石路，SHIBUYA SKY 的戶外展望台雨天會關閉。",
    options: [
      {
        id: "indoor-hills",
        label: "改去表參道 Hills（全室內）",
        detail: "安藤忠雄的螺旋坡道本身就是景點，從地下街走過去不會淋到。",
        impact: { travellerId: "yu", because: "戶外攝影的計畫泡湯" },
        satisfactionDelta: { yu: -7, ting: 3 },
        effect: { type: "swap", stopId: "d3-s2", toSpotId: "omotesando-hills" },
      },
      {
        id: "edo-museum",
        label: "改去江戶東京博物館",
        detail: "全室內，且延續小雨的歷史文化路線。",
        impact: { travellerId: "ting", because: "今天的購物行程整個取消" },
        satisfactionDelta: { ting: -13, yu: 5 },
        effect: { type: "swap", stopId: "d3-s2", toSpotId: "edo-museum" },
      },
      {
        id: "skip-sky",
        label: "放棄 SHIBUYA SKY，提早到機場",
        detail: "雨天上去也看不到東西，早點到機場反而從容。",
        impact: { travellerId: "che", because: "他跟婷婷都把展望台列為想去" },
        satisfactionDelta: { che: -9, ting: -6 },
        effect: { type: "drop", stopId: "d3-s4" },
      },
    ],
  },
  {
    trigger: "restaurant-full",
    day: 1,
    observation: "大黑家現場候位 55 分，你們原本只排了 50 分鐘吃飯",
    consequence: "等下去的話，上野公園和阿美橫町會被壓縮掉一個。",
    options: [
      {
        id: "wait",
        label: "等 25 分鐘，改坐分店",
        detail: "分店走過去 4 分鐘，同一個廚房、同樣的醬汁。",
        impact: { travellerId: "all", because: "全員今天的行程往後 25 分" },
        satisfactionDelta: { ting: -4 },
        effect: { type: "shorten", stopId: "d1-s4", byMin: 20 },
      },
      {
        id: "nearby",
        label: "改吃附近另一家",
        detail: "步行 3 分鐘有另一家老天婦羅，價格低約三成。",
        impact: { travellerId: "yu", because: "大黑家是她查了很久的口袋名單" },
        satisfactionDelta: { yu: -6, kai: 4 },
        effect: { type: "swap", stopId: "d1-s3", toSpotId: "nakamise" },
      },
      {
        id: "skip-ueno",
        label: "照等，砍掉上野公園",
        detail: "吃完直接去阿美橫町，行程不趕。",
        impact: { travellerId: "yu", because: "上野公園是她排進去的" },
        satisfactionDelta: { yu: -9 },
        effect: { type: "drop", stopId: "d1-s4" },
      },
    ],
  },
  {
    trigger: "tired",
    day: 2,
    observation: "婷婷今天已經走了 5.2km，她的上限是 3km",
    consequence: "江之島上島還有一段坡，走完會影響晚上的會合晚餐。",
    options: [
      {
        id: "ting-back",
        label: "婷婷先回飯店休息",
        detail: "小雨自己去江之島，兩人晚餐時在東京車站會合。",
        impact: { travellerId: "all", because: "會合晚餐少一個人" },
        satisfactionDelta: { ting: -3, yu: -4 },
        effect: { type: "drop", stopId: "d2b-s4" },
      },
      {
        id: "escalator",
        label: "江之島改搭付費電扶梯",
        detail: "省下上島那段坡，¥360／人。",
        impact: { travellerId: "kai", because: "預算 +¥720（兩人份）" },
        satisfactionDelta: { kai: -3, ting: 5 },
        effect: {
          type: "mode",
          stopIds: ["d2b-s4"],
          to: "bus",
          extraCostJpy: 720,
        },
      },
      {
        id: "drop-enoshima",
        label: "砍掉江之島，提早去會合",
        detail: "兩人提早到東京車站，可以先逛車站商場再吃飯。",
        impact: { travellerId: "yu", because: "江之島是她今天最想去的一站" },
        satisfactionDelta: { yu: -10, ting: 6 },
        effect: { type: "drop", stopId: "d2b-s4" },
      },
    ],
  },
];
