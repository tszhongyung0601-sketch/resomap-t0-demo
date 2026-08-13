import { useCallback, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AdaptCard } from "./components/AdaptCard";
import { OutboundSheet } from "./components/DealCard";
import { ArrivalSheet, StoryPlayer } from "./components/Story";
import { Button, Sheet, Thumb } from "./components/ui";
import {
  ADAPTS,
  HUALIEN_TRIP,
  TAINAN_TRIP,
  TOKYO_TRIP,
  dest,
  poi,
  poisForDest,
} from "./data";
import { applyAdapt } from "./lib/adapt";
import { distance, km } from "./lib/geo";
import { stopSpeaking } from "./lib/speech";
import { track } from "./lib/track";
import { NavContext, type Nav, type Route, type Tab } from "./nav";
import { Explore } from "./screens/Explore";
import { Search } from "./screens/Search";
import { Destination } from "./screens/Destination";
import { Poi } from "./screens/Poi";
import { MapTab } from "./screens/MapTab";
import { CreateTrip } from "./screens/CreateTrip";
import { Trips } from "./screens/Trips";
import { TripHome, DayPlan } from "./screens/TripTimeline";
import { AddPoiSheet } from "./screens/AddPoi";
import { Travellers, Consensus, Alternatives } from "./screens/Group";
import { Deals } from "./screens/Deals";
import {
  CarRentalFlow,
  MoreServicesSheet,
  ServiceFlow,
  StayFlow,
  TransportFlow,
} from "./screens/Services";
import { ProductDetail, Tickets } from "./screens/Tickets";
import { Profile } from "./screens/Profile";
import { AdminDemo } from "./screens/AdminDemo";
import { DemoPanel } from "./screens/DemoPanel";
import type { Deal, StoryLength, Trip } from "./types";

/** The demo starts before anything has been booked. */
const INITIAL: Trip[] = [
  { ...HUALIEN_TRIP },
  { ...TOKYO_TRIP },
];

/** What the floating button is for, right now. One value, two consumers. */
type AiMode = "adjust" | "nearby" | "plan" | "inspire";

