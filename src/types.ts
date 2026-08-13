/**
 * ResoMap T0 — types for a *coordination* demo, not a scheduling one.
 *
 * The market-problem study is explicit that Information + Scheduling are already
 * solved by existing tools, and that what is missing is Decision + Coordination
 * + Execution. So the domain model here is built around travellers, their
 * constraints, the conflicts between them, and what each person gave up — not
 * around "an itinerary that fell out of a generator".
 */

/* ------------------------------------------------------------------ people */

export type TravellerId = "che" | "yu" | "kai" | "ting";

export interface Traveller {
  id: TravellerId;
  name: string;
  initial: string;
  /** Each traveller owns one colour, used consistently everywhere: preference
   *  cards, stop-ownership dots, map routes, satisfaction rings. */
  color: string;
  colorSoft: string;
  blurb: string;
}

export type InterestId =
  | "history"
  | "food"
  | "shopping"
  | "themepark"
  | "nature"
  | "cafe"
  | "photo"
  | "budget";

export const INTEREST_LABELS: Record<InterestId, string> = {
  history: "歷史文化",
  food: "吃吃喝喝",
  shopping: "購物",
  themepark: "樂園",
  nature: "自然",
  cafe: "咖啡",
  photo: "攝影",
  budget: "小資輕旅",
};

export const INTEREST_EMOJI: Record<InterestId, string> = {
  history: "⛩",
  food: "🍜",
  shopping: "🛍",
  themepark: "🎡",
  nature: "🌿",
  cafe: "☕",
  photo: "📷",
  budget: "🪙",
};

export type WalkCap = "low" | "mid" | "free";

export const WALK_CAP_LABELS: Record<WalkCap, string> = {
  low: "≤ 3km",
  mid: "3–6km",
  free: "不設限",
};

/** Metres per day implied by each cap; used to detect who is over their limit. */
export const WALK_CAP_METRES: Record<WalkCap, number> = {
  low: 3000,
  mid: 6000,
  free: 99000,
};

export type TransportPref = "cheap" | "fast" | "less-walk";

export const TRANSPORT_PREF_LABELS: Record<TransportPref, string> = {
  cheap: "省錢優先",
  fast: "省時優先",
  "less-walk": "少走路優先",
};

export interface Preference {
  travellerId: TravellerId;
  /** JPY per night per person. */
  lodgingCap: number;
  /** JPY per day per person, excluding lodging. */
  dailyCap: number;
  /** Spot ids. Marked 🔒 in the UI — the coordinator never drops these. */
  mustGo: string[];
  /** Spot ids the traveller refuses. */
  wontGo: string[];
  interests: InterestId[];
  walkCap: WalkCap;
  /** "HH:MM" — earliest this person will leave the hotel. */
  earliestStart: string;
  transport: TransportPref;
  submitted: boolean;
}

/* -------------------------------------------------------------- conflicts */

export interface Conflict {
  id: string;
  /** Short label used in the coordination stream and the counter chip. */
  title: string;
  /** The sides, worded as the travellers themselves stated them. */
  sides: { travellerId: TravellerId; claim: string; locked?: boolean }[];
  /** Some conflicts the coordinator resolves without asking anyone. */
  resolvedSilently?: boolean;
  silentResolution?: string;
}

/** A conflict that needs a human-visible compromise gets one of these. */
export interface Tradeoff {
  id: string;
  conflictId: string;
  plans: TradeoffPlan[];
}

export interface TradeoffPlan {
  id: string;
  label: string;
  /** How the conflict is actually solved, in plain language. */
  resolution: string;
  /** Whose need this plan satisfies. */
  satisfies: { travellerId: TravellerId; because: string }[];
  /** What it costs and to whom. Never empty — somebody always gives something up. */
  costs: { travellerId: TravellerId | "all"; because: string }[];
  /** Per-traveller satisfaction, in points, when this plan is the active one. */
  satisfaction: Partial<Record<TravellerId, number>>;
}

/* -------------------------------------------------------------- itinerary */

export type SpotKind =
  | "attraction"
  | "food"
  | "shopping"
  | "themepark"
  | "nature"
  | "transit"
  | "hotel";

export const SPOT_KIND_LABELS: Record<SpotKind, string> = {
  attraction: "景點",
  food: "美食",
  shopping: "購物",
  themepark: "樂園",
  nature: "自然",
  transit: "交通",
  hotel: "住宿",
};

export interface VoiceScript {
  /** Shown on the language chip; always the language actually spoken. */
  lang: string;
  title: string;
  /** Split on "|" — one utterance per sentence, so the progress bar and the
   *  subtitle highlight cannot drift away from the audio. */
  body: string;
  creator: { name: string; initial: string; uploaded: string };
  plays: number;
  likes: number;
  /** Commerce item offered once the guide finishes. */
  ctaCommerceId?: string;
  comments: { name: string; initial: string; text: string }[];
}

