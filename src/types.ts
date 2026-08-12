export type Interest =
  | "history"
  | "food"
  | "photo"
  | "shopping"
  | "nature"
  | "family";

export const INTEREST_LABELS: Record<Interest, string> = {
  history: "歷史文化",
  food: "在地美食",
  photo: "攝影打卡",
  shopping: "伴手禮購物",
  nature: "自然風景",
  family: "親子友善",
};

export type Companion = "solo" | "couple" | "family" | "friends" | "elder";

export const COMPANION_LABELS: Record<Companion, string> = {
  solo: "單人",
  couple: "情侶",
  family: "家庭親子",
  friends: "朋友揪團",
  elder: "長輩同行",
};

export type Transport = "self-drive" | "public" | "charter" | "scooter";

export const TRANSPORT_LABELS: Record<Transport, string> = {
  "self-drive": "自駕",
  public: "大眾運輸",
  charter: "包車／接駁",
  scooter: "機車",
};

export type WalkTolerance = "easy" | "moderate" | "challenging";

export const WALK_LABELS: Record<WalkTolerance, string> = {
  easy: "輕鬆（僅老街平地）",
  moderate: "適中（可走階梯）",
  challenging: "挑戰（願意走登山步道）",
};

/** Difficulty ranking used to filter spots by the user's walk tolerance. */
export const WALK_RANK: Record<WalkTolerance, number> = {
  easy: 0,
  moderate: 1,
  challenging: 2,
};

export interface TripPlanInput {
  days: 1 | 2 | 3;
  arrivalTime: string; // "HH:MM", applies to day 1
  departureTime: string; // "HH:MM", applies to the last day
  transport: Transport;
  interests: Interest[];
  companion: Companion;
  walkTolerance: WalkTolerance;
}

export type SpotCategory = "attraction" | "food" | "souvenir" | "teahouse" | "nature";

export const CATEGORY_LABELS: Record<SpotCategory, string> = {
  attraction: "景點",
  food: "美食",
  souvenir: "伴手禮",
  teahouse: "茶樓",
  nature: "自然",
};

export interface VoiceGuide {
  durationLabel: string; // display only, e.g. "3 分鐘"
  script: string; // first-person narrative script read aloud via speech synthesis
}

export interface AttractionSpot {
  kind: "attraction";
  id: string;
  name: string;
  category: SpotCategory;
  lat: number;
  lng: number;
  stayMinutes: number;
  interests: Interest[];
  walkDifficulty: WalkTolerance;
  voiceGuide?: VoiceGuide;
  thumbnailEmoji: string; // lightweight stand-in for a photo in this demo
}

export type CommerceKind = "ticket" | "shuttle" | "daytour" | "merchant";

export const COMMERCE_KIND_LABELS: Record<CommerceKind, string> = {
  ticket: "景點門票",
  shuttle: "接駁車",
  daytour: "一日遊",
  merchant: "合作商家優惠",
};

export interface CommerceItem {
  kind: "commerce";
  id: string;
  commerceKind: CommerceKind;
  title: string;
  description: string;
  originalPrice?: number;
  price: number;
  externalUrl: string;
  isFallbackLink: boolean; // true when linking to a search/listing page rather than an exact product
  provider: "Klook" | "KKday";
  lat: number;
  lng: number;
  interests: Interest[];
  preferredSlot: "start" | "middle" | "end";
  stayMinutes: number; // treated as a stop like any other for scheduling purposes
  /** If this deal is for the same physical shop as an AttractionSpot, its id goes here
   *  so the generator doesn't schedule a free visit and a discount card for the same place
   *  on the same day. */
  pairedAttractionId?: string;
}

export type PoolItem = AttractionSpot | CommerceItem;

export interface ItineraryStop {
  stopId: string; // unique per placement (item id + index) so the same item could theoretically repeat across days
  item: PoolItem;
  arrivalTime: string; // "HH:MM" computed
}

export interface DayItinerary {
  day: number;
  stops: ItineraryStop[];
}

export interface Itinerary {
  input: TripPlanInput;
  days: DayItinerary[];
}
