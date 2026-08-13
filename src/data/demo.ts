/**
 * All demo data lives here. One file, so changing the story never means hunting
 * through components — and so it is obvious at a glance that nothing is real.
 */
import type {
  Adapt,
  Deal,
  Spot,
  Traveller,
  TravellerId,
  Trip,
} from "../types";

/* ------------------------------------------------------------------ people */

export const TRAVELLERS: Traveller[] = [
  {
    id: "mickey",
    name: "Mickey",
    initial: "M",
    color: "#FF6210",
    likes: ["food", "photo", "shopping"],
  },
  {
    id: "amy",
    name: "Amy",
    initial: "A",
    color: "#2F6FED",
    likes: ["culture", "food"],
    note: "不喜歡樂園",
  },
  {
    id: "john",
    name: "John",
    initial: "J",
    color: "#0E9F6E",
    likes: ["themepark", "nightlife"],
  },
  {
    id: "susan",
    name: "Susan",
    initial: "S",
    color: "#9061F9",
    likes: ["nature", "photo"],
    note: "不想走太多路",
  },
];

export const BY_TRAVELLER: Record<TravellerId, Traveller> = Object.fromEntries(
  TRAVELLERS.map((t) => [t.id, t]),
) as Record<TravellerId, Traveller>;

/* ------------------------------------------------------------------- spots */

