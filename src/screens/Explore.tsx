import { ME, STORIES, TW_DESTINATIONS, poi, storiesForDest } from "../data";
import { Cover } from "../components/Cover";
import { Avatar, Button, Card, Headphones, Screen } from "../components/ui";
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
      <Needs destId={destId} />
      <StoryPlaces rail={rail} />
      <div className="h-24" />
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

/** Ongoing beats planned; among the planned, the one leaving soonest. */
function focusTrip(trips: Trip[]): Trip | undefined {
  const ongoing = trips.find((t) => t.phase === "ongoing");
  if (ongoing) return ongoing;
  /* `daysUntil` is optional, so a trip without one sorts to the back rather
     than to the front — an unknown departure is not an imminent one. */
  return [...trips].sort((a, b) => (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999))[0];
}

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
        <div className="text-[12.5px] font-semibold text-ink-3">你的下一段旅程</div>
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

        {first.length > 0 && (
          <div className="mt-3.5 flex gap-2">
            {first.map((s) => (
              <Cover
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
            <Button onClick={() => nav.go({ k: "day", tripId: trip.id, n: trip.today })}>
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
            <div
              className="relative h-[112px] overflow-hidden rounded-2xl"
              style={{ background: destScene(d) }}
            >
              <span className="absolute inset-0 grid place-items-center text-[36px]" aria-hidden>
                {d.emoji}
              </span>
            </div>
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

/* --------------------------------------------------------------- 4 · needs */

function NeedTile({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-2 transition active:opacity-55"
    >
      <span className="grid size-12 place-items-center rounded-full bg-surface text-[21px]">
        {icon}
      </span>
      <span className="whitespace-nowrap text-[12px] text-ink-2">{label}</span>
    </button>
  );
}

/**
 * Four doors, no logos.
 *
 * Which platform a booking eventually goes through is a detail of the next
 * screen, not something to advertise on the home screen of an app that has no
 * agreement with any of them.
 */
function Needs({ destId }: { destId?: string }) {
  const nav = useNav();
  return (
    <section className="mt-8">
      <h2 className="px-5 text-[17px] font-bold text-ink">旅程需要</h2>
      {/* `destId` is the focused trip's, so its absence means there is no trip —
          and telling somebody 行程排好了 when they have not planned anything is
          the app describing a screen other than the one they are looking at. */}
      <p className="mb-2 mt-1 px-5 text-[13px] text-ink-3">
        {destId ? "行程排好了，剩下的也一起準備。" : "門票、住宿、交通，出發前一起準備。"}
      </p>

      <div className="grid grid-cols-4 px-4">
        <NeedTile icon="🎟" label="門票" onClick={() => nav.go({ k: "tickets", destId })} />
        <NeedTile icon="🏨" label="住宿" onClick={() => nav.go({ k: "stay", destId })} />
        <NeedTile icon="🚆" label="交通" onClick={() => nav.go({ k: "transport", destId })} />
        <NeedTile icon="🚗" label="租車" onClick={() => nav.go({ k: "carrental", destId })} />
      </div>

      <div className="px-5">
        <button
          onClick={nav.moreServices}
          className="-mx-2 inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-ink-3 active:opacity-60"
        >
          其他服務（保險 · eSIM · 優惠券）
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
              <Cover poi={p} height={96} radius={16} />
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