const AI_LABEL: Record<AiMode, string> = {
  adjust: "調整行程",
  nearby: "附近推薦",
  plan: "幫我排",
  inspire: "問 AI",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("explore");
  const [stack, setStack] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>(INITIAL);

  /* overlays — these sit above whatever screen is showing */
  const [deal, setDeal] = useState<Deal | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [story, setStory] = useState<{ poiId: string; length: StoryLength } | null>(null);
  const [adding, setAdding] = useState<{ tripId: string; day: number } | null>(null);
  const [services, setServices] = useState(false);
  const [aiSheet, setAiSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /** Which adapt card is currently live, if any. */
  const [adapt, setAdapt] = useState<string | null>(null);
  const [usedAdapts, setUsedAdapts] = useState<string[]>([]);

  const route: Route | null = stack[stack.length - 1] ?? null;
  const ongoing = trips.find((t) => t.phase === "ongoing") ?? null;
  const focusTrip = ongoing ?? trips[0] ?? null;

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const nav: Nav = useMemo(
    () => ({
      trips,
      /* Pushing a route that is already open truncates back to it instead of
         stacking a second copy. Without this, trip -> day -> trip -> day makes
         Back walk the same two screens forever and the 行程 list becomes
         unreachable. */
      go: (r) =>
        setStack((s) => {
          const at = s.findIndex((x) => sameRoute(x, r));
          return at >= 0 ? s.slice(0, at + 1) : [...s, r];
        }),
      back: () => setStack((s) => s.slice(0, -1)),
      tab: (t) => {
        setStack([]);
        setTab(t);
      },
      openDeal: (d) => setDeal(d),
      arrive: (poiId) => setArrival(poiId),
      play: (poiId, length = "full") => setStory({ poiId, length }),
      addTo: (tripId, day) => setAdding({ tripId, day }),
      moreServices: () => setServices(true),

      addPoi: (tripId, day, poiId) => {
        setTrips((list) =>
          list.map((t) => {
            if (t.id !== tripId) return t;
            const days = t.days.map((d) => {
              if (d.n !== day) return d;
              const tracks = [...d.tracks];
              const last = tracks[tracks.length - 1];
              const prev = last.stops[last.stops.length - 1];
              const p = poi(poiId);
              const metres = prev ? distance(poi(prev.poiId), p) : 0;
              tracks[tracks.length - 1] = {
                ...last,
                stops: [
                  ...last.stops,
                  {
                    id: `add-${poiId}-${Date.now()}`,
                    poiId,
                    /* Appended after the day's last stop, not squeezed in. Where
                       exactly it lands is the traveller's call, not ours. */
                    at: addMinutes(prev?.at ?? "10:00", (prev?.stayMin ?? 0) + 20),
                    stayMin: p.stayMin,
                    from: metres
                      ? { mode: "walk" as const, min: Math.max(5, Math.round(metres / 75)), metres }
                      : undefined,
                  },
                ],
              };
              return { ...d, tracks };
            });
            return { ...t, days };
          }),
        );
        track("poi_add", { poiId });
        say(`已加入 Day ${day}`);
      },

      createTrip: (destId) => {
        const existing = trips.find((t) => t.destId === destId);
        if (existing) {
          setStack([{ k: "trip", id: existing.id }]);
          setTab("trips");
          return;
        }
        setTrips((l) => [newTrip(destId), ...l]);
        setStack([{ k: "trip", id: `trip-${destId}` }]);
        setTab("trips");
      },
    }),
    [trips, say],
  );

  /* --------------------------------------------------- demo scenario hooks */

  function reset() {
    stopSpeaking();
    setTrips(INITIAL);
    setAdapt(null);
    setUsedAdapts([]);
    setArrival(null);
    setStory(null);
    setDeal(null);
    setStack([]);
    setTab("explore");
  }

  function startTainan() {
    setTrips((l) => [{ ...TAINAN_TRIP }, ...l.filter((t) => t.id !== TAINAN_TRIP.id)]);
    setAdapt(null);
    setUsedAdapts([]);
    setStack([]);
    setTab("explore");
  }

  /**
   * Exactly one trip may be ongoing.
   *
   * Firing the Hualien scenario while the Tainan one was already running left
   * both marked ongoing, and every `find(t => t.phase === "ongoing")` in the app
   * then silently picked whichever happened to be first in the array.
   */
  const makeOngoing = (list: Trip[], tripId: string, day: number): Trip[] =>
    list.map((t) =>
      t.id === tripId
        ? { ...t, phase: "ongoing" as const, today: day }
        : t.phase === "ongoing"
          ? { ...t, phase: "soon" as const }
          : t,
    );

  function fireAdapt(id: string) {
    const a = ADAPTS.find((x) => x.id === id);
    if (!a) return;
    setTrips((l) => {
      const base = l.some((t) => t.id === a.tripId) ? l : [{ ...TAINAN_TRIP }, ...l];
      return makeOngoing(base, a.tripId, a.day);
    });
    setAdapt(id);
    setAiSheet(false);
    track("adapt_shown");
    setStack([{ k: "day", tripId: a.tripId, n: a.day }]);
    setTab("trips");
  }

  function applyCurrent() {
    const a = ADAPTS.find((x) => x.id === adapt);
    if (!a) return;
    setTrips((l) => l.map((t) => (t.id === a.tripId ? applyAdapt(t, a) : t)));
    /* Once applied, the day has already moved. Offering the same scenario again
       would shift it a second time and call the result a suggestion. */
    setUsedAdapts((u) => [...u, a.id]);
    setAdapt(null);
  }

  function arriveDemo() {
    setTrips((l) => {
      const base = l.some((t) => t.id === TAINAN_TRIP.id) ? l : [{ ...TAINAN_TRIP }, ...l];
      return makeOngoing(base, TAINAN_TRIP.id, 2);
    });
    setStack([{ k: "day", tripId: TAINAN_TRIP.id, n: 2 }]);
    setTab("trips");
    setArrival("chihkan");
  }

  /* --------------------------------------------------- the floating action */

  /**
   * One button, five jobs. Its label is the whole point: an assistant that says
   * "調整行程" while you are standing in the rain is a different product from one
   * that says "AI" everywhere and waits for you to think of something to type.
   */
  /**
   * The label and the sheet are the SAME decision, made once.
   *
   * They used to be computed separately and drifted apart: the button read
   * 附近推薦 on the map while the sheet that opened was 現在怎麼調整？, because
   * one branched on the tab and the other on whether a trip was running. A
   * button that lies about what it does is worse than no button, and this app's
   * whole claim is that the label follows the context — so context is resolved
   * once, here, and both sides read the result.
   */
  const aiMode = useMemo<AiMode | null>(() => {
    if (story || adapt) return null;
    if (route && route.k !== "day") return null;

    if (route?.k === "day") {
      const t = trips.find((x) => x.id === route.tripId);
      return t && ADAPTS.some((a) => a.tripId === t.id) ? "adjust" : "plan";
    }
    if (tab === "map") return "nearby";
    if (tab === "explore") return ongoing ? "adjust" : "inspire";
    if (tab === "trips") return ongoing ? "adjust" : trips.length ? "plan" : "inspire";
    return null;
  }, [route, tab, story, adapt, ongoing, trips]);

  /** The trip the AI would be talking about, if it is talking about one. */
  const aiTrip = useMemo(() => {
    if (route?.k === "day") return trips.find((t) => t.id === route.tripId) ?? ongoing;
    return ongoing;
  }, [route, trips, ongoing]);

  const ai = useMemo(
    () =>
      aiMode
        ? { label: AI_LABEL[aiMode], onClick: () => setAiSheet(true) }
        : null,
    [aiMode],
  );

  /* ----------------------------------------------------------- the screen */

  let screen: React.ReactNode = null;

  if (route?.k === "search") screen = <Search q={route.q} />;
  else if (route?.k === "dest") screen = <Destination id={route.id} />;
  else if (route?.k === "poi") screen = <Poi id={route.id} />;
  else if (route?.k === "create") screen = <CreateTrip destId={route.destId} />;
  else if (route?.k === "stay") screen = <StayFlow destId={route.destId} />;
  else if (route?.k === "tickets") screen = <Tickets destId={route.destId} />;
  else if (route?.k === "product") screen = <ProductDetail id={route.id} />;
  else if (route?.k === "transport") screen = <TransportFlow destId={route.destId} />;
  else if (route?.k === "carrental") screen = <CarRentalFlow destId={route.destId} />;
  else if (route?.k === "service") screen = <ServiceFlow id={route.id} />;
  else if (route?.k === "admin") screen = <AdminDemo />;
  else if (route?.k === "travellers") screen = <Travellers tripId={route.tripId} />;
  else if (route?.k === "consensus") screen = <Consensus tripId={route.tripId} />;
  else if (route?.k === "alternatives") screen = <Alternatives tripId={route.tripId} />;
  else if (route?.k === "demo") {
    screen = (
      <DemoPanel
        onBack={() => nav.back()}
        onStartTainan={startTainan}
        onTainanLate={() => fireAdapt("tainan-late")}
        onHualienRain={() => fireAdapt("hualien-rain")}
        onArrive={arriveDemo}
        onReset={reset}
      />
    );
  } else if (route?.k === "trip") {
    const t = trips.find((x) => x.id === route.id);
    screen = t ? <TripHome trip={t} /> : null;
  } else if (route?.k === "day" || route?.k === "tripmap") {
    const t = trips.find((x) => x.id === route.tripId);
    const a = ADAPTS.find((x) => x.id === adapt);
    screen =
      t && route.k === "day" ? (
        <DayPlan
          trip={t}
          day={route.n}
          banner={
            a && a.tripId === t.id && a.day === route.n ? (
              <AdaptCard
                adapt={a}
                trip={t}
                onApply={applyCurrent}
                onDismiss={() => setAdapt(null)}
              />
            ) : undefined
          }
        />
      ) : t ? (
        <TripRouteMap trip={t} day={route.n} />
      ) : null;
  } else {
    switch (tab) {
      case "map":
        screen = <MapTab destId={focusTrip?.destId ?? null} />;
        break;
      case "trips":
        screen = <Trips trips={trips} />;
        break;
      case "deals":
        screen = <Deals destId={focusTrip?.destId ?? null} />;
        break;
      case "profile":
        screen = <Profile />;
        break;
      default:
        screen = <Explore trips={trips} />;
    }
  }

  const hideNav = route?.k === "create" || Boolean(story);

  const overlay = (
    <>
      {arrival && !story && (
        <ArrivalSheet
          poiId={arrival}
          onPlay={(length) => {
            setStory({ poiId: arrival, length });
            setArrival(null);
          }}
          onLater={() => setArrival(null)}
        />
      )}

      {story && (
        <StoryPlayer
          poiId={story.poiId}
          length={story.length}
          onClose={() => setStory(null)}
        />
      )}

      <OutboundSheet deal={deal} onClose={() => setDeal(null)} />

      {services && <MoreServicesSheet onClose={() => setServices(false)} />}

      {adding && (
        <AddPoiSheet
          tripId={adding.tripId}
          day={adding.day}
          onClose={() => setAdding(null)}
        />
      )}

      <AiSheet
        open={aiSheet}
        onClose={() => setAiSheet(false)}
        mode={aiMode}
        trip={aiTrip}
        destId={focusTrip?.destId ?? null}
        used={usedAdapts}
        onAdapt={fireAdapt}
        onCreate={() => {
          setAiSheet(false);
          nav.go({ k: "create" });
        }}
        onPoi={(id) => {
          setAiSheet(false);
          nav.go({ k: "poi", id });
        }}
      />

      {toast && (
        <div className="rm-in pointer-events-none absolute inset-x-0 bottom-28 z-50 flex justify-center">
          <span className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white">
            {toast}
          </span>
        </div>
      )}
    </>
  );

  return (
    <NavContext.Provider value={nav}>
      <AppShell tab={tab} onTab={nav.tab} showNav={!hideNav} ai={ai} overlay={overlay}>
        {screen}
      </AppShell>
    </NavContext.Provider>
  );
}

/* ------------------------------------------------------------- AI sheet */

/**
 * Options, not a chat box.
 *
 * Every entry here is a thing the app can actually do right now, phrased as the
 * traveller would say it. A text field would be easier to build and worse to
 * use: it puts the burden of knowing what to ask onto somebody who is standing
 * on a street corner.
 */
function AiSheet({
  open,
  onClose,
  mode,
  trip,
  destId,
  used,
  onAdapt,
  onCreate,
  onPoi,
}: {
  open: boolean;
  onClose: () => void;
  mode: AiMode | null;
  /** The trip this sheet is about, when it is about one. */
  trip: Trip | null;
  /** Where the map is currently looking. */
  destId: string | null;
  /** Scenarios already applied — offering them twice double-shifts the day. */
  used: string[];
  onAdapt: (id: string) => void;
  onCreate: () => void;
  onPoi: (id: string) => void;
}) {
  if (!open || !mode) return null;

  if (mode === "adjust" && trip) {
    const mine = ADAPTS.filter((a) => a.tripId === trip.id && !used.includes(a.id));
    return (
      <Sheet open onClose={onClose} title="現在怎麼調整？">
        <div className="px-5 pb-3">
          <p className="text-[13.5px] leading-relaxed text-ink-3">
            ResoMap 會看目前時間、位置與天氣，只在真的需要時才動你的行程。
          </p>
          <div className="mt-4 space-y-2.5">
            {mine.map((a) => (
              <button
                key={a.id}
                onClick={() => onAdapt(a.id)}
                className="w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
              >
                <div className="text-[15px] font-semibold text-ink">
                  {a.icon} {a.trigger === "late" ? "我們晚了" : "天氣不好"}
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">
                  {a.trigger === "late" ? "重排今天剩下的行程" : "換成室內的替代方案"}
                </div>
              </button>
            ))}
            {mine.length === 0 && (
              <p className="rounded-2xl bg-surface p-4 text-[13.5px] leading-relaxed text-ink-3">
                今天沒有需要調整的地方。ResoMap 只在真的有狀況時才會主動出現。
              </p>
            )}
          </div>
          <div className="mt-3">
            <Button variant="ghost" onClick={onClose}>
              先不用
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  if (mode === "nearby") {
    /* Whatever the map is actually showing. Hardcoding 台南 here meant tapping
       附近推薦 on a map of 花蓮 recommended 赤崁樓 — the one place in the app
       that claims to know where you are, getting it wrong on the first tap. */
    const d = destId ? dest(destId) : null;
    const near = destId
      ? [...poisForDest(destId)]
          .sort(
            (a, b) =>
              distance({ lat: d?.lat ?? a.lat, lng: d?.lng ?? a.lng }, a) -
              distance({ lat: d?.lat ?? b.lat, lng: d?.lng ?? b.lng }, b),
          )
          .slice(0, 3)
      : [];

    return (
      <Sheet open onClose={onClose} title="附近推薦">
        <div className="px-5 pb-3">
          <p className="text-[13.5px] leading-relaxed text-ink-3">
            {d ? `照現在的地圖範圍，${d.name}這三個最順路。` : "先選一個地方，再看附近有什麼。"}
          </p>
          <div className="mt-3.5 space-y-1">
            {near.map((p) => (
              <button
                key={p.id}
                onClick={() => onPoi(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left active:bg-surface"
              >
                <Thumb emoji={p.emoji} tint={p.tint} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-ink">
                    {p.name}
                  </div>
                  <div className="text-[12.5px] text-ink-3">
                    {p.area}
                    {d && ` · 距地圖中心 ${km(distance(d, p))}`}
                  </div>
                </div>
                <span className="text-ink-3">›</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="ghost" onClick={onClose}>
              關閉
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="想去哪裡走走？">
      <div className="px-5 pb-3">
        <p className="text-[13.5px] leading-relaxed text-ink-3">
          說一個大概就好，其他 ResoMap 來想。
        </p>
        <div className="mt-4 space-y-2.5">
          {["我有三天假，想吃東西", "這個週末，不想開車", "帶小孩，走不遠"].map((s) => (
            <button
              key={s}
              onClick={onCreate}
              className="w-full rounded-2xl bg-surface p-4 text-left text-[15px] font-semibold text-ink active:bg-surface-2"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={onClose}>
            先不用
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------- trip route map */

function TripRouteMap({ trip, day }: { trip: Trip; day: number }) {
  const nav = useNavSafe();
  const d = trip.days.find((x) => x.n === day) ?? trip.days[0];
  const stops = d.tracks.flatMap((t) => t.stops);
  const pins = stops.map((s, i) => ({ poi: poi(s.poiId), order: i + 1 }));
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = picked ? stops.find((s) => s.poiId === picked) : null;

  return (
    <div className="relative h-full">
      <MapOfTrip pins={pins} onPick={(id) => setPicked(id)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4">
        <button
          onClick={() => nav.back()}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-bg text-[18px] shadow-[0_2px_10px_rgba(0,0,0,.14)]"
          aria-label="返回"
        >
          ‹
        </button>
      </div>
      {chosen && (
        <div className="rm-up absolute inset-x-0 bottom-0 z-20 rounded-t-3xl bg-bg px-5 pb-[88px] pt-4">
          <div className="flex items-center gap-3">
            <Thumb emoji={poi(chosen.poiId).emoji} tint={poi(chosen.poiId).tint} size={52} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] font-bold text-ink">
                {poi(chosen.poiId).name}
              </div>
              <div className="num text-[12.5px] text-ink-3">
                {chosen.at} · 停留 {chosen.stayMin} 分
              </div>
            </div>
            <button
              onClick={() => nav.go({ k: "poi", id: chosen.poiId })}
              className="shrink-0 rounded-full bg-surface px-4 py-2.5 text-[13px] font-bold text-ink"
            >
              查看
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Split out so the map import stays local to where it is used. */
import { MapCredit, MapView, type MapPin } from "./components/MapView";
import { useNav } from "./nav";

function useNavSafe() {
  return useNav();
}

function MapOfTrip({
  pins,
  onPick,
}: {
  pins: MapPin[];
  onPick: (id: string) => void;
}) {
  const centre: [number, number] = pins.length
    ? [pins[0].poi.lat, pins[0].poi.lng]
    : [23.6, 120.96];
  return (
    <>
      <MapView pins={pins} centre={centre} fit route onPick={(p) => onPick(p.id)} />
      <MapCredit />
    </>
  );
}

/* ------------------------------------------------------------------ util */

/** The five days the planner's calendar highlights. */
const PLAN_DAYS = [
  { n: 1, date: "8 月 20 日", weekday: "星期四" },
  { n: 2, date: "8 月 21 日", weekday: "星期五" },
  { n: 3, date: "8 月 22 日", weekday: "星期六" },
  { n: 4, date: "8 月 23 日", weekday: "星期日" },
  { n: 5, date: "8 月 24 日", weekday: "星期一" },
];

/**
 * A trip the planner just created: the chosen city, the dates the planner
 * actually showed, and five empty days.
 *
 * Cloning the Tainan itinerary here was quicker and much worse — picking 高雄
 * produced a trip called "台南 3 天 2 夜" full of Tainan stops, which is the
 * single most obvious way to prove a prototype is a mock-up.
 */
function newTrip(destId: string): Trip {
  const d = dest(destId);
  return {
    id: `trip-${destId}`,
    destId,
    title: `${d?.name ?? "新的旅程"} 5 天 4 夜`,
    dates: "8/20 - 8/24",
    nights: 4,
    phase: "upcoming",
    daysUntil: 7,
    today: 1,
    travellers: [],
    needsStay: true,
    days: PLAN_DAYS.map((p) => ({
      ...p,
      tracks: [{ id: `${destId}-d${p.n}`, who: [], stops: [] }],
    })),
  };
}

/** Two routes are the same screen if they point at the same thing. */
function sameRoute(a: Route, b: Route): boolean {
  if (a.k !== b.k) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function addMinutes(at: string, add: number) {
  const [h, m] = at.split(":").map(Number);
  const v = h * 60 + m + add;
  return `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