export const SPOTS: Spot[] = [
  {
    id: "sensoji",
    name: "淺草寺",
    area: "淺草",
    kind: "attraction",
    lat: 35.7148,
    lng: 139.7967,
    emoji: "⛩",
    tint: "#F3E3D3",
    about: "東京最古老的寺院，雷門前總是在排隊，往裡面走反而清靜。",
    story: {
      title: "淺草寺・江戶庶民與觀音信仰",
      minutes: 3,
      narrator: "在地導覽・王小樺",
      plays: 12480,
      likes: 934,
      body: [
        "淺草寺的創建傳說可以追溯到西元六二八年，是東京最古老的寺院。",
        "傳說兩位漁夫在隅田川撈起一尊觀音像，地方領主把自宅改成寺廟供奉，就是淺草寺的開始。",
        "你現在看到的本堂是一九五八年重建的，原本的建築在一九四五年的東京大空襲中燒毀。",
        "雷門那盞大燈籠底部有一條木雕的龍，多數人拍完照就走，很少人蹲下來看。",
      ].join("|"),
    },
  },
  {
    id: "nakamise",
    name: "仲見世通",
    area: "淺草",
    kind: "shopping",
    lat: 35.7118,
    lng: 139.7966,
    emoji: "🏮",
    tint: "#F6DEDE",
    about: "從江戶時代就在的參道，人形燒現烤的那攤在中段右手邊。",
  },
  {
    id: "skytree",
    name: "東京晴空塔",
    area: "押上",
    kind: "attraction",
    lat: 35.7101,
    lng: 139.8107,
    emoji: "🗼",
    tint: "#DFE7F5",
    about: "634 公尺，天氣好時看得到富士山。",
    indoor: true,
  },
  {
    id: "asakusa-dinner",
    name: "淺草 燒肉",
    area: "淺草",
    kind: "food",
    lat: 35.711,
    lng: 139.794,
    emoji: "🥩",
    tint: "#F4E2D8",
  },
  {
    id: "meiji",
    name: "明治神宮",
    area: "原宿",
    kind: "nature",
    lat: 35.6764,
    lng: 139.6993,
    emoji: "🌲",
    tint: "#DFEBE0",
    about: "整片森林是一九一五年人工種出來的，現在有近三千種生物。",
    story: {
      title: "明治神宮・一座種了一百年的人造森林",
      minutes: 3,
      narrator: "森林解說員・佐藤惠",
      plays: 8215,
      likes: 671,
      body: [
        "明治神宮創建於一九二〇年，供奉明治天皇與昭憲皇太后。",
        "你現在走過的這片森林不是原生林，是由全國捐贈的十萬棵樹人工種成的。",
        "設計者刻意選了會自然更替的樹種，目標是一百五十年後變成不需要人管理的森林。",
        "一百年過去，這片林子已經有將近三千種生物，比計畫還提早成熟。",
      ].join("|"),
    },
  },
  {
    id: "harajuku",
    name: "原宿 竹下通",
    area: "原宿",
    kind: "shopping",
    lat: 35.6716,
    lng: 139.7031,
    emoji: "🛍",
    tint: "#F7E3EE",
    about: "假日人潮密度極高，適合快速逛過。",
  },
  {
    id: "shibuya",
    name: "澀谷十字路口",
    area: "澀谷",
    kind: "attraction",
    lat: 35.6595,
    lng: 139.7004,
    emoji: "🚦",
    tint: "#E2E6EF",
    about: "一次綠燈最多三千人同時通過。",
    story: {
      title: "澀谷十字路口・一次綠燈，三千人",
      minutes: 2,
      narrator: "ResoMap 編輯部",
      plays: 15302,
      likes: 1088,
      body: [
        "澀谷全向十字路口一次綠燈最多可以有三千人同時通過，尖峰一天約五十萬人次。",
        "它在一九七三年開始採用全向行人專用時相，四個方向的車全停，行人任意穿越。",
        "路口旁的忠犬八公銅像是一九四八年重鑄的第二代，初代在戰時被熔掉了。",
      ].join("|"),
    },
  },
  {
    id: "shibuya-dinner",
    name: "澀谷 居酒屋",
    area: "澀谷",
    kind: "food",
    lat: 35.6605,
    lng: 139.6985,
    emoji: "🍶",
    tint: "#F1E6D9",
  },
  {
    id: "disney",
    name: "東京迪士尼樂園",
    area: "舞濱",
    kind: "attraction",
    lat: 35.6329,
    lng: 139.8804,
    emoji: "🏰",
    tint: "#E7E1F6",
    about: "開園前 30 分到門口，第一輪才排得到。",
  },
  {
    id: "tsukiji",
    name: "築地場外市場",
    area: "築地",
    kind: "food",
    lat: 35.6654,
    lng: 139.7707,
    emoji: "🍣",
    tint: "#E4EFE6",
    about: "上午十點前最熱鬧，多數店家下午就收了。",
  },
  {
    id: "ginza",
    name: "銀座",
    area: "銀座",
    kind: "shopping",
    lat: 35.6717,
    lng: 139.765,
    emoji: "🛍",
    tint: "#EDE7DE",
    about: "週末中央通會封街變成步行者天國。",
    indoor: true,
  },
  {
    id: "kagari",
    name: "銀座 篝 拉麵",
    area: "銀座",
    kind: "food",
    lat: 35.6707,
    lng: 139.7639,
    emoji: "🍜",
    tint: "#F3E7D5",
    about: "雞白湯，開店前就要排。",
  },
  {
    id: "shinjuku",
    name: "新宿",
    area: "新宿",
    kind: "food",
    lat: 35.6896,
    lng: 139.7006,
    emoji: "🌃",
    tint: "#E4E4EC",
  },
  {
    id: "ueno",
    name: "上野公園",
    area: "上野",
    kind: "nature",
    lat: 35.7156,
    lng: 139.7745,
    emoji: "🌳",
    tint: "#E2EDDC",
    about: "日本最早的公園之一，從公園口進去最平坦。",
    story: {
      title: "上野公園・公園底下的舊幕府",
      minutes: 3,
      narrator: "歷史作家・陳彥廷",
      plays: 5140,
      likes: 402,
      body: [
        "上野公園在一八七三年成為日本最早的公園之一，在那之前這裡是寬永寺的寺地。",
        "一八六八年的上野戰爭在這裡打完，舊幕府軍的彰義隊潰敗，寺院大半燒毀。",
        "公園裡的西鄉隆盛銅像揭幕時，他的遺孀說「這不像我先生」，這句話流傳到現在。",
      ].join("|"),
    },
  },
  {
    id: "tnm",
    name: "東京國立博物館",
    area: "上野",
    kind: "attraction",
    lat: 35.7188,
    lng: 139.7766,
    emoji: "🏛",
    tint: "#EAE3D8",
    about: "日本最大的博物館，全室內，雨天首選。",
    indoor: true,
  },
  {
    id: "ameyoko",
    name: "阿美橫町",
    area: "上野",
    kind: "shopping",
    lat: 35.708,
    lng: 139.7745,
    emoji: "🏪",
    tint: "#F2E6D6",
  },
  {
    id: "teamlab",
    name: "teamLab Planets",
    area: "豐洲",
    kind: "attraction",
    lat: 35.6497,
    lng: 139.79,
    emoji: "✨",
    tint: "#E3E1F7",
    about: "赤腳走進水裡的沉浸式展場，全室內。",
    indoor: true,
  },
  {
    id: "narita",
    name: "成田機場",
    area: "成田",
    kind: "transit",
    lat: 35.772,
    lng: 140.3929,
    emoji: "✈️",
    tint: "#E6E9EE",
  },
  {
    id: "hotel",
    name: "新宿 飯店",
    area: "新宿",
    kind: "transit",
    lat: 35.692,
    lng: 139.703,
    emoji: "🏨",
    tint: "#EDEDED",
  },
];

