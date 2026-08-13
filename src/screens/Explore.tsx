import {
  ADAPTS,
  AFFILIATE_DISCLOSURE,
  HOME_SERVICES,
  ME,
  OVERSEAS_DESTINATIONS,
  REGIONS,
  TW_DESTINATIONS,
  dest,
  poi,
  poisForDest,
  poisWithStory,
  relevantDeals,
} from "../data";
import { DealCard } from "../components/DealCard";
import { Avatar, Button, Card, Chip, Note, Screen, Section, Tag, Thumb } from "../components/ui";
import { distance, walkMin } from "../lib/geo";
import { useNav } from "../nav";
import { COUNTRY_LABELS } from "../types";
import type { Adapt, ServiceId, Stop, Trip } from "../types";

/**
 * Home, and it changes shape three times.
 *
 * No trip: the screen asks one question — where do you want to go. A trip
 * booked: that trip sits above the inspiration, because the thing you already
 * committed to outranks the thing you might. A trip happening right now:
 * inspiration disappears entirely. Somebody standing in 台南 with two hours
 * before dinner is not shopping for Seoul.
 */
export function Explore({ trips }: { trips: Trip[] }) {
  const ongoing = trips.find((t) => t.phase === "ongoing");
  const planned = trips.find((t) => t.phase !== "ongoing");
  const here = ongoing ? dest(ongoing.destId)?.name : undefined;

  return (
    <Screen>
      <Header />

      <h1 className="px-5 pt-3 text-[26px] font-bold leading-tight text-ink">
        {ongoing ? (here ? `今天在${here}` : "今天的行程") : "想去哪裡走走？"}
      </h1>

      {ongoing ? (
        <>
          <ActiveTrip trip={ongoing} />
          <Services />
          <NearbyToday trip={ongoing} />
          <Offers destId={ongoing.destId} />
        </>
      ) : (
        <>
          <SearchEntry />
          {planned && <PlannedTrip trip={planned} />}
          <Services />
          <TaiwanCities />
          <Regions />
          <MightLike />
          <Offers destId={null} />
          <Overseas />
        </>
      )}

      <div className="h-24" />
    </Screen>
  );
}

/* ------------------------------------------------------------------ chrome */

function Header() {
  const nav = useNav();
  return (
    <div className="flex items-center gap-2 px-5 pt-4">
      <span className="grid size-7 place-items-center rounded-lg bg-brand text-[13px] font-black text-white">
        R
      </span>
      <span className="text-[16px] font-bold text-ink">ResoMap</span>
      {/* No bell. There is no notification surface behind it, and a control that
          does nothing is worse than an absent one — it teaches people the app
          ignores them. It comes back when there is something to open. */}
      <div className="ml-auto flex items-center">
        <button
          aria-label="我的"
          onClick={() => nav.tab("profile")}
          className="grid size-11 place-items-center rounded-full active:bg-surface"
        >
          <Avatar name={ME.name} color={ME.color} initial={ME.initial} size={30} />
        </button>
      </div>
    </div>
  );
}

const EXAMPLES = ["台南兩天", "東京賞櫻", "宜蘭親子", "台北美食"];

