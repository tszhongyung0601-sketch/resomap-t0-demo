import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  AFFILIATE_DISCLOSURE,
  BY_TRAVELLER,
  dealsForPoi,
  poi,
  POIS,
} from "../data";
import { DealCard } from "../components/DealCard";
import { Cover } from "../components/Cover";
import { dur } from "../lib/adapt";
import { distance, km } from "../lib/geo";
import { track } from "../lib/track";
import { openDirections } from "../lib/maps";
import { useNav } from "../nav";
import {
  Avatar,
  Button,
  Card,
  Headphones,
  Note,
  Screen,
  Section,
  Thumb,
  TopBar,
} from "../components/ui";
import {
  LEG_LABEL,
  POI_KIND_LABELS,
  type Day,
  type Deal,
  type LegMode,
  type Poi,
  type Stop,
  type Track,
  type TravellerId,
  type Trip,
} from "../types";

/* ------------------------------------------------------------- trip home */

/**
 * The overview of one trip: who is coming, the days, and then the two things
 * the trip might still need.
 *
 * The days come first. Somebody opening their own itinerary came to look at the
 * itinerary, and a screen that answers with two shopping blocks before the plan
 * has decided that its own traveller is a lead.
 *
 * Both contextual cards appear only when the trip actually lacks the thing, and
 * both state the fact rather than working the traveller: "這趟行程共 4 晚" is a
 * fact they can act on or ignore; "還沒安排住宿，先訂起來比較安心" is a nudge with
 * a deadline attached to somebody else's checkout. That is the whole difference
 * between a reminder and an ad — and it is also why neither card wears the
 * brand-orange fill that 加入行程 wears elsewhere in the app.
 */
export function TripHome({ trip }: { trip: Trip }) {
  const nav = useNav();
  const tickets = ticketReminders(trip);

  useEffect(() => {
    track("trip_view", { tripId: trip.id, destId: trip.destId });
  }, [trip.id, trip.destId]);

  return (
    <Screen>
      <TopBar
        title={trip.title}
        onBack={nav.back}
        right={
          <MapButton
            onClick={() => nav.go({ k: "tripmap", tripId: trip.id, n: 1 })}
          />
        }
      />

      <div className="num px-5 text-[14px] text-ink-3">
        {trip.dates}
        {trip.phase === "ongoing" && (
          <span className="font-semibold text-brand"> · 今天是第 {trip.today} 天</span>
        )}
      </div>

      {trip.travellers.length > 0 && (
        <button
          onClick={() => nav.go({ k: "travellers", tripId: trip.id })}
          className="mt-4 flex w-full items-center gap-3 px-5 py-3 text-left active:bg-surface"
        >
          <Stack who={trip.travellers} size={28} />
          <span className="flex-1 text-[14.5px] text-ink">
            {trip.travellers.length} 位旅伴 · 看大家想去哪
          </span>
          <span className="shrink-0 text-[15px] text-ink-3">›</span>
        </button>
      )}

      <Section title="每日行程">
        <div className="space-y-3 px-5">
          {trip.days.map((d) => (
            <DayCard key={d.n} trip={trip} day={d} />
          ))}
        </div>
      </Section>

      {trip.needsStay && (
        <section className="mt-8 px-5">
          <div className="rounded-2xl bg-surface p-4">
            <div className="text-[15px] font-semibold text-ink">住宿</div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
              這趟行程共 {trip.nights} 晚。要找住宿的話，從這裡開始。
            </p>
            <div className="mt-3.5">
              <Button
                variant="onCard"
                onClick={() => nav.go({ k: "stay", destId: trip.destId })}
                full={false}
              >
                查看住宿
              </Button>
            </div>
          </div>
        </section>
      )}

      {tickets.deals.length > 0 && (
        <section className="mt-6">
          <div className="px-5">
            <div className="text-[15px] font-semibold text-ink">門票</div>
            {/* What is true — these places sell admission — and nothing about
                what happens if you leave it. The card only exists because the
                itinerary contains a venue that genuinely charges entry; that
                fact is the reminder, and a deadline stapled to it would be a
                sales line wearing a reminder's clothes. */}
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
              {tickets.names.join("、")}需要購票入場。
            </p>
            <div className="mt-3 space-y-2">
              {tickets.deals.map((d) => (
                <DealCard key={d.id} deal={d} onOpen={nav.openDeal} compact />
              ))}
            </div>
          </div>
          <Note>{AFFILIATE_DISCLOSURE}</Note>
        </section>
      )}

      <div className="h-24" />
    </Screen>
  );
}

