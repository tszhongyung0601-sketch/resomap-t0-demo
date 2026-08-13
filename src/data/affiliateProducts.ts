import type { AffiliateProduct, ProductCategory } from "../types";

/**
 * Bookable things, with what each platform indicatively charges for the same
 * thing — the data behind the comparison screen.
 *
 * Two rules hold for every row here:
 *
 *  1. A product carrying a `poiId` may only point at a POI that is
 *     `ticketed: true`. Selling admission to a free park is the single defect
 *     this file exists to prevent. Products without a `poiId` — day tours,
 *     walking tours, rafting — are the operator's own product, not admission
 *     to a place, so they legitimately have nowhere to point.
 *  2. Every figure is an indicative market price, never a live quote, and the
 *     small spread between platforms is what it looks like in reality: a few
 *     percent, not a manufactured 40% saving.
 *
 * ResoMap has no agreement with any platform named here.
 */
export const PRODUCTS: AffiliateProduct[] = [
  /* --------------------------------------------------------------- 台北 */
  {
    id: "pr-taipei-101",
    name: "台北101 觀景台",
    blurb: "售票和入口在購物中心 5 樓，日落前一小時排最久，上去等天黑可以一次看到日景和夜景。",
    category: "attraction",
    destId: "taipei",
    poiId: "taipei-101",
    emoji: "🏢",
    tint: "#E4E9F2",
    offers: [
      { partner: "klook", priceTwd: 560 },
      { partner: "kkday", priceTwd: 580 },
      { partner: "tripcom", priceTwd: 600 },
    ],
    popular: true,
  },
  {
    id: "pr-npm",
    name: "國立故宮博物院",
    blurb: "一張參觀券就通看常設展和當期特展，不用另外買特展票；名件會輪展也可能外借，訂票前先查官網當期展件。",
    category: "exhibition",
    destId: "taipei",
    poiId: "npm",
    emoji: "🏺",
    tint: "#E4EDE6",
    offers: [
      { partner: "klook", priceTwd: 320 },
      { partner: "kkday", priceTwd: 335 },
    ],
  },
  {
    id: "pr-taipei-zoo",
    name: "台北市立動物園",
    blurb: "電子票入園免排隊，最後入園是下午四點，貓纜動物園站出來走三分鐘就到。",
    category: "attraction",
    destId: "taipei",
    emoji: "🦁",
    tint: "#E7EFE2",
    offers: [
      { partner: "klook", priceTwd: 100 },
      { partner: "kkday", priceTwd: 105 },
    ],
  },
  {
    id: "pr-maokong",
    name: "貓空纜車 一日票",
    blurb: "一日票可無限次搭乘，來回一趟就比買兩張單次票划算；每週一固定維修停駛（遇國定假日順延），水晶車廂每趟要另加 50 元、也要排另一條隊。",
    category: "attraction",
    destId: "taipei",
    poiId: "maokong",
    emoji: "🚡",
    tint: "#E3EDE1",
    offers: [
      { partner: "klook", priceTwd: 300 },
      { partner: "kkday", priceTwd: 310 },
    ],
  },

  /* --------------------------------------------------------------- 新北 */
  {
    id: "pr-jiufen-daytour",
    name: "九份一日遊",
    blurb: "台北市區上下車、含九份與金瓜石，多數團在燈籠亮起前就回程，想拍夜景要挑有加停留的場次。",
    category: "daytour",
    destId: "newtaipei",
    emoji: "🏮",
    tint: "#F2E1D0",
    offers: [
      { partner: "klook", priceTwd: 1280 },
      { partner: "kkday", priceTwd: 1320 },
    ],
  },
  {
    id: "pr-north-coast-daytour",
    name: "野柳＋九份＋十分一日遊",
    blurb: "車資與導遊含在內，野柳門票和天燈多半要現場自費，出發前先確認方案裡有沒有含。",
    category: "daytour",
    destId: "newtaipei",
    emoji: "🚌",
    tint: "#E3EAEF",
    offers: [
      { partner: "klook", priceTwd: 1180 },
      { partner: "kkday", priceTwd: 1250 },
      { partner: "tripcom", priceTwd: 1290 },
    ],
    popular: true,
  },
  {
    id: "pr-fort-domingo",
    name: "淡水紅毛城",
    blurb: "一張票同時可進小白宮和滬尾礮臺，三處都在淡水，館舍每月第一個星期一休館。",
    category: "attraction",
    destId: "newtaipei",
    poiId: "fort-domingo",
    emoji: "🏰",
    tint: "#F0DFD9",
    offers: [
      { partner: "klook", priceTwd: 80 },
      { partner: "kkday", priceTwd: 85 },
    ],
  },

  /* --------------------------------------------------------------- 台中 */
  {
    id: "pr-gaomei-shuttle",
    name: "高美濕地日落接駁",
    blurb: "台中車站發車、傍晚往返，木棧道要退潮才走得到水邊，訂前先對一下當天的潮汐時間。",
    category: "daytour",
    destId: "taichung",
    emoji: "🌅",
    tint: "#E1EBEE",
    offers: [
      { partner: "klook", priceTwd: 450 },
      { partner: "kkday", priceTwd: 470 },
    ],
  },

  /* --------------------------------------------------------------- 台南 */
  {
    id: "pr-chimei",
    name: "奇美博物館",
    blurb: "常設展不用預約、現場也買得到票，線上先買可以直接掃碼進場；每週三休館，光動物廳和樂器廳走完就要兩小時。",
    category: "exhibition",
    destId: "tainan",
    poiId: "chimei",
    emoji: "🏛️",
    tint: "#E6EAF2",
    offers: [
      { partner: "klook", priceTwd: 200 },
      { partner: "kkday", priceTwd: 210 },
    ],
    popular: true,
  },
  {
    id: "pr-chihkan",
    name: "赤崁樓",
    blurb: "現場買也是 70 元，線上票只是省掉窗口排隊；四點半後團客散掉，蓬壺書院前才拍得到空景。",
    category: "attraction",
    destId: "tainan",
    poiId: "chihkan",
    emoji: "🏯",
    tint: "#F3E3CE",
    offers: [
      { partner: "klook", priceTwd: 70 },
      { partner: "kkday", priceTwd: 75 },
    ],
  },
  {
    id: "pr-tainan-food-tour",
    name: "台南舊城區美食導覽",
    blurb: "三小時、六到八個攤，費用已含試吃，多數場次從中西區出發、下午一點前結束。",
    category: "experience",
    destId: "tainan",
    emoji: "🍜",
    tint: "#F7E6D2",
    offers: [
      { partner: "klook", priceTwd: 1250 },
      { partner: "kkday", priceTwd: 1280 },
    ],
  },
  {
    id: "pr-anping-fort",
    name: "安平古堡",
    blurb: "同一張票含旁邊的熱蘭遮博物館，白色瞭望塔一次站不到十個人，開門後先上去最省時間。",
    category: "attraction",
    destId: "tainan",
    poiId: "anping-fort",
    emoji: "🏰",
    tint: "#F0E6D6",
    offers: [
      { partner: "klook", priceTwd: 70 },
      { partner: "kkday", priceTwd: 75 },
    ],
  },

  /* --------------------------------------------------------------- 宜蘭 */
  {
    id: "pr-traditional-arts",
    name: "國立傳統藝術中心",
    blurb: "戲台與廟埕的表演有固定場次、已含在門票內，進門先看公告欄的當日節目表再排動線。",
    category: "attraction",
    destId: "yilan",
    poiId: "traditional-arts",
    emoji: "🎎",
    tint: "#EDE6DA",
    offers: [
      { partner: "klook", priceTwd: 130 },
      { partner: "kkday", priceTwd: 140 },
    ],
  },

  /* --------------------------------------------------------------- 花蓮 */
  {
    id: "pr-xiuguluan-rafting",
    name: "秀姑巒溪泛舟",
    blurb: "含裝備、保險與終點接駁，瑞穗到長虹橋全程約三到四小時且一定會濕，泛舟期通常只到十月底。",
    category: "experience",
    destId: "hualien",
    emoji: "🛶",
    tint: "#DCE9F0",
    offers: [
      { partner: "klook", priceTwd: 1180 },
      { partner: "kkday", priceTwd: 1240 },
    ],
  },
  {
    id: "pr-taroko-daytour",
    name: "太魯閣一日遊",
    blurb: "地震後園區仍分段管制，開放的步道每月都在變，出團前一天再跟業者確認當日走法。",
    category: "daytour",
    destId: "hualien",
    emoji: "🏞️",
    tint: "#E6EBE7",
    offers: [
      { partner: "klook", priceTwd: 1500 },
      { partner: "kkday", priceTwd: 1580 },
      { partner: "tripcom", priceTwd: 1620 },
    ],
    popular: true,
  },

  /* --------------------------------------------------------------- 東京 */
  {
    id: "pr-disney",
    name: "東京迪士尼樂園",
    blurb: "一日護照採浮動票價、日期一選就綁定，入園後第一件事是在官方 App 上處理熱門設施預約。",
    category: "themepark",
    destId: "tokyo",
    poiId: "disney",
    emoji: "🏰",
    tint: "#E7E1F6",
    offers: [
      { partner: "klook", priceTwd: 2150 },
      { partner: "kkday", priceTwd: 2210 },
      { partner: "tripcom", priceTwd: 2260 },
    ],
    popular: true,
  },
  {
    id: "pr-teamlab",
    name: "teamLab Planets",
    blurb: "指定入場時段、過了就不能改，全程赤腳涉水，穿捲得到膝蓋以上的褲子最好。",
    category: "experience",
    destId: "tokyo",
    poiId: "teamlab",
    emoji: "✨",
    tint: "#E3E1F7",
    offers: [
      { partner: "klook", priceTwd: 820 },
      { partner: "kkday", priceTwd: 850 },
    ],
  },
  {
    id: "pr-skytree",
    name: "東京晴空塔",
    blurb: "350 公尺天望甲板的指定日期票；450 公尺的天望迴廊要另外加購，現場買會多排一次隊。",
    category: "attraction",
    destId: "tokyo",
    poiId: "skytree",
    emoji: "🗼",
    tint: "#DFE7F5",
    offers: [
      { partner: "klook", priceTwd: 540 },
      { partner: "kkday", priceTwd: 560 },
      { partner: "tripcom", priceTwd: 575 },
    ],
  },

  /* --------------------------------------------------------------- 大阪 */
  {
    id: "pr-usj",
    name: "日本環球影城",
    blurb: "門票不含任天堂世界的入區資格，人多的日子要另外抽整理券，進園後先在 App 上確認當天規則。",
    category: "themepark",
    destId: "osaka",
    poiId: "usj",
    emoji: "🎢",
    tint: "#E1E9F3",
    offers: [
      { partner: "klook", priceTwd: 2380 },
      { partner: "kkday", priceTwd: 2450 },
    ],
    popular: true,
  },
];

export const BY_PRODUCT: Record<string, AffiliateProduct> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);

export const productsForDest = (destId: string) => PRODUCTS.filter((p) => p.destId === destId);

export const productForPoi = (poiId: string) => PRODUCTS.find((p) => p.poiId === poiId);

/** Cheapest indicative offer, for the "NT$ X 起" line on a card. */
export const cheapest = (p: AffiliateProduct) =>
  p.offers.reduce((low, o) => (o.priceTwd < low.priceTwd ? o : low), p.offers[0]);

export const productsByCategory = (category: ProductCategory) =>
  PRODUCTS.filter((p) => p.category === category);
