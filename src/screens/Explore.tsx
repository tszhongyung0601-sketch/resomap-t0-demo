import { useMemo, useState } from "react";
import { TW_DESTINATIONS, dest, poi, poisForDest, storiesForDest } from "../data";
import { BrandBar } from "../components/BrandBar";
import { PoiImage } from "../components/Cover";
import { MapCredit, MapView, PinLegend, type MapPin } from "../components/MapView";
import { Button, Card, Headphones, Screen, Tag } from "../components/ui";
import { distance } from "../lib/geo";
import { hasStory, playLabel, rating, storyRail } from "../lib/story";
import { focusTrip } from "../lib/trip";
import { useNav } from "../nav";
import type { Destination, Poi, Story, Trip } from "../types";

/**
 * Home. The map leads, and everything else scrolls past it.
 *
 * The old version opened with a headline, a grey search button and two grey
 * buttons — four rows of chrome before anything about a place. What it is now
 * is the boss's own mock-up: the orange bar, the island full of pins, a search
 * field sitting on the map's lower edge, and then the two things a traveller
 * actually came back for — what there is to listen to, and the trip they are on.
 *
 * The map is a block, not a screen. It is ~380px tall and the page keeps
 * scrolling underneath it, which is the difference between "the map leads" and
 * "the app is a map".
 *
 * Orange budget: the BrandBar is brand rather than action, and the single
 * filled orange button belongs to the trip card. Nothing else on this screen is
 * allowed to be orange — which is why the preview buttons in the guide rail are
 * grey, and why 看全部導覽 is a card and not a CTA.
 */