function DayCard({ trip, day }: { trip: Trip; day: Day }) {
  const nav = useNav();
  const stops = day.tracks.flatMap((t) => t.stops);
  const thumbs = [...new Set(stops.map((s) => s.poiId))].slice(0, 4);
  /* A day can legitimately be empty. Reading the first element unguarded put
     the literal string "undefined 出發" on the card. */
  const times = stops.map((s) => s.at).sort();
  const start = times.length > 0 ? times[0] : null;

  return (
    <Card
      onClick={() => nav.go({ k: "day", tripId: trip.id, n: day.n })}
      className="p-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-[15px] font-bold text-ink">Day {day.n}</span>
        <span className="truncate text-[13px] text-ink-3">
          {day.date} {day.weekday}
        </span>
      </div>

      {thumbs.length > 0 && (
        <div className="mt-2.5 flex gap-2">
          {thumbs.map((id) => {
            const p = poi(id);
            return <Thumb key={id} emoji={p.emoji} tint={p.tint} size={48} radius={12} />;
          })}
        </div>
      )}

      <div className="num mt-2.5 text-[12.5px] text-ink-3">
        {start && `${start} 出發 · `}
        {stops.length} 個行程
        {day.meetUp ? " · 分開走再會合" : ""}
      </div>
    </Card>
  );
}

/**
 * Tickets a traveller genuinely still needs: a place in this trip that really
 * sells admission, and a listing that exists for it. Two at most — the third
 * one turns a reminder into a shop.
 */
function ticketReminders(trip: Trip): { names: string[]; deals: Deal[] } {
  const ids = [
    ...new Set(trip.days.flatMap((d) => d.tracks.flatMap((t) => t.stops.map((s) => s.poiId)))),
  ];
  const names: string[] = [];
  const deals: Deal[] = [];

  for (const id of ids) {
    if (deals.length === 2) break;
    const p = poi(id);
    if (!p.ticketed) continue;
    const deal = dealsForPoi(id).find((d) => d.category === "ticket");
    if (!deal) continue;
    names.push(p.name);
    deals.push(deal);
  }
  return { names, deals };
}

/* -------------------------------------------------------------- day plan */

/**
 * One day, read like a timetable: time, place, how long, how you get to the
 * next one — and, on every stop that has one, the way into its story.
 *
 * The story button is the reason this screen matters. A traveller does not go
 * looking for audio guides; they look at what they are doing next. Putting the
 * headphones on the itinerary row is how they find out, while walking, that the
 * place they are walking to has something to listen to.
 */
