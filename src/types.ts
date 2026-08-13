/**
 * ResoMap — a journey layer.
 *
 * Before the trip: explore, plan, book. During it: navigate, adapt, listen,
 * discover. The domain model below is written around that arc, not around the
 * feature list — which is why there is no "dashboard", "funnel" or "score" type
 * anywhere in it. Those are things the business needs to know; they are not
 * things a traveller has.
 *
 * Everything here is demo data. Nothing in this file implies a commercial
 * relationship with any of the platforms named in `AffiliatePartner`.
 */

/* --------------------------------------------------------------- partners */

export type PartnerId = "klook" | "kkday" | "booking" | "agoda" | "tripcom";

export interface AffiliatePartner {
  id: PartnerId;
  name: string;
  /** What this platform is used for in the demo. */
  kinds: DealCategory[];
  /** Where an outbound tap would go. Never opened — the demo simulates it. */
  site: string;
  tint: string;
}

/* ----------------------------------------------------------- destinations */

export type CountryId = "tw" | "jp" | "kr";

export const COUNTRY_LABELS: Record<CountryId, string> = {
  tw: "台灣",
  jp: "日本",
  kr: "韓國",
};

/**
 * Which single ResoMap capability a demo city is built to show. Four cities
 * each doing one thing well beats four cities each doing everything badly.
 */
export type DemoAngle = "city" | "story" | "weather" | "group";

export interface Destination {
  id: string;
  name: string;
  country: CountryId;
  /** One line under the name on the destination page. */
  tagline: string;
  emoji: string;
  tint: string;
  lat: number;
  lng: number;
  zoom: number;
  /** Set only on the four cities with a scripted scenario. */
  angle?: DemoAngle;
}

/** A place people travel to that is not a city — a coast, a mountain, a town. */
export interface TravelRegion {
  id: string;
  name: string;
  /** The city or county it hangs off, for the subtitle. */
  near: string;
  tagline: string;
  emoji: string;
  tint: string;
  lat: number;
  lng: number;
  zoom: number;
}

/* ------------------------------------------------------------------- poi */

export type PoiKind =
  | "attraction"
  | "food"
  | "nature"
  | "shopping"
  | "activity"
  | "stay"
  | "transit";

export const POI_KIND_LABELS: Record<PoiKind, string> = {
  attraction: "景點",
  food: "美食",
  nature: "自然",
  shopping: "購物",
  activity: "活動",
  stay: "住宿",
  transit: "交通",
};

export interface Poi {
  id: string;
  name: string;
  destId: string;
  /** Neighbourhood, shown as the second line. */
  area: string;
  kind: PoiKind;
  lat: number;
  lng: number;
  /** Stands in for a photo — a flat tint and one emoji, so nothing loads. */
  emoji: string;
  tint: string;
  about?: string;
  /** Suggested visit length, used when adding to an itinerary. */
  stayMin: number;
  indoor?: boolean;
  /** Set when this place has a recorded ResoMap story. */
  storyId?: string;
  /**
   * Only true where a real venue genuinely sells an admission ticket. Ordinary
   * temples, streets and parks must never show a ticket CTA — pretending a free
   * park needs a ticket is how a travel app stops being believable.
   */
  ticketed?: boolean;
  tags?: string[];
}

/* --------------------------------------------------------------- stories */

export interface Story {
  id: string;
  poiId: string;
  title: string;
  minutes: number;
  /** Who recorded it. ResoMap's guides are made by people, and it says so. */
  narrator: string;
  plays: number;
  likes: number;
  /** Split on "|": one utterance per sentence keeps the progress bar honest. */
  body: string;
}

/* ----------------------------------------------------------------- deals */

export type DealCategory =
  | "ticket"
  | "stay"
  | "transport"
  | "esim"
  | "insurance"
  | "local";

export const DEAL_CATEGORY_LABELS: Record<DealCategory, string> = {
  ticket: "門票",
  stay: "住宿",
  transport: "交通",
  esim: "eSIM",
  insurance: "旅平險",
  local: "在地優惠",
};

export interface Deal {
  id: string;
  category: DealCategory;
  title: string;
  partner: PartnerId;
  /** Indicative price only. The demo never claims a live rate. */
  priceTwd: number;
  unit?: string;
  destId?: string;
  poiId?: string;
  emoji: string;
  tint: string;
  /** Paid placement. Always rendered with a visible label. */
  sponsored?: boolean;
  /** Local merchant supply that does not exist yet. Shown, never bookable. */
  comingLater?: boolean;
}

/* -------------------------------------------------------------- services */

export type ServiceId =
  | "plan"
  | "tickets"
  | "stay"
  | "transport"
  | "more"
  | "flight"
  | "car"
  | "airport"
  | "esim"
  | "insurance"
  | "coupon"
  | "tools";

