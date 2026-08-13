import type { CommerceItem } from "../types";

/**
 * Every item sits at a point in the trip where a real friction exists. The
 * `reason` field is the test: if it reads like a pitch rather than a problem
 * the traveller already has, the card does not belong there.
 */
export const COMMERCE: CommerceItem[] = [
  {
    id: "nrt-transfer",
    kind: "transfer",
    title: "成田機場 → 淺草 專車接送",
    provider: "KKday",
    price: 5200,
    currency: "JPY",
    unit: "group",
    rate: 0.1,
    reason: "四人加行李轉三趟電車很吃力，落地直接到飯店門口",
  },
  {
    id: "kimono",
    kind: "experience",
    title: "淺草和服體驗（含髮型・半日）",
    provider: "KLOOK",
    price: 3500,
    currency: "JPY",
    unit: "person",
    rate: 0.12,
    reason: "雷門前排隊拍照的人多半穿和服，現場租當日常常已滿",
  },
  {
    id: "ueno-zoo",
    kind: "ticket",
    title: "上野動物園 入園券",
    provider: "KLOOK",
    price: 600,
    currency: "JPY",
    unit: "person",
    rate: 0.05,
    reason: "現場售票口假日排隊約 20 分鐘",
  },
  {
    id: "disney-1day",
    kind: "ticket",
    title: "東京迪士尼樂園 一日護照",
    provider: "KLOOK",
    price: 9400,
    currency: "JPY",
    unit: "person",
    rate: 0.05,
    reason: "官網當日券常售罄，先訂才進得去，也才排得到第一輪",
  },
  {
    id: "luggage",
    kind: "service",
    title: "東京車站 行李寄放（大型）",
    provider: "KKday",
    price: 800,
    currency: "JPY",
    unit: "person",
    cpa: 120,
    reason: "分頭行動這天兩邊路線不同，行李帶著會拖慢兩邊",
  },
  {
    id: "enoden",
    kind: "transport",
    title: "江之電 一日乘車券",
    provider: "KKday",
    price: 800,
    currency: "JPY",
    unit: "person",
    rate: 0.08,
    reason: "鎌倉到江之島要上下車四次，單程買比一日券貴",
  },
  {
    id: "kotokuin",
    kind: "ticket",
    title: "高德院（鎌倉大佛）拜觀券",
    provider: "KLOOK",
    price: 300,
    currency: "JPY",
    unit: "person",
    rate: 0.05,
    reason: "含大佛內部參觀，現場另外投幣排隊",
  },
  {
    id: "shibuya-sky",
    kind: "ticket",
    title: "SHIBUYA SKY 展望台",
    provider: "KLOOK",
    price: 2500,
    currency: "JPY",
    unit: "person",
    rate: 0.06,
    reason: "日落時段最搶手，現場買通常只剩深夜場",
  },
  {
    id: "nex",
    kind: "transport",
    title: "成田特快 N'EX 來回票",
    provider: "KKday",
    price: 5000,
    currency: "JPY",
    unit: "person",
    rate: 0.07,
    reason: "回程拖行李，比轉京成快線少換一次車",
  },
  {
    id: "esim",
    kind: "esim",
    title: "日本 eSIM 8 天吃到飽",
    provider: "KKday",
    price: 1180,
    currency: "JPY",
    unit: "person",
    rate: 0.15,
    reason: "分頭行動當天兩組人要各自導航與聯絡",
  },
  {
    id: "hotel-asakusa",
    kind: "lodging",
    title: "淺草 APA 飯店 · 4 人 2 房 2 晚",
    provider: "Agoda",
    price: 7400,
    currency: "TWD",
    unit: "night",
    rate: 0.04,
    reason: "壓在阿凱的每晚 NT$2,000 上限內，且步行 3 分到淺草站",
  },
];

export const COMMERCE_BY_ID: Record<string, CommerceItem> = Object.fromEntries(
  COMMERCE.map((c) => [c.id, c]),
);

/** Commission in the item's own currency, for the ops screen. */
export function commissionOf(item: CommerceItem, party: number): number {
  const qty = item.unit === "group" || item.unit === "night" ? 1 : party;
  if (item.cpa) return item.cpa * qty;
  return Math.round(item.price * qty * (item.rate ?? 0));
}