export interface Spot {
  id: string;
  name: string;
  area: string;
  kind: SpotKind;
  lat: number;
  lng: number;
  /** Emoji stand-in for a photo — keeps the demo free of external assets. */
  emoji: string;
  /** One line in a traveller's terms, not brochure copy. */
  note: string;
  interests: InterestId[];
  voice?: VoiceScript;
}

export type LegMode = "walk" | "train" | "taxi" | "bus";

export const LEG_MODE_LABELS: Record<LegMode, string> = {
  walk: "步行",
  train: "電車",
  taxi: "計程車",
  bus: "巴士",
};

export const LEG_MODE_ICON: Record<LegMode, string> = {
  walk: "🚶",
  train: "🚃",
  taxi: "🚕",
  bus: "🚌",
};

export interface Stop {
  /** Unique per placement so dnd-kit can key it. */
  stopId: string;
  spotId: string;
  arrive: string; // "HH:MM"
  stayMin: number;
  /** Cost per person in JPY for this stop (entry, meal, …). */
  costJpy: number;
  /** Who this stop is here for. Empty = everyone wanted it. */
  forTravellers: TravellerId[];
  /** True when a traveller's 🔒 must-go put it here. */
  locked?: boolean;
  /** Travel in from the previous stop. Absent on a branch's first stop. */
  legFrom?: { mode: LegMode; minutes: number; metres: number; costJpy: number };
  /** Set when a mid-trip adaptation moved or changed this stop. */
  adaptedBy?: string;
  /** Commerce cards shown directly above this stop. */
  commerceIds?: string[];
}

/**
 * A day is either one shared track, or — when the coordinator decides the group
 * should split — two parallel branches that rejoin. No competitor does the
 * split, and it is the clearest possible proof that the AI coordinated rather
 * than merely scheduled.
 */
export interface DayPlan {
  day: number;
  date: string;
  weekday: string;
  departAt: string;
  branches: Branch[];
  /** Present when the day splits: where and when the group rejoins. */
  rejoin?: { spotId: string; at: string };
}

export interface Branch {
  id: string;
  /** Undefined for a shared track; set when the day is split. */
  label?: string;
  travellers: TravellerId[];
  stops: Stop[];
}

export interface Trip {
  destination: string;
  nights: number;
  lodging: { name: string; area: string; perNightTwd: number; note: string };
  days: DayPlan[];
}

/* --------------------------------------------------------------- commerce */

export type CommerceKind =
  | "ticket"
  | "transport"
  | "transfer"
  | "experience"
  | "service"
  | "esim"
  | "lodging";

export const COMMERCE_KIND_LABELS: Record<CommerceKind, string> = {
  ticket: "門票",
  transport: "交通票券",
  transfer: "接送",
  experience: "體驗",
  service: "服務",
  esim: "網路",
  lodging: "住宿",
};

export interface CommerceItem {
  id: string;
  kind: CommerceKind;
  title: string;
  provider: "KLOOK" | "KKday" | "Agoda";
  price: number;
  currency: "JPY" | "TWD";
  unit: "person" | "group" | "night";
  /** Commission rate, or a flat CPA when rate is undefined. */
  rate?: number;
  cpa?: number;
  /** Why it is here *at this point in the trip* — a real friction, not a pitch. */
  reason: string;
}

/* ------------------------------------------------------------------ adapt */

export type AdaptTrigger = "overslept" | "rain" | "restaurant-full" | "tired";

export const ADAPT_LABELS: Record<AdaptTrigger, { icon: string; label: string }> = {
  overslept: { icon: "⏰", label: "睡過頭" },
  rain: { icon: "🌧", label: "下雨" },
  "restaurant-full": { icon: "🍽", label: "餐廳客滿" },
  tired: { icon: "😮‍💨", label: "旅伴太累" },
};

export interface AdaptOption {
  id: string;
  label: string;
  detail: string;
  /** Always populated — every option costs somebody something. */
  impact: { travellerId: TravellerId | "all"; because: string };
  /** Points added to each traveller's satisfaction if chosen (usually negative). */
  satisfactionDelta: Partial<Record<TravellerId, number>>;
  effect:
    | { type: "drop"; stopId: string }
    | { type: "shorten"; stopId: string; byMin: number }
    | { type: "swap"; stopId: string; toSpotId: string }
    | { type: "mode"; stopIds: string[]; to: LegMode; extraCostJpy: number };
}

export interface AdaptScenario {
  trigger: AdaptTrigger;
  day: number;
  /** What the companion noticed, phrased as an observation not an alarm. */
  observation: string;
  consequence: string;
  options: AdaptOption[];
}

/* ----------------------------------------------------------------- events */

export type TrackedEvent =
  | "preference_submit"
  | "conflict_detected"
  | "consensus_generated"
  | "tradeoff_swap"
  | "manual_reorder"
  | "ai_recoordinate"
  | "adapt_trigger"
  | "adapt_choose"
  | "ota_impression"
  | "ota_click"
  | "voice_open"
  | "voice_play"
  | "voice_complete"
  | "voice_cta_click"
  | "split_group_view";

export interface DemoEvent {
  id: string;
  ts: number;
  type: TrackedEvent;
  payload?: Record<string, unknown>;
}