export const BY_SPOT: Record<string, Spot> = Object.fromEntries(
  SPOTS.map((s) => [s.id, s]),
);

export const spot = (id: string): Spot => BY_SPOT[id];

/* ---------------------------------------------------------------- the trip */

export const TRIP: Trip = {
  title: "東京",
  city: "東京",
  dates: "8/20 - 8/24",
  nights: 4,
  phase: "planning",
  today: 2,
  days: [
    {
      n: 1,
      date: "8 月 20 日",
      weekday: "星期四",
      tracks: [
        {
          id: "d1",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "d1a", spotId: "sensoji", at: "14:00", stayMin: 60 },
            {
              id: "d1b",
              spotId: "nakamise",
              at: "15:10",
              stayMin: 40,
              from: { mode: "walk", min: 6, metres: 350 },
            },
            {
              id: "d1c",
              spotId: "skytree",
              at: "16:20",
              stayMin: 80,
              from: { mode: "train", min: 12, metres: 2100 },
            },
            {
              id: "d1d",
              spotId: "asakusa-dinner",
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
          id: "d2",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "d2a", spotId: "meiji", at: "09:30", stayMin: 60 },
            {
              id: "d2b",
              spotId: "harajuku",
              at: "10:45",
              stayMin: 70,
              from: { mode: "walk", min: 10, metres: 800 },
            },
            {
              id: "d2c",
              spotId: "kagari",
              at: "12:30",
              stayMin: 60,
              meal: "lunch",
              from: { mode: "train", min: 15, metres: 4200 },
            },
            {
              id: "d2d",
              spotId: "ginza",
              at: "13:45",
              stayMin: 100,
              from: { mode: "walk", min: 5, metres: 300 },
            },
            {
              id: "d2e",
              spotId: "shibuya",
              at: "16:00",
              stayMin: 60,
              from: { mode: "train", min: 18, metres: 6800 },
            },
            {
              id: "d2f",
              spotId: "shibuya-dinner",
              at: "18:30",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "walk", min: 8, metres: 500 },
            },
          ],
        },
      ],
    },
    {
      n: 3,
      date: "8 月 22 日",
      weekday: "星期六",
      meetUp: { spotId: "shinjuku", at: "18:30" },
      tracks: [
        {
          id: "d3a",
          label: "Mickey ＋ John",
          who: ["mickey", "john"],
          stops: [{ id: "d3a1", spotId: "disney", at: "09:00", stayMin: 510 }],
        },
        {
          id: "d3b",
          label: "Amy ＋ Susan",
          who: ["amy", "susan"],
          stops: [
            { id: "d3b1", spotId: "tsukiji", at: "09:30", stayMin: 90 },
            {
              id: "d3b2",
              spotId: "ginza",
              at: "11:30",
              stayMin: 150,
              from: { mode: "walk", min: 14, metres: 1100 },
            },
          ],
        },
        {
          id: "d3c",
          label: "會合",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "d3c1", spotId: "shinjuku", at: "18:30", stayMin: 100, meal: "dinner" },
          ],
        },
      ],
    },
    {
      n: 4,
      date: "8 月 23 日",
      weekday: "星期日",
      tracks: [
        {
          id: "d4",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "d4a", spotId: "ueno", at: "10:30", stayMin: 70 },
            {
              id: "d4b",
              spotId: "ameyoko",
              at: "12:00",
              stayMin: 80,
              from: { mode: "walk", min: 9, metres: 650 },
            },
            {
              id: "d4c",
              spotId: "teamlab",
              at: "14:30",
              stayMin: 120,
              from: { mode: "train", min: 26, metres: 9200 },
            },
            {
              id: "d4d",
              spotId: "shinjuku",
              at: "18:30",
              stayMin: 90,
              meal: "dinner",
              from: { mode: "train", min: 34, metres: 12000 },
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
          id: "d5",
          who: ["mickey", "amy", "john", "susan"],
          stops: [
            { id: "d5a", spotId: "ginza", at: "10:30", stayMin: 90 },
            {
              id: "d5b",
              spotId: "narita",
              at: "14:00",
              stayMin: 0,
              from: { mode: "train", min: 70, metres: 66000 },
            },
          ],
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------- consensus */

/** What the group already agrees on — stated as things, not percentages. */
export const AGREED: { label: string; who: TravellerId[] }[] = [
  { label: "美食", who: ["mickey", "amy", "john", "susan"] },
  { label: "城市散步", who: ["mickey", "amy", "susan"] },
  { label: "拍照", who: ["mickey", "susan"] },
];

export const CONFLICT = {
  topic: "迪士尼",
  wants: ["mickey", "john"] as TravellerId[],
  against: ["amy"] as TravellerId[],
  againstReason: "不喜歡樂園",
  suggestion: {
    day: 3,
    groups: [
      { who: ["mickey", "john"] as TravellerId[], where: "東京迪士尼" },
      { who: ["amy", "susan"] as TravellerId[], where: "築地 ＋ 銀座" },
    ],
    meet: { at: "18:30", where: "新宿集合吃晚餐" },
  },
  alternatives: [
    {
      id: "half",
      label: "全員迪士尼半天",
      why: "四個人整天在一起，但熱門設施排不到，Amy 還是得進樂園。",
    },
    {
      id: "skip",
      label: "這次不去迪士尼",
      why: "行程最單純，但 Mickey 和 John 這趟最想去的就是這個。",
    },
  ],
};

/* ----------------------------------------------------------------- adapt */

export const ADAPTS: Adapt[] = [
  {
    id: "late",
    day: 2,
    icon: "🕘",
    headline: "行程有點延後",
    /* The delay and its knock-on time are both rendered from `delayMin`, so
       this only has to say what was noticed. */
    consequence: "你們還在明治神宮。",
    choices: ["保留全部景點", "少走一個景點", "延後晚餐"],
    cta: "幫我重新安排",
    delayMin: 90,
    plan: {
      drop: ["d2b"],
      keeps: ["明治神宮", "銀座", "澀谷", "晚餐訂位"],
    },
  },
  {
    id: "rain",
    day: 4,
    icon: "🌧",
    headline: "下午可能下雨",
    consequence: "上野公園是戶外行程，15:00 之後降雨機率 70%。",
    choices: ["照原計畫", "換成室內", "提早去下一站"],
    cta: "換成室內行程",
    plan: {
      drop: [],
      swap: { d4a: "tnm" },
      keeps: ["晚餐訂位不受影響"],
    },
  },
];

export const BY_ADAPT: Record<string, Adapt> = Object.fromEntries(
  ADAPTS.map((a) => [a.id, a]),
);

/* ----------------------------------------------------------------- deals */

export const DEALS: Deal[] = [
  {
    id: "disney-ticket",
    category: "ticket",
    title: "東京迪士尼樂園 一日護照",
    provider: "Klook",
    priceTwd: 2180,
    emoji: "🏰",
    tint: "#E7E1F6",
    spotId: "disney",
  },
  {
    id: "teamlab-ticket",
    category: "ticket",
    title: "teamLab Planets TOKYO",
    provider: "Klook",
    priceTwd: 890,
    emoji: "✨",
    tint: "#E3E1F7",
    spotId: "teamlab",
  },
  {
    id: "skytree-ticket",
    category: "ticket",
    title: "東京晴空塔 展望台",
    provider: "KKday",
    priceTwd: 620,
    emoji: "🗼",
    tint: "#DFE7F5",
    spotId: "skytree",
  },
  {
    id: "shinjuku-hotel",
    category: "stay",
    title: "新宿商務飯店 · 4 人 2 房",
    provider: "Agoda",
    priceTwd: 3700,
    emoji: "🛏",
    tint: "#EDEDED",
  },
  {
    id: "nex",
    category: "transport",
    title: "成田特快 N'EX 來回票",
    provider: "KKday",
    priceTwd: 1080,
    emoji: "🚄",
    tint: "#E2E8F0",
    spotId: "narita",
  },
  {
    id: "suica",
    category: "transport",
    title: "Welcome Suica 交通卡",
    provider: "Klook",
    priceTwd: 480,
    emoji: "💳",
    tint: "#E6EEF6",
  },
  {
    id: "esim",
    category: "esim",
    title: "日本 eSIM 8 天吃到飽",
    provider: "KKday",
    priceTwd: 320,
    emoji: "📶",
    tint: "#E9E9E9",
  },
  {
    id: "car",
    category: "car",
    title: "日本租車 · 含中文導航",
    provider: "Klook",
    priceTwd: 1450,
    emoji: "🚗",
    tint: "#E7EDE7",
  },
];

/* --------------------------------------------------------------- explore */

export const DESTINATIONS = [
  { id: "tokyo", name: "東京", sub: "35 個行程", emoji: "🗼", tint: "#E7EDF7" },
  { id: "osaka", name: "大阪", sub: "22 個行程", emoji: "🏯", tint: "#F6E6DC" },
  { id: "kyoto", name: "京都", sub: "28 個行程", emoji: "⛩", tint: "#EFE3E3" },
  { id: "tainan", name: "台南", sub: "17 個行程", emoji: "🏮", tint: "#F3EBD9" },
  { id: "hualien", name: "花蓮", sub: "12 個行程", emoji: "🏞", tint: "#E1EDE4" },
];

export const IDEAS = [
  { id: "tokyo-food", title: "東京美食散步", sub: "3 天 · 12 個點", emoji: "🍜", tint: "#F4E7D8" },
  { id: "kyoto-autumn", title: "京都賞楓", sub: "4 天 · 秋季限定", emoji: "🍁", tint: "#F6E1DA" },
  { id: "tainan-old", title: "台南老城故事", sub: "2 天 · 有語音導覽", emoji: "🏛", tint: "#EFE8D8" },
  { id: "north-coast", title: "北海岸一日遊", sub: "1 天 · 開車", emoji: "🌊", tint: "#DFEAF2" },
];

/** Deliberately short: five is enough to feel alive, more is a wall. */
export const NEARBY = ["sensoji", "nakamise", "skytree", "ueno", "ameyoko"];