export function DayPlan({
  trip,
  day,
  banner,
  onAdjust,
}: {
  trip: Trip;
  day: number;
  /** The in-trip AI card, injected above the timeline when something changed. */
  banner?: ReactNode;
  /** Opens the AI adjustment flow. Owned by App — this screen only asks. */
  onAdjust: () => void;
}) {
  const nav = useNav();
  const d = trip.days.find((x) => x.n === day) ?? trip.days[0];

  /* `day` is in the deps because the event is per-day even though the payload
     has no field for it — walking Day 1 → Day 2 is two views, not one. */
  useEffect(() => {
    track("day_view", { tripId: trip.id });
  }, [trip.id, day]);

  if (!d) return null;

  /* The shared track is the one that starts at the meeting point, so a split
     day renders as "two groups, then everyone" without hard-coded track ids. */
  const meet = d.meetUp;
  const shared = meet
    ? d.tracks.find((t) => t.stops.some((s) => s.poiId === meet.poiId && s.at === meet.at))
    : undefined;
  const own = d.tracks.filter((t) => t !== shared);
  const split = own.length > 1;

  /* Somewhere you are already going is not a discovery, so the whole day —
     both tracks of a split one — is excluded from the "on the way" line. */
  const planned = new Set(d.tracks.flatMap((t) => t.stops.map((s) => s.poiId)));

  return (
    <Screen>
      <TopBar
        title={trip.title}
        onBack={() => nav.go({ k: "trip", id: trip.id })}
        right={
          <MapButton
            onClick={() => nav.go({ k: "tripmap", tripId: trip.id, n: day })}
          />
        }
        below={
          <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar">
            {trip.days.map((x) => (
              <button
                key={x.n}
                onClick={() => nav.go({ k: "day", tripId: trip.id, n: x.n })}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 text-[13.5px] font-semibold transition ${
                  x.n === day ? "bg-ink text-white" : "bg-surface text-ink-2 active:bg-surface-2"
                }`}
              >
                Day {x.n}
              </button>
            ))}
          </div>
        }
      />

      {banner && <div className="px-5 pt-1">{banner}</div>}

      <div className="px-5 pt-2 text-[15px] font-bold text-ink">
        {d.date} <span className="font-normal text-ink-3">{d.weekday}</span>
      </div>

      {/* In the page, not floating over it. A plan that changes is the normal
          case on a trip, so the way to change it belongs in the reading order
          rather than parked on top of the last stop of the day. Quiet fill: the
          one loud thing on this screen is whatever the AI then proposes. */}
      <div className="px-5 pt-3">
        <button
          onClick={onAdjust}
          className="flex w-full items-center gap-2.5 rounded-2xl bg-surface px-4 py-3.5 text-left active:bg-surface-2"
        >
          <span className="text-[15px]">✨</span>
          <span className="flex-1 text-[14.5px] font-semibold text-ink">
            行程有變？讓 AI 幫你改
          </span>
          <span className="shrink-0 text-[15px] text-ink-3">›</span>
        </button>
      </div>

      <div className="px-5 pb-28 pt-4">
        {split ? (
          <div className="space-y-6">
            {own.map((t) => (
              <div key={t.id}>
                <TrackHeader track={t} />
                <Timeline stops={t.stops} planned={planned} />
              </div>
            ))}
          </div>
        ) : (
          own.map((t) => <Timeline key={t.id} stops={t.stops} planned={planned} />)
        )}

        {shared && meet && (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="num text-[12.5px] font-semibold text-ink-3">
                {meet.at} 會合
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <Timeline stops={shared.stops} planned={planned} />
          </>
        )}

        <div className="mt-5">
          <Button variant="ghost" onClick={() => nav.addTo(trip.id, day)}>
            ＋ 加入景點
          </Button>
        </div>
      </div>
    </Screen>
  );
}

function TrackHeader({ track: t }: { track: Track }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Stack who={t.who} size={22} />
      {t.label && <span className="text-[13.5px] font-semibold text-ink-2">{t.label}</span>}
    </div>
  );
}

function Timeline({ stops, planned }: { stops: Stop[]; planned: Set<string> }) {
  const nav = useNav();

  const found = stops.map((s, i) => {
    const prev = stops[i - 1];
    return prev && s.from ? passedOnTheWay(prev, s, planned) : null;
  });
  /* One mention per place. A shop that sits between three stops qualifies for
     all three legs, and the same name twice in a column reads as a bug rather
     than a discovery — so it is kept only on the leg it is nearest to. */
  const keep = new Map<string, number>();
  found.forEach((v, i) => {
    if (!v) return;
    const held = keep.get(v.poi.id);
    if (held === undefined || v.metres < (found[held]?.metres ?? Infinity)) {
      keep.set(v.poi.id, i);
    }
  });
  const vias = found.map((v, i) => (v && keep.get(v.poi.id) === i ? v.poi : null));

  return (
    <div>
      {stops.map((s, i) => (
        <div key={s.id}>
          {i > 0 && s.from && <Leg to={s} via={vias[i]} />}
          <StopRow
            stop={s}
            prev={i > 0 ? stops[i - 1] : undefined}
            onClick={() => nav.go({ k: "poi", id: s.poiId })}
          />
        </div>
      ))}
    </div>
  );
}

const LEG_ICON: Record<LegMode, string> = {
  walk: "🚶",
  train: "🚇",
  bus: "🚌",
  taxi: "🚕",
  drive: "🚗",
};

/**
 * The gap between two stops — now purely something to read.
 *
 * 怎麼走 moved onto the stop itself, which left this line free to say the one
 * thing a person in the gap can actually use: what they will walk past. It is
 * computed, never written: a place near the midpoint that is not already in the
 * day. If nothing qualifies the line is simply absent, because inventing a
 * landmark on a route is the fastest way to make the whole itinerary suspect.
 */
function Leg({ to, via }: { to: Stop; via: Poi | null }) {
  if (!to.from) return null;
  const { mode, min, metres } = to.from;

  return (
    <div className="pl-[56px]">
      <div className="border-l-[1.5px] border-line py-2 pl-3.5">
        <div className="text-[12.5px] text-ink-3">
          {LEG_ICON[mode]} {LEG_LABEL[mode]} {min} 分鐘 · {km(metres)}
        </div>
        {via && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
            途中會經過：{via.name}（{viaNote(via)}）
          </div>
        )}
      </div>
    </div>
  );
}

/** How close to the straight-line midpoint still counts as "on the way". */
const VIA_RADIUS = 250;

interface Via {
  poi: Poi;
  metres: number;
}

/**
 * Free things are the pleasant surprise, so a non-ticketed place wins even when
 * a ticketed one sits closer to the midpoint; distance only breaks the tie.
 */
function passedOnTheWay(from: Stop, to: Stop, planned: Set<string>): Via | null {
  const a = poi(from.poiId);
  const b = poi(to.poiId);
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };

  const near = POIS.filter(
    (p) =>
      p.destId === a.destId &&
      !planned.has(p.id) &&
      distance(mid, p) <= VIA_RADIUS,
  ).sort(
    (x, y) =>
      Number(Boolean(x.ticketed)) - Number(Boolean(y.ticketed)) ||
      distance(mid, x) - distance(mid, y),
  );

  const best = near[0];
  return best ? { poi: best, metres: distance(mid, best) } : null;
}

/**
 * "免費" is only information where you could otherwise have been charged to get
 * in, so it is reserved for the places that sell admission elsewhere. A noodle
 * street is described by what it is.
 */
function viaNote(p: Poi): string {
  if (p.ticketed) return "需門票";
  if (p.kind === "attraction" || p.kind === "nature") return "免費";
  return POI_KIND_LABELS[p.kind];
}

function StopRow({
  stop,
  prev,
  onClick,
}: {
  stop: Stop;
  prev?: Stop;
  onClick: () => void;
}) {
  const nav = useNav();
  const p = poi(stop.poiId);
  const mode = stop.from?.mode ?? "walk";
  const hasStory = Boolean(p.storyId);

  /* Both actions are secondary on purpose. The itinerary is a list of equals —
     the moment one stop's headphones turn orange, every other stop reads as the
     boring one. */
  const action =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-surface px-4 text-[13px] font-semibold text-ink transition active:bg-surface-2";

  return (
    <div className="py-1">
      <button
        onClick={onClick}
        className="-mx-2 flex w-full gap-3 rounded-2xl px-2 py-1.5 text-left active:bg-surface"
      >
        <div className="num w-11 shrink-0 pt-1 text-[14px] font-bold text-ink">
          {stop.at}
        </div>
        <Cover poi={p} height={72} radius={12} emoji={false} className="w-[92px]" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15.5px] font-semibold text-ink">{p.name}</span>
            {stop.meal && (
              <span className="shrink-0 text-[12px] text-ink-3">
                {stop.meal === "lunch" ? "午餐" : "晚餐"}
              </span>
            )}
          </div>
          {stop.stayMin > 0 && (
            <div className="mt-0.5 text-[12.5px] text-ink-3">停留 {dur(stop.stayMin)}</div>
          )}
          {stop.changed && (
            <div className="mt-1.5 inline-block rounded-md bg-brand-wash px-1.5 py-0.5 text-[11px] font-semibold text-brand">
              {stop.changed}
            </div>
          )}
        </div>
      </button>

      <div className="mt-1.5 flex gap-2 pl-[56px]">
        {hasStory && (
          <button
            onClick={() => {
              track("story_open", { poiId: p.id });
              nav.play(p.id, "full");
            }}
            className={`${action} flex-1`}
          >
            <Headphones size={13} />
            聽故事
          </button>
        )}
        <button
          onClick={() => openDirections(prev ? poi(prev.poiId) : null, p, mode)}
          className={`${action} ${hasStory ? "flex-1" : "ml-auto"}`}
        >
          怎麼走
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function Stack({ who, size }: { who: TravellerId[]; size: number }) {
  return (
    <div className="flex shrink-0 -space-x-1.5">
      {who.map((id) => {
        const t = BY_TRAVELLER[id];
        return (
          <span key={id} className="rounded-full ring-2 ring-bg">
            <Avatar name={t.name} color={t.color} initial={t.initial} size={size} />
          </span>
        );
      })}
    </div>
  );
}

function MapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="地圖"
      className="grid size-11 place-items-center rounded-full text-ink active:bg-surface"
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" strokeLinejoin="round" />
        <path d="M9 4.5v12.7M15 6.8v12.7" />
      </svg>
    </button>
  );
}
