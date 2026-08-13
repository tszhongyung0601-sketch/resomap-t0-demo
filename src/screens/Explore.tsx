import { ME, STORIES, TW_DESTINATIONS, poi, poisForDest, storiesForDest } from "../data";
import { PoiImage } from "../components/Cover";
import { photoFor } from "../data/imagePrompts";
import { Avatar, Button, Card, Headphones, Screen } from "../components/ui";
import { focusTrip } from "../lib/trip";
import { useNav } from "../nav";
import type { Destination, Story, Trip } from "../types";

/**
 * Home, in five sections.
 *
 * It used to carry eight, and three of those were the same kind of thing:
 * more places to look at, stacked under the places you were already looking at.
 * What is left answers the two questions somebody actually opens this app with
 * — "where am I going next" and "where could I go" — plus the doors that follow
 * from having answered them.
 *
 * There is exactly one orange button on this screen, and which one it is
 * depends on whether a trip exists. With a trip, the trip owns it; without one,
 * the planner does.
 */
export function Explore({ trips }: { trips: Trip[] }) {
  const trip = focusTrip(trips);
  const destId = trip?.destId;
  const rail = storyRail(destId);

  return (
    <Screen>
      <Hero hasTrip={Boolean(trip)} />
      {trip ? <NextTrip trip={trip} /> : <NoTrip />}
      <Destinations />
      <Services destId={destId} />
      <StoryPlaces rail={rail} />
      {/* shrink-0 or it collapses: Screen is a flex column, and a spacer with no
          content is the first thing flexbox takes back when the page overflows. */}
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

/* --------------------------------------------------------------- 1 · hero */

function Hero({ hasTrip }: { hasTrip: boolean }) {
  const nav = useNav();
  return (
    <>
      {/* No bell. There is no notification surface behind it, and a control
          that does nothing is worse than an absent one. */}
      <div className="flex items-center gap-2 px-5 pt-4">
        <span className="grid size-7 place-items-center rounded-lg bg-brand text-[13px] font-black text-white">
          R
        </span>
        <span className="text-[16px] font-bold text-ink">ResoMap</span>
        <button
          aria-label="我的"
          onClick={() => nav.go({ k: "profile" })}
          className="ml-auto grid size-11 place-items-center rounded-full active:bg-surface"
        >
          <Avatar name={ME.name} color={ME.color} initial={ME.initial} size={30} />
        </button>
      </div>

      <div className="px-5 pt-3">
        <h1 className="text-[27px] font-bold leading-tight text-ink">今天想去哪？</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
          讓 AI 幫你規劃，也陪你一路玩下去。
        </p>

        <button
          onClick={() => nav.go({ k: "search", q: "" })}
          className="mt-4 flex w-full items-center gap-2.5 rounded-2xl bg-surface px-4 py-4 text-left active:bg-surface-2"
        >
          <SearchIcon />
          <span className="text-[14.5px] text-ink-3">搜尋城市、景點或想做的事</span>
        </button>

        {/* Two doors, and the loud one moves. When a trip exists, the card
            below is what the traveller came back for, so planning a new one
            steps back to grey rather than competing with it. */}
        <div className="mt-2.5 flex gap-2.5">
          <div className="flex-1">
            <Button
              variant={hasTrip ? "secondary" : "primary"}
              onClick={() => nav.go({ k: "create" })}
            >
              ✨ AI 幫我規劃
            </Button>
          </div>
          <div className="flex-1">
            {/* Not 探索附近. The app never asks for geolocation — MapView says so
                itself, and MapTab labels its distances 距地圖中心 for exactly
                this reason. Opened without a trip the map is the whole island at
                zoom 7, which is not anybody's 附近. */}
            <Button variant="secondary" onClick={() => nav.go({ k: "map" })}>
              🗺 在地圖上找
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------- 2 · next trip */

function when(trip: Trip): string {
  if (trip.phase === "ongoing") return `今天是第 ${trip.today} 天`;
  if (trip.daysUntil === undefined) return trip.dates;
  if (trip.daysUntil === 0) return "今天出發";
  if (trip.daysUntil === 1) return "明天出發";
  return `還有 ${trip.daysUntil} 天出發`;
}

/** Distinct places on the itinerary — a lunch spot visited twice is one place. */
const tripPois = (trip: Trip): string[] => [
  ...new Set(trip.days.flatMap((d) => d.tracks.flatMap((t) => t.stops)).map((s) => s.poiId)),
];

function NextTrip({ trip }: { trip: Trip }) {
  const nav = useNav();
  /* Only an ongoing trip has a "today" to start. `today` is a required field, so
     every planned trip carries a 1 and the button typechecked happily — the
     demo opens with no ongoing trip at all, which put 開始今天行程 on a trip
     leaving in two days, directly under the line saying so. */
  const started = trip.phase === "ongoing";
  const places = tripPois(trip);
  const withStory = places.filter((id) => poi(id).storyId).length;
  const day1 = trip.days.find((d) => d.n === 1) ?? trip.days[0];
  const first = (day1?.tracks.flatMap((t) => t.stops) ?? []).slice(0, 4);

  return (
    <div className="mt-6 px-5">
      <Card className="p-4">
        {/* A trip you are on day 2 of is not your "next" trip. The eyebrow read
            你的下一段旅程 directly above 今天是第 2 天, which is the card
            contradicting itself — reachable the moment the demo starts the
            Tainan trip, since focusTrip prefers an ongoing one. */}
        <div className="text-[12.5px] font-semibold text-ink-3">
          {started ? "行程進行中" : "你的下一段旅程"}
        </div>
        <div className="mt-1 truncate text-[20px] font-bold leading-tight text-ink">
          {trip.title}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-ink-3">
          <span className="num">{when(trip)}</span>
          <span aria-hidden>·</span>
          <span className="num">{places.length} 個景點</span>
          {withStory > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="num inline-flex items-center gap-1">
                <Headphones size={11} />
                {withStory} 個有語音故事
              </span>
            </>
          )}
        </div>

        {/* PoiImage, not Cover. Cover only ever draws the generated graphic, so
            this strip was the one place on the screen that would keep drawing
            the stand-in after a real photograph landed in the manifest — the
            same place rendering as a photo in the story rail and as a poster
            here, two sections apart. */}
        {first.length > 0 && (
          <div className="mt-3.5 flex gap-2">
            {first.map((s) => (
              <PoiImage
                key={s.id}
                poi={poi(s.poiId)}
                height={56}
                radius={12}
                emoji={false}
                className="flex-1"
              />
            ))}
          </div>
        )}

        {/* Whichever it is, it is the one orange button on the screen — the hero
            drops to grey the moment a trip exists. */}
        <div className="mt-4">
          {started ? (
            /* Today Mode, not the day timetable. 開始今天行程 sent the traveller
               to the full DayPlan — which is what 完整行程 is for — and left
               screens/Today.tsx unreachable: nothing in the app navigated to
               { k: "today" } at all. The screen exists, App renders it, and this
               is its one door. */
            <Button onClick={() => nav.go({ k: "today", tripId: trip.id })}>
              開始今天行程
            </Button>
          ) : (
            <Button onClick={() => nav.go({ k: "trip", id: trip.id })}>查看完整行程</Button>
          )}
        </div>
        {started && (
          <div className="mt-1">
            <Button variant="ghost" onClick={() => nav.go({ k: "trip", id: trip.id })}>
              查看完整行程
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * No trip, and no sales pitch about it. The planner is already the orange
 * button in the hero; this row only has to say what the empty space means.
 */
function NoTrip() {
  const nav = useNav();
  return (
    <div className="mt-6 px-5">
      <Card onClick={() => nav.go({ k: "create" })} className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-ink">還沒有旅程</div>
          <div className="mt-0.5 text-[13px] text-ink-3">讓 AI 幫你排一趟</div>
        </div>
        <span className="shrink-0 text-[15px] text-ink-3">›</span>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------- 3 · destinations */

/** Stable per-id jitter, so two cities never draw the identical horizon. */
function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Towards white when `t` is negative, towards ink when positive. */
function tone(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = t < 0 ? 255 : 22;
  const k = Math.abs(t);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (target - c) * k),
  );
  return `rgb(${ch.join(",")})`;
}

/**
 * A city's cover, built the way `Cover` builds a place's: layered gradients,
 * every value derived from the record itself, nothing to load. Cover takes a
 * Poi and a Destination is not one, so the scene is assembled here from the
 * destination's own tint rather than by widening a shared component.
 */
function destScene(d: Destination): string {
  const n = seed(d.id);
  const horizon = 58 + (n % 13) - 6;
  const sunX = 20 + (n % 60);
  const hills = 34 + (n % 30);
  const land = tone(d.tint, 0.24);
  const deep = tone(d.tint, 0.46);
  const sky = tone(d.tint, -0.4);
  return [
    `radial-gradient(52% 60% at ${sunX}% ${horizon - 20}%, rgba(255,241,214,.7) 0%, transparent 70%)`,
    `radial-gradient(64% 30% at ${hills}% ${horizon}%, ${land} 0%, transparent 72%)`,
    `radial-gradient(56% 24% at ${100 - hills}% ${horizon + 2}%, ${land} 0%, transparent 74%)`,
    `linear-gradient(180deg, transparent ${horizon}%, ${land} ${horizon}%, ${deep} 100%)`,
    `linear-gradient(180deg, ${sky} 0%, ${d.tint} ${horizon}%)`,
  ].join(",");
}

/**
 * A city's picture: the manifest's photograph of one of its places once that
 * photograph has been shot, the generated scene until then.
 *
 * `PoiImage` needs a Poi and a Destination is not one, so the fallback stays
 * assembled from the destination's own tint rather than widening a shared
 * component — and the swap happens on its own the day a file lands in the
 * manifest, with no edit here.
 */
function DestCover({ d }: { d: Destination }) {
  const shot = poisForDest(d.id).find((p) => photoFor(p));
  if (shot) {
    return <PoiImage poi={shot} height={112} radius={16} emoji={false} className="w-full" />;
  }
  return (
    <div
      className="relative h-[112px] overflow-hidden rounded-2xl"
      style={{ background: destScene(d) }}
    >
      <span className="absolute inset-0 grid place-items-center text-[36px]" aria-hidden>
        {d.emoji}
      </span>
    </div>
  );
}

function Destinations() {
  const nav = useNav();
  return (
    <section className="mt-8">
      {/* Not 熱門. This rail is `DESTINATIONS.filter(country === "tw")` in the
          order somebody typed them, and nothing in the repo measures popularity.
          Refusing to fabricate a trip count on the card and then claiming the
          ranking in the heading would be the same lie, one line higher. */}
      <h2 className="mb-3 px-5 text-[17px] font-bold text-ink">探索台灣</h2>
      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {TW_DESTINATIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => nav.go({ k: "dest", id: d.id })}
            className="w-[168px] shrink-0 text-left"
          >
            <DestCover d={d} />
            <div className="mt-2 text-[15.5px] font-bold text-ink">{d.name}</div>
            {/* The tagline, not a trip count. A fabricated popularity number is
                the cheapest way to lose a reader who checks. */}
            <div className="truncate text-[12.5px] text-ink-3">{d.tagline}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ 4 · services */

/**
 * One service, as a card rather than an icon in a strip.
 *
 * The strip this replaces was four 48px circles with a one-word caption, which
 * reads as a settings menu: something you scan past. A card with a line telling
 * you what happens when you tap it is the difference between a label and a
 * door.
 *
 * That line is not orange. index.css reserves brand orange for "primary CTA,
 * selected state, AI highlight only", and a shelf of four services is none of
 * the three — four orange lines in a 2×2 grid is four adverts arguing with the
 * one orange button on the screen, which belongs to the trip.
 */
function ServiceCard({
  icon,
  label,
  cta,
  onClick,
}: {
  icon: string;
  label: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <Card onClick={onClick} className="flex min-h-[92px] flex-col p-4">
      <span className="text-[20px] leading-none" aria-hidden>
        {icon}
      </span>
      <span className="mt-2.5 block text-[14.5px] font-bold leading-tight text-ink">{label}</span>
      <span className="mt-1 block text-[12.5px] font-semibold leading-tight text-ink-2">{cta}</span>
    </Card>
  );
}

/**
 * Four doors, no logos.
 *
 * Need first, provider second: Klook and Booking exist on the screen after this
 * one, once the traveller has said what they are trying to do. Naming a
 * platform here would advertise a relationship this app does not have, and
 * would make the home screen of a travel assistant look like a marketplace.
 */
function Services({ destId }: { destId?: string }) {
  const nav = useNav();
  return (
    <section className="mt-8">
      <h2 className="px-5 text-[17px] font-bold text-ink">旅程服務</h2>
      <p className="mb-3 mt-1 px-5 text-[13px] text-ink-3">門票、住宿、交通，一起準備好。</p>

      <div className="grid grid-cols-2 gap-2.5 px-5">
        <ServiceCard
          icon="🎟"
          label="門票・體驗"
          cta="查看景點票券"
          onClick={() => nav.go({ k: "tickets", destId })}
        />
        <ServiceCard
          icon="🏨"
          label="住宿"
          cta="比較住宿平台"
          onClick={() => nav.go({ k: "stay", destId })}
        />
        <ServiceCard
          icon="🚆"
          label="交通"
          cta="查看交通選項"
          onClick={() => nav.go({ k: "transport", destId })}
        />
        <ServiceCard
          icon="🚗"
          label="租車・接送"
          cta="查看租車與接送"
          onClick={() => nav.go({ k: "carrental", destId })}
        />
      </div>

      {/* Everything that did not earn a tile. Deliberately not a fifth card:
          a sheet of odds and ends should not look like a service. */}
      <div className="mt-1.5 px-5">
        <button
          onClick={nav.moreServices}
          className="flex min-h-12 w-full items-center gap-2 rounded-xl px-1 text-left text-[13px] font-semibold text-ink-3 transition active:bg-surface"
        >
          <span aria-hidden>▦</span>
          {/* The four names are MORE_SERVICES, in its order. The row used to
              preview 保險, which is not what the sheet calls it (旅平險), and
              skipped 機票比價 — the first thing actually behind the tap. */}
          <span className="flex-1">更多服務（機票 · eSIM · 旅平險 · 優惠券）</span>
          <span className="text-[15px]" aria-hidden>
            ›
          </span>
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- 5 · stories */

/**
 * Places worth listening to, ordered by how likely they are to be reachable:
 * the focused trip's city first, then the rest of Taiwan, then abroad.
 *
 * Every story, not the first five. The rail used to stop at five and hand the
 * rest to a 探索更多故事 link, but there is no route that lists stories — the
 * link ran "故事" through the free-text search, which matches on POI name, area,
 * about and city and therefore matched nothing at all. A rail scrolls; that is
 * what it is for, and it beats a control whose only outcome was 找不到「故事」的結果.
 */
function storyRail(destId?: string): Story[] {
  const twIds = new Set(TW_DESTINATIONS.map((d) => d.id));
  const here = destId ? storiesForDest(destId) : [];
  const seen = new Set(here.map((s) => s.id));
  const rest = STORIES.filter((s) => !seen.has(s.id));
  const tw = rest.filter((s) => twIds.has(poi(s.poiId).destId));
  const abroad = rest.filter((s) => !twIds.has(poi(s.poiId).destId));
  return [...here, ...tw, ...abroad];
}

/**
 * Not "AI 語音導覽". Nobody wakes up wanting a feature — they want to know why
 * the wall in front of them is held together with oyster shells. So the card
 * sells the place, and the headphone mark is the only hint that there is a
 * recording behind it.
 */
function StoryPlaces({ rail }: { rail: Story[] }) {
  const nav = useNav();
  if (!rail.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-1.5 px-5 text-ink">
        <Headphones size={15} />
        <h2 className="text-[17px] font-bold">有故事的地方</h2>
      </div>

      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {rail.map((s) => {
          const p = poi(s.poiId);
          return (
            <button
              key={s.id}
              onClick={() => nav.go({ k: "poi", id: s.poiId })}
              className="w-[150px] shrink-0 text-left"
            >
              <PoiImage poi={p} height={96} radius={16} />
              <div className="mt-2 truncate text-[14.5px] font-bold text-ink">{p.name}</div>
              <div className="truncate text-[12.5px] text-ink-3">{s.hook}</div>
              <div className="mt-1 flex items-center gap-1 text-ink-3">
                <Headphones size={11} />
                <span className="num text-[12px]">{s.minutes} 分鐘</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
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