export function Explore({ trips }: { trips: Trip[] }) {
  const trip = focusTrip(trips);

  return (
    <Screen>
      <BrandBar />
      <MapBlock trip={trip} />
      <GuideRail destId={trip?.destId} />
      {trip ? <NextTrip trip={trip} /> : <NoTrip />}
      {/* shrink-0 or it collapses: Screen is a flex column, and a spacer with no
          content is the first thing flexbox takes back when the page overflows. */}
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

/* ------------------------------------------------- 1 · the map, and search */

/** Roughly the centre of the island, framed so the whole of Taiwan fits. */
const TW_CENTRE: [number, number] = [23.75, 120.95];
const TW_ZOOM = 7;

/** Distinct places on the itinerary — a lunch spot visited twice is one place. */
const tripPois = (trip: Trip): string[] => [
  ...new Set(trip.days.flatMap((d) => d.tracks.flatMap((t) => t.stops)).map((s) => s.poiId)),
];

/**
 * The place that stands in for a city on the island map.
 *
 * `MapPin` takes a `Poi` and a `Destination` is not one, so a city cannot pin
 * itself. Rather than widen the shared map component for one screen, each city
 * is pinned at a real place inside it, chosen by a rule that keeps the pin's
 * colour truthful:
 *
 *   · the city's most-played guide, when it has one — so an orange pin is
 *     orange because that exact place has a recording, and the city does too;
 *   · otherwise the place nearest the city centre, which has no guide, and
 *     neither does anything else in that city, so navy is true both ways.
 *
 * The two readings — "this place has a guide" and "this city has a guide" — can
 * therefore never disagree, which is the only thing that would make the legend
 * a lie. `plays` is demo data, but it is only choosing which of a city's own
 * places to drop the pin on; no number reaches the screen from it.
 */
function anchorFor(d: Destination): Poi | undefined {
  const top = [...storiesForDest(d.id)].sort((a, b) => b.plays - a.plays)[0];
  if (top) return poi(top.poiId);
  /* 交通 is a station, not somewhere you go. It would be the nearest thing to
     most city centres and the least useful pin on the map. */
  const here = poisForDest(d.id).filter((p) => p.kind !== "transit");
  return [...here].sort((a, b) => distance(d, a) - distance(d, b))[0];
}

const TW_ANCHORS: Poi[] = TW_DESTINATIONS.map(anchorFor).filter((p): p is Poi => Boolean(p));

/**
 * Two pin languages, because the map does two jobs.
 *
 * Choosing a city: colour is the answer to「哪裡有得聽」, so the pin is toned and
 * the legend explains it. Looking at a trip: the question is「這趟會去哪」, the
 * stops are metres apart and genuinely cluster — 24 of the 66 pairs on the 台南
 * itinerary overlap at the zoom it fits to — so most colours would be hidden
 * inside a bubble reading "5", and a key explaining a colour you cannot see is
 * the decoration-pretending-to-be-data this app keeps deleting. There the pins
 * stay the app's ordinary white emoji, and the guides are announced by the rail
 * directly underneath and by the 🎧 badges on the timeline.
 */
const cityPin = (p: Poi): MapPin => ({ poi: p, tone: hasStory(p.id) ? "story" : "plain" });
const stopPin = (p: Poi): MapPin => ({ poi: p });

/**
 * Two maps, one component.
 *
 * No trip: the island, one pin per Taiwan destination, tapping one opens that
 * city. This is what the 探索台灣 card grid used to do, done in the place
 * somebody would actually look for it.
 *
 * A trip: that city, pinned with the places the itinerary genuinely visits.
 * Which trip is `focusTrip`'s answer and nobody else's — the same rule the
 * card at the bottom of this screen and the deals tab both read, so the map can
 * never open on a different city than the card underneath it.
 */
function MapBlock({ trip }: { trip?: Trip }) {
  const nav = useNav();
  /**
   * The island view, asked for while a trip exists.
   *
   * Without this the overview is unreachable in practice: App's INITIAL always
   * holds two trips, so `focusTrip` always answers and the map always opens on a
   * city. The one thing the boss's own mockup shows — Taiwan covered in pins —
   * would never appear in a demo. It is a view, not a preference, so it lives in
   * component state and resets when the screen does.
   */
  const [island, setIsland] = useState(false);
  const focused = trip && !island ? trip : undefined;
  const here = focused ? dest(focused.destId) : undefined;
  /** The trip's city, whichever view is showing — the chip's label needs it. */
  const home = trip ? dest(trip.destId)?.name : undefined;

  const pins = useMemo<MapPin[]>(
    () =>
      focused
        ? tripPois(focused).map(poi).filter(Boolean).map(stopPin)
        : TW_ANCHORS.map(cityPin),
    [focused],
  );

  return (
    <div className="relative shrink-0 pb-6">
      <div className="relative h-[380px] overflow-hidden">
        <MapView
          /* Remount when the map changes job: `centre` and `zoom` are the
             container's initial view, so switching between the island and a
             trip without a new key would leave the old framing in place. */
          key={here?.id ?? "tw"}
          pins={pins}
          centre={here ? [here.lat, here.lng] : TW_CENTRE}
          zoom={here?.zoom ?? TW_ZOOM}
          fit={Boolean(here)}
          /* The eight city anchors do not overlap at zoom 7 — grouping them hid
             three cities behind a bubble reading "3", directly under a chip that
             says there are eight. A trip's own stops keep clustering: they are
             metres apart, not kilometres. */
          spread={!focused}
          onPick={(p) =>
            /* An anchor pin belongs to the city it sits in, so the destination
               comes off the place itself rather than from a parallel lookup
               that could drift out of step with the pin list. */
            focused ? nav.go({ k: "poi", id: p.id }) : nav.go({ k: "dest", id: p.destId })
          }
        />

        {/* Tappable only when there is another view to go to. With no trip at
            all the island is the only thing the map can show, and a control that
            returns you to where you already are is the dead control this app
            keeps removing. */}
        <MapChip
          onClick={trip ? () => setIsland((v) => !v) : undefined}
          action={home ? (island ? `回到${home}` : "看全台") : undefined}
        >
          {here ? `${here.name}・這趟會去的地方` : `台灣 ${TW_DESTINATIONS.length} 座城市`}
        </MapChip>
        {/* Only where the colour is the message. */}
        {!focused && <PinLegend />}

        {/* The tile licence requires the attribution to be visible, and its own
            corner is where the search field lands. `MapCredit` pins itself to
            its nearest positioned ancestor, so it is given one that stops short
            of the field rather than being left underneath it. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[30px]">
          <MapCredit />
        </div>
      </div>

      {/* Straddling the edge: 24px of the field is over the map and 24px is over
          the page, which is what `pb-6` on the wrapper leaves room for. The
          wrapper is deliberately not `overflow-hidden` — the map is, and the
          field has to be able to hang out of it. */}
      <button
        onClick={() => nav.go({ k: "search", q: "" })}
        className="absolute inset-x-4 bottom-0 z-20 flex h-12 items-center gap-2.5 rounded-full bg-bg px-4 text-left shadow-[0_4px_18px_rgba(0,0,0,.16)] active:bg-surface"
      >
        <SearchIcon />
        <span className="truncate text-[14.5px] text-ink-3">
          {here ? `搜尋${here.name}的景點、美食` : "搜尋城市、景點或想做的事"}
        </span>
      </button>
    </div>
  );
}

/**
 * What the map is showing, and — when there is a choice — what tapping does.
 *
 * The label states the state and the action states the destination, because a
 * bare chevron on a chip that reads 「台南・這趟會去的地方」 does not tell anybody
 * where it goes. The tap target is extended past the 30px visual with an
 * ::after, the same trick Chip and Tabs use, rather than padding the pill to
 * 44px and turning a caption into a button.
 */
function MapChip({
  children,
  onClick,
  action,
}: {
  children: string;
  onClick?: () => void;
  action?: string;
}) {
  const base =
    "absolute left-2.5 top-2.5 z-10 max-w-[74%] rounded-xl bg-bg/92 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-2 shadow-sm backdrop-blur";

  if (!onClick) {
    return <span className={`pointer-events-none truncate ${base}`}>{children}</span>;
  }

  return (
    <button
      onClick={onClick}
      aria-label={action}
      className={`${base} flex items-center gap-1.5 text-left after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-[''] active:bg-surface`}
    >
      <span className="truncate">{children}</span>
      <span className="shrink-0 border-l border-line pl-1.5 text-brand">{action}</span>
    </button>
  );
}

/* ---------------------------------------------------------- 2 · the guides */

/**
 * Places worth listening to, this trip's city first.
 *
 * The ordering is `storyRail`'s, which 導覽庫 calls too — a guide that is third
 * here and eleventh there would be two different answers to the same question.
 *
 * `Tag kind="demo"` sits once, on the section title. `plays` and `likes` are
 * invented and `rating` is derived from them, so the disclosure belongs to the
 * block that shows them; repeating it on all fifteen cards turns a disclosure
 * into wallpaper and stops anybody reading it.
 */
function GuideRail({ destId }: { destId?: string }) {
  const nav = useNav();
  const rail = storyRail(destId);
  if (!rail.length) return null;

  return (
    <section className="mt-7">
      <div className="flex items-center gap-1.5 px-5 text-ink">
        <Headphones size={15} />
        <h2 className="text-[17px] font-bold">有故事的地方</h2>
        <Tag kind="demo" />
      </div>
      <p className="mb-3 mt-1 px-5 text-[12.5px] text-ink-3">
        語音導覽免費，可以先試聽 30 秒。
      </p>

      <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {rail.map((s) => (
          <GuideCard key={s.id} story={s} />
        ))}

        {/* The end of the rail, not a heading action. Somebody who has scrolled
            fifteen cards is the person asking for the rest of them. */}
        <button
          onClick={() => nav.tab("library")}
          className="flex w-[112px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-surface px-3 text-[13.5px] font-bold text-ink-2 active:bg-surface-2"
        >
          <span>看全部導覽</span>
          <span className="text-[16px]" aria-hidden>
            ›
          </span>
        </button>
      </div>
    </section>
  );
}

/**
 * One guide.
 *
 * Two targets rather than one: the card opens the place, the pill plays the 30
 * 秒 edit without leaving home — the whole point of a short cut is that you can
 * hear it while deciding. They are siblings rather than nested, because a
 * button inside a button is invalid markup and behaves differently in every
 * browser.
 *
 * No price, ever. The guides are free, and a card that shows a figure teaches
 * the opposite in one glance.
 */
function GuideCard({ story }: { story: Story }) {
  const nav = useNav();
  const p = poi(story.poiId);

  return (
    <div className="w-[184px] shrink-0">
      <button onClick={() => nav.go({ k: "poi", id: story.poiId })} className="w-full text-left">
        <div className="relative">
          <PoiImage poi={p} height={112} radius={16} className="w-full" />
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <Headphones size={10} />
            <span className="num">{story.minutes} 分鐘</span>
          </span>
        </div>

        <div className="mt-2 truncate text-[14.5px] font-bold text-ink">{p.name}</div>
        <div className="truncate text-[12.5px] text-ink-3">{story.hook}</div>

        {/* The rating is `likes / plays`, and both of its inputs are printed
            next to it — a reader who doubts the 4.7 can check the arithmetic
            rather than take it on faith. */}
        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-3">
          <span className="num font-semibold text-ink-2">★ {rating(story).toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span className="num">{playLabel(story.plays)}</span>
        </div>
      </button>

      <button
        onClick={() => nav.play(story.poiId, "short")}
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-surface text-[13px] font-bold text-ink active:bg-surface-2"
      >
        <PlayIcon />
        試聽 30 秒
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ 3 · the trip */

function when(trip: Trip): string {
  if (trip.phase === "ongoing") return `今天是第 ${trip.today} 天`;
  if (trip.daysUntil === undefined) return trip.dates;
  if (trip.daysUntil === 0) return "今天出發";
  if (trip.daysUntil === 1) return "明天出發";
  return `還有 ${trip.daysUntil} 天出發`;
}

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
    <div className="mt-7 px-5">
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

        {/* The one filled orange button on the screen. The BrandBar above is a
            field, not a control, and nothing in the guide rail is orange, so
            this is the only thing on the page asking to be pressed. */}
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

      {/* What is left of 旅程服務.
          The 2×2 tile grid went with the rest of the old page: four doors to a
          shop, above the fold, on the home screen of a travel assistant. This
          is the same supply behind one quiet row — and only once a trip exists,
          because 為你推薦 is scoped to the trip's city and without one the
          whole screen is a window nobody asked to look in. */}
      <button
        onClick={() => nav.go({ k: "deals" })}
        className="mt-1.5 flex min-h-12 w-full items-center gap-2 rounded-xl px-1 text-left text-[13px] font-semibold text-ink-3 transition active:bg-surface"
      >
        <span aria-hidden>🎟</span>
        <span className="flex-1">行程服務（門票 · 住宿 · 交通 · 租車）</span>
        <span className="text-[15px]" aria-hidden>
          ›
        </span>
      </button>
    </div>
  );
}

/**
 * No trip, and no sales pitch about it. One row that says what the empty space
 * means and opens the planner — not a list of what the traveller has not booked
 * yet.
 */
function NoTrip() {
  const nav = useNav();
  return (
    <div className="mt-7 px-5">
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

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M3 1.6 10 6l-7 4.4z" />
    </svg>
  );
}
