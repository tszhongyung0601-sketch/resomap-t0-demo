import { ATTRACTIONS, COMMERCE_ITEMS } from "../data/jiufenSpots";
import {
  WALK_RANK,
  type AttractionSpot,
  type CommerceItem,
  type DayItinerary,
  type Itinerary,
  type ItineraryStop,
  type PoolItem,
  type TripPlanInput,
} from "../types";

const WALK_BUFFER_MINUTES = 12;
/** Caps how many free attractions one day can claim, so a long first day doesn't
 *  exhaust the whole content pool and leave later days almost empty. */
const MAX_ATTRACTIONS_PER_DAY = 6;
const STARTING_POINT = { lat: 25.1088, lng: 121.844 }; // roughly the entrance to Jiufen Old Street

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function interestScore(item: PoolItem, interests: TripPlanInput["interests"]) {
  return item.interests.filter((tag) => interests.includes(tag)).length;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number) {
  const m = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

interface GeneratorState {
  usedAttractionIds: Set<string>;
  usedCommerceIds: Set<string>;
}

function pickNearestEligible(
  from: { lat: number; lng: number },
  candidates: AttractionSpot[],
  input: TripPlanInput,
  state: GeneratorState,
): AttractionSpot | null {
  const maxWalk = WALK_RANK[input.walkTolerance];
  const pairedAwayIds = new Set(
    COMMERCE_ITEMS.filter((c) => state.usedCommerceIds.has(c.id) && c.pairedAttractionId).map(
      (c) => c.pairedAttractionId as string,
    ),
  );
  const eligible = candidates.filter(
    (c) =>
      !state.usedAttractionIds.has(c.id) &&
      !pairedAwayIds.has(c.id) &&
      WALK_RANK[c.walkDifficulty] <= maxWalk,
  );
  if (eligible.length === 0) return null;

  // Rank primarily by interest match, then by proximity to the current point.
  const scored = eligible
    .map((spot) => ({
      spot,
      score: interestScore(spot, input.interests),
      dist: haversineMeters(from, spot),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dist - b.dist;
    });

  return scored[0].spot;
}

function pickCommerce(
  from: { lat: number; lng: number },
  slot: CommerceItem["preferredSlot"],
  input: TripPlanInput,
  state: GeneratorState,
): CommerceItem | null {
  const eligible = COMMERCE_ITEMS.filter(
    (c) =>
      !state.usedCommerceIds.has(c.id) &&
      c.preferredSlot === slot &&
      !(c.pairedAttractionId && state.usedAttractionIds.has(c.pairedAttractionId)),
  );
  if (eligible.length === 0) return null;
  const scored = eligible
    .map((item) => ({
      item,
      score: interestScore(item, input.interests),
      dist: haversineMeters(from, item),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dist - b.dist;
    });
  return scored[0].item;
}

function buildDay(
  day: number,
  startMinutes: number,
  endMinutes: number,
  input: TripPlanInput,
  state: GeneratorState,
): DayItinerary {
  const stops: ItineraryStop[] = [];
  let cursor = { lat: STARTING_POINT.lat, lng: STARTING_POINT.lng };
  let clock = startMinutes;
  let stopIndex = 0;

  const pushStop = (item: PoolItem) => {
    stops.push({
      stopId: `${item.id}-d${day}-${stopIndex++}`,
      item,
      arrivalTime: toHHMM(clock),
    });
    clock += item.stayMinutes + WALK_BUFFER_MINUTES;
    cursor = { lat: item.lat, lng: item.lng };
  };

  // Day 1 opens with a "start" commerce slot (shuttle / charter / day tour) when time allows.
  if (day === 1) {
    const startItem = pickCommerce(cursor, "start", input, state);
    if (startItem && clock + 20 <= endMinutes) {
      state.usedCommerceIds.add(startItem.id);
      pushStop(startItem);
    }
  }

  let insertedMiddle = false;
  let guard = 0;
  let attractionsToday = 0;
  while (clock < endMinutes && guard < 20 && attractionsToday < MAX_ATTRACTIONS_PER_DAY) {
    guard++;
    const next = pickNearestEligible(cursor, ATTRACTIONS, input, state);
    if (!next) break;
    if (clock + next.stayMinutes + WALK_BUFFER_MINUTES > endMinutes) break;
    state.usedAttractionIds.add(next.id);
    pushStop(next);
    attractionsToday++;

    // Try to slot in one "middle" commerce item after the 2nd or 3rd stop of the day.
    // (Stop-count based rather than wall-clock based: a short content day can finish
    // well before the halfway clock time, which would otherwise skip this entirely.)
    if (!insertedMiddle && attractionsToday >= 2) {
      const midItem = pickCommerce(cursor, "middle", input, state);
      if (midItem && clock + 15 <= endMinutes) {
        state.usedCommerceIds.add(midItem.id);
        pushStop(midItem);
        insertedMiddle = true;
      }
    }
  }

  // Close the day with an "end" commerce slot (merchant discount) if there's room.
  const endItem = pickCommerce(cursor, "end", input, state);
  if (endItem && clock + 10 <= endMinutes) {
    state.usedCommerceIds.add(endItem.id);
    pushStop(endItem);
  }

  return { day, stops };
}

export function generateItinerary(input: TripPlanInput): Itinerary {
  const state: GeneratorState = {
    usedAttractionIds: new Set(),
    usedCommerceIds: new Set(),
  };

  const days: DayItinerary[] = [];
  for (let d = 1; d <= input.days; d++) {
    const isFirst = d === 1;
    const isLast = d === input.days;
    const start = isFirst ? toMinutes(input.arrivalTime) : toMinutes("09:00");
    const end = isLast ? toMinutes(input.departureTime) : toMinutes("18:00");
    days.push(buildDay(d, start, end, input, state));
  }

  return { input, days };
}

/** Recomputes arrival times for a day after a manual reorder / delete / insert. */
export function recomputeDay(day: DayItinerary, startMinutes: number): DayItinerary {
  let clock = startMinutes;
  const stops = day.stops.map((stop) => {
    const arrivalTime = toHHMM(clock);
    clock += stop.item.stayMinutes + WALK_BUFFER_MINUTES;
    return { ...stop, arrivalTime };
  });
  return { ...day, stops };
}

export function dayStartMinutes(dayNumber: number, input: TripPlanInput) {
  return dayNumber === 1 ? toMinutes(input.arrivalTime) : toMinutes("09:00");
}

export function allPoolItemsExcept(usedIds: Set<string>): PoolItem[] {
  return [
    ...ATTRACTIONS.filter((a) => !usedIds.has(a.id)),
    ...COMMERCE_ITEMS.filter((c) => !usedIds.has(c.id)),
  ];
}
