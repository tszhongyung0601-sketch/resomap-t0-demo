/**
 * ResoMap T0 — a travel app whose AI lives inside the journey.
 *
 * The model is deliberately small. Anything that only a dashboard would need
 * (scores, conflict counts, funnel metrics) is not part of the domain: it can
 * be derived where it is genuinely useful, and stays off the screens the
 * traveller uses every day.
 */

/* ------------------------------------------------------------------ people */

export type TravellerId = "mickey" | "amy" | "john" | "susan";

export interface Traveller {
  id: TravellerId;
  name: string;
  initial: string;
  color: string;
  /** The two or three things this person cares about, in their own words. */
  likes: InterestId[];
  /** One plain-language constraint, shown only where it matters. */
  note?: string;
}

export type InterestId =
  | "food"
  | "shopping"
  | "culture"
  | "photo"
  | "nature"
  | "themepark"
  | "nightlife";

export const INTEREST_LABELS: Record<InterestId, string> = {
  food: "美食",
  shopping: "購物",
  culture: "文化",
  photo: "拍照",
  nature: "自然",
  themepark: "樂園",
  nightlife: "夜生活",
};

/* ------------------------------------------------------------------- spots */

export type SpotKind = "attraction" | "food" | "shopping" | "nature" | "transit";

export const SPOT_KIND_LABELS: Record<SpotKind, string> = {
  attraction: "景點",
  food: "美食",
  shopping: "購物",
  nature: "自然",
  transit: "交通",
};

export interface VoiceStory {
  title: string;
  /** Minutes, for the "3 分鐘" label. */
  minutes: number;
  /** Split on "|": one utterance per sentence keeps the progress bar honest. */
  body: string;
  /** Who recorded it. ResoMap's guides are made by people, and it says so. */
  narrator: string;
  plays: number;
  likes: number;
}

export interface Spot {
  id: string;
  name: string;
  area: string;
  kind: SpotKind;
  lat: number;
  lng: number;
  /** Stands in for a photo. Kept as a gradient + emoji so nothing has to load. */
  emoji: string;
  tint: string;
  /** One line, only shown on the detail screen. */
  about?: string;
  indoor?: boolean;
  story?: VoiceStory;
}

/* --------------------------------------------------------------- itinerary */

export type LegMode = "walk" | "train" | "taxi";

export const LEG_LABEL: Record<LegMode, string> = {
  walk: "步行",
  train: "電車",
  taxi: "計程車",
};

export interface Stop {
  id: string;
  spotId: string;
  at: string; // "HH:MM"
  stayMin: number;
  /** Meal stops read differently in the timeline. */
  meal?: "lunch" | "dinner";
  /** Travel in from the previous stop. */
  from?: { mode: LegMode; min: number; metres: number };
  /** Set when an in-trip adjustment touched this stop. */
  changed?: string;
  /** Only used on the split day. */
  group?: TravellerId[];
}

export interface Day {
  n: number;
  date: string; // "8 月 21 日"
  weekday: string;
  /** One shared track, or two parallel tracks that meet again. */
  tracks: Track[];
  meetUp?: { spotId: string; at: string };
}

export interface Track {
  id: string;
  label?: string;
  who: TravellerId[];
  stops: Stop[];
}

export type TripPhase = "planning" | "ongoing";

export interface Trip {
  title: string;
  city: string;
  dates: string;
  nights: number;
  phase: TripPhase;
  /** Which day the traveller is on when the trip is ongoing. */
  today: number;
  days: Day[];
}

/* ---------------------------------------------------------------- commerce */

export type DealCategory = "stay" | "ticket" | "transport" | "car" | "esim";

export const DEAL_CATEGORY_LABELS: Record<DealCategory, string> = {
  stay: "住宿",
  ticket: "門票",
  transport: "交通",
  car: "租車",
  esim: "eSIM",
};

export interface Deal {
  id: string;
  category: DealCategory;
  title: string;
  provider: "Klook" | "KKday" | "Agoda";
  priceTwd: number;
  emoji: string;
  tint: string;
  /** Spot this deal belongs to, so it can surface in context and nowhere else. */
  spotId?: string;
}

/* ------------------------------------------------------------------ adapt */

export type AdaptId = "late" | "rain";

export interface AdaptPlan {
  /** Stops removed by this plan. */
  drop: string[];
  /** Stop id -> replacement spot id. */
  swap?: Record<string, string>;
  /** What survives, in the traveller's words. */
  keeps: string[];
}

export interface Adapt {
  id: AdaptId;
  day: number;
  icon: string;
  /** The observation, in one short sentence. */
  headline: string;
  /** What happens if nothing changes. */
  consequence: string;
  /** The options offered before the AI proposes anything. */
  choices: string[];
  /** Minutes behind schedule; drives both the warning and the new times. */
  delayMin?: number;
  /** What "幫我重新安排" produces. */
  plan: AdaptPlan;
  cta: string;
}

/* ------------------------------------------------------------------ events */

export type EventName =
  | "trip_created"
  | "travellers_invited"
  | "consensus_view"
  | "consensus_accept"
  | "day_view"
  | "adapt_shown"
  | "adapt_applied"
  | "arrival_shown"
  | "story_play"
  | "story_finish"
  | "deal_view"
  | "deal_click";