function SearchEntry() {
  const nav = useNav();
  return (
    <div className="px-5 pt-4">
      <button
        onClick={() => nav.go({ k: "search", q: "" })}
        className="flex w-full items-center gap-2.5 rounded-2xl bg-surface px-4 py-4 text-left active:bg-surface-2"
      >
        <SearchIcon />
        <span className="text-[14.5px] text-ink-3">搜尋城市、景點或想做的事情</span>
      </button>
      <div className="mt-2.5 flex gap-2 overflow-x-auto py-1 no-scrollbar">
        {EXAMPLES.map((q) => (
          <Chip key={q} onClick={() => nav.go({ k: "search", q })}>
            {q}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/**
 * Five doors, one row. Four things somebody might want on opening the app plus
 * one honest way to the rest — a nine-tile grid of everything the app can do is
 * a menu, and nobody reads a menu on a home screen.
 */
function Services() {
  const nav = useNav();
  const open = (id: ServiceId) => {
    if (id === "plan") nav.go({ k: "create" });
    else if (id === "stay") nav.go({ k: "stay" });
    else if (id === "more") nav.moreServices();
    else nav.tab("deals");
  };

  return (
    <div className="mt-6 grid grid-cols-5 px-3">
      {HOME_SERVICES.map((s) => (
        <button
          key={s.id}
          onClick={() => open(s.id)}
          className="flex flex-col items-center gap-2 py-2 transition active:opacity-55"
        >
          <span className="grid size-12 place-items-center rounded-full bg-surface text-[21px]">
            {s.icon}
          </span>
          <span className="whitespace-nowrap text-[11.5px] text-ink-2">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- trip state */

const todayStops = (trip: Trip): Stop[] =>
  trip.days.find((d) => d.n === trip.today)?.tracks.flatMap((t) => t.stops) ?? [];

/**
 * The stops on *this* traveller's track today.
 *
 * `todayStops` flattens every track, which is the right answer for "what is
 * already planned today" and the wrong one for "where am I going next": on a
 * split day the groups are in different districts, so `stops[0]`/`stops[1]`
 * would straddle two of them and report a walking time between two people.
 * A solo trip carries one track with an empty `who` and falls through here
 * unchanged.
 */
const myStops = (trip: Trip): Stop[] => {
  const day = trip.days.find((d) => d.n === trip.today);
  if (!day) return [];
  const mine =
    day.tracks.find((t) => t.who.length === 0 || t.who.includes(ME.id)) ?? day.tracks[0];
  return mine?.stops ?? [];
};

function PlannedTrip({ trip }: { trip: Trip }) {
  const nav = useNav();
  const day1 = trip.days.find((d) => d.n === 1) ?? trip.days[0];
  const stops = (day1?.tracks.flatMap((t) => t.stops) ?? []).slice(0, 4);

  return (
    <div className="mt-6 px-5">
      <Card className="p-4">
        <div className="flex items-baseline gap-2">
          <div className="min-w-0 flex-1 truncate text-[16.5px] font-bold text-ink">
            {trip.title}
          </div>
          {trip.daysUntil !== undefined && (
            <span className="num shrink-0 text-[12.5px] font-bold text-brand">
              還有 {trip.daysUntil} 天出發
            </span>
          )}
        </div>
        <div className="num mt-0.5 text-[13px] text-ink-3">{trip.dates}</div>

        {stops.length > 0 && (
          <div className="mt-3.5 flex items-center gap-2">
            {stops.map((s) => {
              const p = poi(s.poiId);
              return <Thumb key={s.id} emoji={p.emoji} tint={p.tint} size={44} radius={12} />;
            })}
          </div>
        )}

        {/* The one thing missing from this trip, said once and quietly. */}
        {trip.needsStay && (
          <div className="mt-3.5 flex items-center gap-3 border-t border-line pt-3.5">
            <span className="flex-1 text-[13.5px] text-ink-2">還沒安排住宿</span>
            <button
              onClick={() => nav.go({ k: "stay", destId: trip.destId })}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-bg px-4 text-[13px] font-bold text-ink active:bg-surface-2"
            >
              找住宿
            </button>
          </div>
        )}

        {/* Deliberately not orange. The floating AI button is already the one
            loud thing on this screen, and two competing oranges is how a home
            screen stops telling you what to do next. */}
        <div className="mt-4">
          <Button variant="secondary" onClick={() => nav.go({ k: "trip", id: trip.id })}>
            查看行程
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActiveTrip({ trip }: { trip: Trip }) {
  const nav = useNav();
  const stops = myStops(trip);
  /* The traveller is standing at the first stop of the day, so the useful one
     is the second. */
  const at = stops[0];
  const next = stops[1] ?? at;
  const city = dest(trip.destId)?.name;
  const nextPoi = next ? poi(next.poiId) : undefined;
  const walk =
    at && next && at !== next ? walkMin(distance(poi(at.poiId), poi(next.poiId))) : undefined;
  const adapt = ADAPTS.find((a) => a.tripId === trip.id && a.day === trip.today);

  return (
    <div className="mt-4 px-5">
      <Card className="p-4">
        <div className="num text-[12.5px] font-semibold text-ink-3">
          {city ? `${city} · ` : ""}Day {trip.today} / {trip.nights + 1}
        </div>

        {nextPoi && next && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-bg p-3">
            <Thumb emoji={nextPoi.emoji} tint={nextPoi.tint} size={48} radius={13} />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-ink-3">下一站</div>
              <div className="truncate text-[16px] font-bold text-ink">{nextPoi.name}</div>
            </div>
            <div className="num shrink-0 text-[15px] font-bold text-ink">{next.at}</div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-3">
          {walk !== undefined && <span className="num">步行 {walk} 分鐘</span>}
          {walk !== undefined && <span aria-hidden>·</span>}
          <span className="num">今天 33° 晴時多雲</span>
          <Tag kind="demo" />
        </div>

        {/* Secondary, for the same reason as 查看行程 above: the floating
            調整行程 button is already the one orange thing here. */}
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => nav.go({ k: "day", tripId: trip.id, n: trip.today })}
          >
            查看今日行程
          </Button>
        </div>
      </Card>

      {adapt && <AdaptStrip trip={trip} adapt={adapt} />}
    </div>
  );
}

/**
 * One line, not a card. What changed today is worth interrupting for; it is not
 * worth a panel that pushes the itinerary off the screen.
 */
function AdaptStrip({ trip, adapt }: { trip: Trip; adapt: Adapt }) {
  const nav = useNav();
  return (
    <button
      onClick={() => nav.go({ k: "day", tripId: trip.id, n: trip.today })}
      className="mt-2.5 flex w-full items-center gap-2.5 rounded-2xl bg-brand-wash px-4 py-3.5 text-left transition active:opacity-75"
    >
      <span className="text-[15px]">{adapt.icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
        {adapt.headline}
      </span>
      <span className="shrink-0 text-[12.5px] font-bold text-brand">看 AI 建議</span>
    </button>
  );
}

function NearbyToday({ trip }: { trip: Trip }) {
  const nav = useNav();
  const mine = myStops(trip);
  const anchor = mine[1] ?? mine[0];
  if (!anchor) return null;

  const from = poi(anchor.poiId);
  /* Anchored where I am, but excluding anything any group already has today. */
  const planned = new Set(todayStops(trip).map((s) => s.poiId));
  const near = poisForDest(trip.destId)
    .filter((p) => !planned.has(p.id))
    .map((p) => ({ p, min: walkMin(distance(from, p)) }))
    .sort((a, b) => a.min - b.min)
    .slice(0, 3);

  if (!near.length) return null;

  return (
    <Section title="今天可以順路">
      <div className="px-5">
        {near.map(({ p, min }) => (
          <button
            key={p.id}
            onClick={() => nav.go({ k: "poi", id: p.id })}
            className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-0 active:bg-surface"
          >
            <Thumb emoji={p.emoji} tint={p.tint} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-semibold text-ink">{p.name}</div>
              <div className="num truncate text-[12.5px] text-ink-3">
                {p.area} · 離{from.name}步行 {min} 分鐘
              </div>
            </div>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- inspiration */

function TaiwanCities() {
  const nav = useNav();
  return (
    <Section title="台灣熱門城市">
      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {TW_DESTINATIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => nav.go({ k: "dest", id: d.id })}
            className="w-[140px] shrink-0 text-left"
          >
            <div
              className="grid h-[96px] place-items-center rounded-2xl text-[34px]"
              style={{ background: d.tint }}
            >
              {d.emoji}
            </div>
            <div className="mt-2 text-[15px] font-bold text-ink">{d.name}</div>
            {/* The tagline, not `tripCount`. "128 個行程" is a fabricated
                popularity number in an app that ships three itineraries, and a
                made-up count is the cheapest way to lose a reader who checks. */}
            <div className="truncate text-[12.5px] text-ink-3">{d.tagline}</div>
          </button>
        ))}
      </div>
    </Section>
  );
}

/**
 * 九份 is a destination in a traveller's head but not a city in the data, so a
 * tile here opens a search rather than pretending there is a destination page
 * behind it.
 */
function Regions() {
  const nav = useNav();
  return (
    <Section title="熱門旅遊區域">
      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => nav.go({ k: "search", q: r.name })}
            className="w-[112px] shrink-0 text-left"
          >
            <div
              className="grid h-[76px] place-items-center rounded-2xl text-[27px]"
              style={{ background: r.tint }}
            >
              {r.emoji}
            </div>
            <div className="mt-1.5 text-[14px] font-bold text-ink">{r.name}</div>
            <div className="text-[12px] text-ink-3">{r.near}</div>
          </button>
        ))}
      </div>
    </Section>
  );
}

function MightLike() {
  const nav = useNav();
  const picks = poisWithStory().slice(0, 4);
  return (
    <Section title="你可能會喜歡">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-5">
        {picks.map((p) => {
          const city = dest(p.destId)?.name;
          return (
            <button
              key={p.id}
              onClick={() => nav.go({ k: "poi", id: p.id })}
              className="text-left"
            >
              <div
                className="grid h-[104px] place-items-center rounded-2xl text-[32px]"
                style={{ background: p.tint }}
              >
                {p.emoji}
              </div>
              <div className="mt-2 truncate text-[14.5px] font-bold text-ink">{p.name}</div>
              <div className="truncate text-[12.5px] text-ink-3">
                {city ? `${city} · ${p.area}` : p.area}
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function Overseas() {
  const nav = useNav();
  return (
    <Section title="海外熱門">
      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {OVERSEAS_DESTINATIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => nav.go({ k: "dest", id: d.id })}
            className="w-[112px] shrink-0 text-left"
          >
            <div
              className="grid h-[76px] place-items-center rounded-2xl text-[27px]"
              style={{ background: d.tint }}
            >
              {d.emoji}
            </div>
            <div className="mt-1.5 text-[14px] font-bold text-ink">{d.name}</div>
            <div className="text-[12px] text-ink-3">{COUNTRY_LABELS[d.country]}</div>
          </button>
        ))}
      </div>
    </Section>
  );
}

function Offers({ destId }: { destId: string | null }) {
  const nav = useNav();
  const deals = relevantDeals(destId, 3);
  return (
    <Section title="與你相關的優惠">
      <div className="space-y-2 px-5">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
        ))}
      </div>
      <Note>{AFFILIATE_DISCLOSURE}</Note>
    </Section>
  );
}

/* ------------------------------------------------------------------ icons */

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-ink-3"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  );
}
