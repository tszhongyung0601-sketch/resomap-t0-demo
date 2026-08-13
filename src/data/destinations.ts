import type { Destination, TravelRegion } from "../types";

/**
 * Taiwan first, global ready.
 *
 * Taiwan leads the home screen because that is where the first users and the
 * first merchant relationships are. The overseas cities are the same shape of
 * record, in the same list, so nothing about the architecture has to change
 * when the second market opens — only the ordering does.
 *
 * `angle` marks the four cities with a scripted scenario. Each shows one
 * ResoMap capability properly rather than all four badly.
 */
export const DESTINATIONS: Destination[] = [
  {
    id: "taipei",
    name: "台北",
    country: "tw",
    tagline: "捷運到得了的城市散步",
    emoji: "🏙️",
    tint: "#E3E9F3",
    lat: 25.0375,
    lng: 121.5637,
    zoom: 13,
    angle: "city",
  },
  {
    id: "newtaipei",
    name: "新北",
    country: "tw",
    tagline: "山、海與老街，都在一小時內",
    emoji: "⛰️",
    tint: "#E2EDE4",
    lat: 25.0128,
    lng: 121.4657,
    zoom: 11,
  },
  {
    id: "taichung",
    name: "台中",
    country: "tw",
    tagline: "設計、綠園道與海線日落",
    emoji: "🎭",
    tint: "#F3E7DC",
    lat: 24.1477,
    lng: 120.6736,
    zoom: 12,
  },
  {
    id: "tainan",
    name: "台南",
    country: "tw",
    tagline: "古城、美食與巷弄故事",
    emoji: "🏯",
    tint: "#F5E6D3",
    lat: 22.9931,
    lng: 120.2027,
    zoom: 14,
    angle: "story",
  },
  {
    id: "kaohsiung",
    name: "高雄",
    country: "tw",
    tagline: "港口、藝術與渡輪的黃昏",
    emoji: "🚢",
    tint: "#DEEAF0",
    lat: 22.6273,
    lng: 120.3014,
    zoom: 12,
  },
  {
    id: "yilan",
    name: "宜蘭",
    country: "tw",
    tagline: "溫泉、夜市與雨後的稻田",
    emoji: "♨️",
    tint: "#E6EFE9",
    lat: 24.7021,
    lng: 121.7378,
    zoom: 11,
  },
  {
    id: "hualien",
    name: "花蓮",
    country: "tw",
    tagline: "太平洋、峽谷與說變就變的天氣",
    emoji: "🌊",
    tint: "#DCEAEF",
    lat: 23.9871,
    lng: 121.6015,
    zoom: 12,
    angle: "weather",
  },
  {
    id: "taitung",
    name: "台東",
    country: "tw",
    tagline: "縱谷、海岸線與慢下來的理由",
    emoji: "🌾",
    tint: "#EFEBD8",
    lat: 22.7583,
    lng: 121.1444,
    zoom: 11,
  },

  /* ------------------------------------------------------------ overseas */
  {
    id: "tokyo",
    name: "東京",
    country: "jp",
    tagline: "一個城市裝得下所有人的興趣",
    emoji: "🗼",
    tint: "#DFE7F5",
    lat: 35.6812,
    lng: 139.7671,
    zoom: 12,
    angle: "group",
  },
  {
    id: "osaka",
    name: "大阪",
    country: "jp",
    tagline: "吃到走不動的城市",
    emoji: "🏯",
    tint: "#F6E2DE",
    lat: 34.6937,
    lng: 135.5023,
    zoom: 12,
  },
  {
    id: "kyoto",
    name: "京都",
    country: "jp",
    tagline: "走在一千年的街廓裡",
    emoji: "⛩️",
    tint: "#EFE0E0",
    lat: 35.0116,
    lng: 135.7681,
    zoom: 12,
  },
  {
    id: "seoul",
    name: "首爾",
    country: "kr",
    tagline: "宮殿旁邊就是最新的店",
    emoji: "🏙️",
    tint: "#E7E3F3",
    lat: 37.5665,
    lng: 126.978,
    zoom: 12,
  },
];

export const BY_DEST: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.id, d]),
);

export const dest = (id: string): Destination | undefined => BY_DEST[id];

export const TW_DESTINATIONS = DESTINATIONS.filter((d) => d.country === "tw");
export const OVERSEAS_DESTINATIONS = DESTINATIONS.filter((d) => d.country !== "tw");

/**
 * Places people say they are going that are not cities. Left as a separate list
 * on purpose: "九份" is a destination in a traveller's head, but listing every
 * 行政區 under 新北 would bury it.
 */
export const REGIONS: TravelRegion[] = [
  {
    id: "jiufen",
    name: "九份",
    near: "新北",
    tagline: "山城、階梯與海的方向",
    emoji: "🏮",
    tint: "#F2E2D2",
    lat: 25.1097,
    lng: 121.8443,
    zoom: 15,
  },
  {
    id: "tamsui",
    name: "淡水",
    near: "新北",
    tagline: "河口的黃昏與老街",
    emoji: "🌅",
    tint: "#F5E7DB",
    lat: 25.1677,
    lng: 121.4406,
    zoom: 14,
  },
  {
    id: "northcoast",
    name: "北海岸",
    near: "新北",
    tagline: "野柳、白沙灣與一路向東",
    emoji: "🪨",
    tint: "#E2EAEF",
    lat: 25.2098,
    lng: 121.6897,
    zoom: 11,
  },
  {
    id: "sunmoonlake",
    name: "日月潭",
    near: "南投",
    tagline: "環湖、纜車與清晨的霧",
    emoji: "🛶",
    tint: "#DEEBEA",
    lat: 23.8569,
    lng: 120.9155,
    zoom: 13,
  },
  {
    id: "alishan",
    name: "阿里山",
    near: "嘉義",
    tagline: "小火車、神木與雲海",
    emoji: "🌲",
    tint: "#E1EBDF",
    lat: 23.5108,
    lng: 120.8032,
    zoom: 13,
  },
  {
    id: "kenting",
    name: "墾丁",
    near: "屏東",
    tagline: "南國的海與夜市",
    emoji: "🏖️",
    tint: "#F2EBD5",
    lat: 21.9478,
    lng: 120.7972,
    zoom: 13,
  },
  {
    id: "eastcoast",
    name: "東海岸",
    near: "台東",
    tagline: "台 11 線，一邊山一邊海",
    emoji: "🛣️",
    tint: "#E4EDEB",
    lat: 23.1152,
    lng: 121.4062,
    zoom: 10,
  },
];

export const BY_REGION: Record<string, TravelRegion> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);