export interface Service {
  id: ServiceId;
  label: string;
  icon: string;
  /** Copy for the sheet row; the five home shortcuts show label only. */
  note?: string;
}

/* ------------------------------------------------------------- travellers */

export type TravellerId = "mickey" | "amy" | "john" | "susan";

export type InterestId =
  | "food"
  | "culture"
  | "nature"
  | "shopping"
  | "photo"
  | "family"
  | "nightlife"
  | "themepark";

export const INTEREST_LABELS: Record<InterestId, string> = {
  food: "美食",
  culture: "文化",
  nature: "自然",
  shopping: "購物",
  photo: "拍照",
  family: "親子",
  nightlife: "夜生活",
  themepark: "樂園",
};

export interface Traveller {
  id: TravellerId;
  name: string;
  initial: string;
  color: string;
  likes: InterestId[];
  /** One plain-language constraint, shown only where it matters. */
  note?: string;
}

/* ------------------------------------------------------------- itinerary */

export type LegMode = "walk" | "train" | "bus" | "taxi" | "drive";

export const LEG_LABEL: Record<LegMode, string> = {
  walk: "步行",
  train: "捷運",
  bus: "公車",
  taxi: "計程車",
  drive: "開車",
};

export interface Leg {
  mode: LegMode;
  min: number;
  metres: number;
}

export interface Stop {
  id: string;
  poiId: string;
  at: string; // "HH:MM"
  stayMin: number;
  meal?: "lunch" | "dinner";
  /** Travel in from the previous stop. */
  from?: Leg;
  /** Set when an in-trip adjustment touched this stop. */
  changed?: string;
  /** Only used on a split day. */
  who?: TravellerId[];
}

export interface Track {
  id: string;
  label?: string;
  who: TravellerId[];
  stops: Stop[];
}

export interface Day {
  n: number;
  date: string; // "8 月 20 日"
  weekday: string;
  tracks: Track[];
  meetUp?: { poiId: string; at: string };
}

export type TripPhase = "upcoming" | "soon" | "ongoing";

export interface Trip {
  id: string;
  destId: string;
  title: string;
  dates: string;
  nights: number;
  phase: TripPhase;
  /** Days until departure, for the "還有 2 天出發" line. */
  daysUntil?: number;
  /** Which day the traveller is on once the trip is ongoing. */
  today: number;
  /** Empty for a solo trip; group coordination is optional, not a gate. */
  travellers: TravellerId[];
  days: Day[];
  /** Set when the trip has no accommodation yet, so the app can offer to help. */
  needsStay?: boolean;
}

/* --------------------------------------------------------------- consensus */

export interface Agreement {
  label: string;
  who: TravellerId[];
}

export interface Conflict {
  topic: string;
  wants: TravellerId[];
  against: TravellerId[];
  againstReason: string;
  suggestion: {
    day: number;
    groups: { who: TravellerId[]; where: string }[];
    meet: { at: string; where: string };
  };
  alternatives: { id: string; label: string; why: string }[];
}

/* ------------------------------------------------------------------ adapt */

export type AdaptTrigger = "late" | "rain" | "closed" | "full";

export interface AdaptPlan {
  /** Stop ids removed by this plan. */
  drop: string[];
  /** Stop id -> replacement POI id. */
  swap?: Record<string, string>;
  /** What survives, in the traveller's words. */
  keeps: string[];
}

export interface Adapt {
  id: string;
  tripId: string;
  day: number;
  trigger: AdaptTrigger;
  icon: string;
  /** The observation, in one short sentence. */
  headline: string;
  /** What happens if nothing changes. */
  consequence: string;
  /** Directions offered before the AI proposes anything concrete. */
  choices: string[];
  /** Minutes behind schedule; drives both the warning and the new times. */
  delayMin?: number;
  /** Label stamped on a swapped stop. */
  swapNote?: string;
  plan: AdaptPlan;
  cta: string;
}

/* ----------------------------------------------------------------- events */

export type EventName =
  | "trip_created"
  | "trip_view"
  | "day_view"
  | "poi_view"
  | "poi_add"
  | "search"
  | "destination_view"
  | "consensus_view"
  | "consensus_accept"
  | "adapt_shown"
  | "adapt_applied"
  | "adapt_dismissed"
  | "story_play"
  | "story_finish"
  | "affiliate_impression"
  | "affiliate_click"
  | "affiliate_outbound"
  | "mock_booking";

export interface TrackedEvent {
  name: EventName;
  at: number;
  partner?: PartnerId;
  category?: DealCategory;
  destId?: string;
  dealId?: string;
  poiId?: string;
  /** Indicative value of a simulated booking, in TWD. */
  valueTwd?: number;
}
