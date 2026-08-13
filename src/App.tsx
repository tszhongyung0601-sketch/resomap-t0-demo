import { useCallback, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AdaptCard } from "./components/AdaptCard";
import { OutboundSheet } from "./components/DealCard";
import { ArrivalSheet, StoryPlayer } from "./components/Story";
import { Button, Sheet, Thumb } from "./components/ui";
import { ADAPTS, HUALIEN_TRIP, TAINAN_TRIP, TOKYO_TRIP, poi, poisForDest } from "./data";
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
import { MoreServicesSheet, ServiceFlow, StayFlow } from "./screens/Services";
import { Profile } from "./screens/Profile";
import { AdminDemo } from "./screens/AdminDemo";
import { DemoPanel } from "./screens/DemoPanel";
import type { Deal, Trip } from "./types";

/** The demo starts before anything has been booked. */
const INITIAL: Trip[] = [
  { ...HUALIEN_TRIP },
  { ...TOKYO_TRIP },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("explore");
  const [stack, setStack] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>(INITIAL);

  /* overlays — these sit above whatever screen is showing */
  const [deal, setDeal] = useState<Deal | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ tripId: string; day: number } | null>(null);
  const [services, setServices] = useState(false);
  const [aiSheet, setAiSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /** Which adapt card is currently live, if any. */
  const [adapt, setAdapt] = useState<string | null>(null);

  const route: Route | null = stack[stack.length - 1] ?? null;
  const ongoing = trips.find((t) => t.phase === "ongoing") ?? null;
  const focusTrip = ongoing ?? trips[0] ?? null;

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const nav: Nav = useMemo(
    () => ({
      go: (r) => setStack((s) => [...s, r]),
      back: () => setStack((s) => s.slice(0, -1)),
      tab: (t) => {
        setStack([]);
        setTab(t);
      },
      openDeal: (d) => setDeal(d),
      arrive: (poiId) => setArrival(poiId),
      play: (poiId) => setStory(poiId),
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
        const fresh: Trip = {
          ...TAINAN_TRIP,
          id: `trip-${destId}`,
          destId,
          phase: "upcoming",
          daysUntil: 7,
        };
        setTrips((l) => [fresh, ...l]);
        setStack([{ k: "trip", id: fresh.id }]);
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
    setArrival(null);
    setStory(null);
    setDeal(null);
    setStack([]);
    setTab("explore");
  }

  function startTainan() {
    setTrips((l) => [{ ...TAINAN_TRIP }, ...l.filter((t) => t.id !== TAINAN_TRIP.id)]);
    setAdapt(null);
    setStack([]);
    setTab("explore");
  }

  function fireAdapt(id: string) {
    const a = ADAPTS.find((x) => x.id === id);
    if (!a) return;
    setTrips((l) => {
      const has = l.some((t) => t.id === a.tripId);
      const base = has ? l : [{ ...TAINAN_TRIP }, ...l];
      return base.map((t) =>
        t.id === a.tripId ? { ...t, phase: "ongoing" as const, today: a.day } : t,
      );
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
    setAdapt(null);
  }

  function arriveDemo() {
    setTrips((l) => {
      const has = l.some((t) => t.id === TAINAN_TRIP.id);
      const base = has ? l : [{ ...TAINAN_TRIP }, ...l];
      return base.map((t) =>
        t.id === TAINAN_TRIP.id ? { ...t, phase: "ongoing" as const, today: 2 } : t,
      );
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
  const ai = useMemo(() => {
    if (story) return null;
    /* Screens that already end in a decision get no competing button. */
    if (route && route.k !== "day") return null;
    if (adapt) return null;

    if (route?.k === "day") {
      return { label: "調整行程", onClick: () => setAiSheet(true) };
    }
    if (tab === "explore") {
      return ongoing
        ? { label: "調整行程", onClick: () => setAiSheet(true) }
        : { label: "問 AI", onClick: () => setAiSheet(true) };
    }
    if (tab === "map") {
      return { label: "附近推薦", onClick: () => setAiSheet(true) };
    }
    if (tab === "trips") {
      return ongoing
        ? { label: "調整行程", onClick: () => setAiSheet(true) }
        : { label: "幫我排", onClick: () => setAiSheet(true) };
    }
    return null;
  }, [route, tab, story, adapt, ongoing]);

  /* ----------------------------------------------------------- the screen */

  let screen: React.ReactNode = null;

  if (route?.k === "search") screen = <Search q={route.q} />;
  else if (route?.k === "dest") screen = <Destination id={route.id} />;
  else if (route?.k === "poi") screen = <Poi id={route.id} />;
  else if (route?.k === "create") screen = <CreateTrip destId={route.destId} />;
  else if (route?.k === "stay") screen = <StayFlow destId={route.destId} />;
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

  return (
    <NavContext.Provider value={nav}>
      <AppShell tab={tab} onTab={nav.tab} showNav={!hideNav} ai={ai}>
        {screen}

        {arrival && !story && (
          <ArrivalSheet
            poiId={arrival}
            onPlay={() => {
              setStory(arrival);
              setArrival(null);
            }}
            onLater={() => setArrival(null)}
          />
        )}

        {story && <StoryPlayer poiId={story} onClose={() => setStory(null)} />}

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
          tab={tab}
          ongoing={ongoing}
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
          <div className="rm-in pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center">
            <span className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white">
              {toast}
            </span>
          </div>
        )}
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
  tab,
  ongoing,
  onAdapt,
  onCreate,
  onPoi,
}: {
  open: boolean;
  onClose: () => void;
  tab: Tab;
  ongoing: Trip | null;
  onAdapt: (id: string) => void;
  onCreate: () => void;
  onPoi: (id: string) => void;
}) {
  if (!open) return null;

  if (ongoing) {
    const mine = ADAPTS.filter((a) => a.tripId === ongoing.id);
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
            {/* The rain scenario lives on the Hualien trip; offer it anyway so
                the presenter can reach it from wherever they are. */}
            {!mine.some((a) => a.trigger === "rain") && (
              <button
                onClick={() => onAdapt("hualien-rain")}
                className="w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
              >
                <div className="text-[15px] font-semibold text-ink">🌧️ 天氣不好</div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">
                  換成室內的替代方案（花蓮）
                </div>
              </button>
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

  if (tab === "map") {
    const near = poisForDest("tainan").slice(0, 3);
    return (
      <Sheet open onClose={onClose} title="附近推薦">
        <div className="px-5 pb-3">
          <p className="text-[13.5px] leading-relaxed text-ink-3">
            照現在的地圖範圍，這三個最順路。
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
                    {near[0] !== p && ` · ${km(distance(near[0], p))}`}
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

function addMinutes(at: string, add: number) {
  const [h, m] = at.split(":").map(Number);
  const v = h * 60 + m + add;
  return `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
