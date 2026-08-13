import { useCallback, useMemo, useState } from "react";
import { AppShell, type Tab } from "./components/AppShell";
import { AdaptCard } from "./components/AdaptCard";
import { ArrivalSheet, StoryPlayer } from "./components/Story";
import { Sheet, Button } from "./components/ui";
import { BY_ADAPT, TRIP } from "./data/demo";
import { applyAdapt } from "./lib/adapt";
import { stopSpeaking } from "./lib/speech";
import { Explore } from "./screens/Explore";
import { CreateTrip } from "./screens/CreateTrip";
import { Spots } from "./screens/Spots";
import { TripHome, Travellers, Consensus, Alternatives } from "./screens/TripHome";
import { DayPlan, SpotDetail } from "./screens/DayPlan";
import { Deals, More, DemoPanel } from "./screens/DealsAndMore";
import { Ops } from "./screens/Ops";
import type { AdaptId, Trip } from "./types";

/** A tiny stack on top of the tabs. No router: the flows are short and linear. */
type Route =
  | { k: "tab" }
  | { k: "create" }
  | { k: "travellers" }
  | { k: "consensus" }
  | { k: "alternatives" }
  | { k: "day"; n: number }
  | { k: "spot"; id: string }
  | { k: "demo" }
  | { k: "ops" };

export default function App() {
  const [tab, setTab] = useState<Tab>("explore");
  const [stack, setStack] = useState<Route[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [adapt, setAdapt] = useState<AdaptId | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [aiSheet, setAiSheet] = useState(false);

  const route: Route = stack[stack.length - 1] ?? { k: "tab" };
  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetTo = (t: Tab) => {
    setStack([]);
    setTab(t);
  };

  const goDay = useCallback(
    (n: number) => {
      setStack((s) => [...s.filter((r) => r.k !== "day"), { k: "day", n }]);
    },
    [],
  );

  /* ---- the floating action changes with where you are and what is live --- */
  const ai = useMemo(() => {
    /* Only where there is no better button on screen. The consensus and detail
       screens already end in a decision — floating a second AI button over
       their CTA is how you get a "where do I press?" moment on stage. */
    if (story || (route.k !== "tab" && route.k !== "day")) return null;
    /* An open Action Card is already the AI talking. Two of it is one too many. */
    if (adapt && route.k === "day" && BY_ADAPT[adapt].day === route.n) return null;
    if (trip?.phase === "ongoing" && (route.k === "day" || tab === "trip")) {
      return { label: "現在怎麼調整？", onClick: () => setAiSheet(true) };
    }
    if (route.k === "day") return null;
    if (tab === "trip" && trip) {
      return { label: "AI 幫我調整行程", onClick: () => push({ k: "consensus" }) };
    }
    if (tab === "explore") {
      return { label: "AI 幫我找靈感", onClick: () => push({ k: "create" }) };
    }
    return null;
  }, [route, tab, trip, story, adapt]);

  function createTrip() {
    setTrip({ ...TRIP });
    setStack([]);
    setTab("trip");
  }

  function startTrip() {
    setTrip((t) => (t ? { ...t, phase: "ongoing", today: 2 } : { ...TRIP, phase: "ongoing" }));
    setStack([{ k: "day", n: 2 }]);
    setTab("trip");
  }

  function triggerAdapt(id: AdaptId) {
    const a = BY_ADAPT[id];
    setTrip((t) => (t ? { ...t, phase: "ongoing", today: a.day } : { ...TRIP, phase: "ongoing", today: a.day }));
    setAdapt(id);
    setAiSheet(false);
    setStack([{ k: "day", n: a.day }]);
    setTab("trip");
  }

  function applyCurrentAdapt() {
    if (!adapt || !trip) return;
    setTrip(applyAdapt(trip, BY_ADAPT[adapt]));
    setAdapt(null);
  }

  function openArrival(spotId: string) {
    setTrip((t) => (t ? { ...t, phase: "ongoing" } : { ...TRIP, phase: "ongoing" }));
    setArrival(spotId);
    setStack([{ k: "day", n: 1 }]);
    setTab("trip");
  }

  /* ------------------------------------------------------------- screens */

  let screen: React.ReactNode;

  if (route.k === "create") {
    screen = <CreateTrip onCancel={pop} onDone={createTrip} />;
  } else if (route.k === "travellers") {
    screen = <Travellers onBack={pop} onConsensus={() => push({ k: "consensus" })} />;
  } else if (route.k === "consensus") {
    screen = (
      <Consensus
        onBack={pop}
        onAccept={() => {
          setStack([]);
          setTab("trip");
        }}
        onAlternatives={() => push({ k: "alternatives" })}
      />
    );
  } else if (route.k === "alternatives") {
    screen = <Alternatives onBack={pop} />;
  } else if (route.k === "spot") {
    screen = (
      <SpotDetail spotId={route.id} onBack={pop} onStory={(id) => setStory(id)} />
    );
  } else if (route.k === "demo") {
    screen = (
      <DemoPanel
        phase={trip?.phase ?? "planning"}
        onBack={pop}
        onStartTrip={startTrip}
        onLate={() => triggerAdapt("late")}
        onRain={() => triggerAdapt("rain")}
        onArrive={() => openArrival("sensoji")}
        onReset={() => {
          stopSpeaking();
          setTrip(null);
          setAdapt(null);
          setArrival(null);
          setStory(null);
          resetTo("explore");
        }}
      />
    );
  } else if (route.k === "ops") {
    screen = <Ops onBack={pop} />;
  } else if (route.k === "day" && trip) {
    screen = (
      <DayPlan
        trip={trip}
        day={route.n}
        onBack={() => setStack([])}
        onDay={goDay}
        onMap={() => resetTo("spots")}
        onStop={(id) => push({ k: "spot", id })}
        banner={
          adapt && BY_ADAPT[adapt].day === route.n ? (
            <AdaptCard
              adapt={BY_ADAPT[adapt]}
              trip={trip}
              onApply={applyCurrentAdapt}
              onDismiss={() => setAdapt(null)}
            />
          ) : undefined
        }
      />
    );
  } else {
    switch (tab) {
      case "spots":
        screen = <Spots onSpot={(id) => push({ k: "spot", id })} />;
        break;
      case "trip":
        screen = trip ? (
          <TripHome
            trip={trip}
            onDay={(n) => push({ k: "day", n })}
            onTravellers={() => push({ k: "travellers" })}
            onMap={() => resetTo("spots")}
          />
        ) : (
          <EmptyTrip onCreate={() => push({ k: "create" })} />
        );
        break;
      case "deals":
        screen = <Deals />;
        break;
      case "more":
        screen = (
          <More onDemo={() => push({ k: "demo" })} onOps={() => push({ k: "ops" })} />
        );
        break;
      default:
        screen = (
          <Explore
            trip={trip}
            onCreate={() => push({ k: "create" })}
            onOpenTrip={() => {
              setStack([]);
              setTab("trip");
            }}
            onToday={() => {
              setTab("trip");
              setStack([{ k: "day", n: trip?.today ?? 1 }]);
            }}
            onSpot={(id) => push({ k: "spot", id })}
          />
        );
    }
  }

  const hideNav = route.k === "create" || Boolean(story);

  return (
    <AppShell tab={tab} onTab={resetTo} showNav={!hideNav} ai={ai}>
      {screen}

      {arrival && !story && (
        <ArrivalSheet
          spotId={arrival}
          open
          onPlay={() => {
            setStory(arrival);
            setArrival(null);
          }}
          onLater={() => setArrival(null)}
        />
      )}

      {story && (
        <StoryPlayer spotId={story} onClose={() => setStory(null)} />
      )}

      {/* The in-trip AI entry point: options, not a chat box. */}
      <Sheet open={aiSheet} onClose={() => setAiSheet(false)}>
        <div className="px-5 pb-3 pt-3">
          <div className="text-[19px] font-bold text-ink">現在怎麼調整？</div>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-3">
            ResoMap 會看目前時間、位置與天氣，只在真的需要時才動你的行程。
          </p>
          <div className="mt-4 space-y-2.5">
            <button
              onClick={() => triggerAdapt("late")}
              className="w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
            >
              <div className="text-[15px] font-semibold text-ink">🕘 我們晚了</div>
              <div className="mt-0.5 text-[12.5px] text-ink-3">重排今天剩下的行程</div>
            </button>
            <button
              onClick={() => triggerAdapt("rain")}
              className="w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
            >
              <div className="text-[15px] font-semibold text-ink">🌧 天氣不好</div>
              <div className="mt-0.5 text-[12.5px] text-ink-3">換成室內的替代方案</div>
            </button>
          </div>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => setAiSheet(false)}>
              先不用
            </Button>
          </div>
        </div>
      </Sheet>
    </AppShell>
  );
}

function EmptyTrip({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid h-full place-items-center px-8 text-center">
      <div>
        <div className="text-[40px]">🧳</div>
        <p className="mt-3 text-[15px] font-semibold text-ink">還沒有旅程</p>
        <p className="mt-1 text-[13.5px] text-ink-3">30 秒建立一個，四個問題而已。</p>
        <div className="mt-6">
          <Button onClick={onCreate} full={false}>
            建立旅程
          </Button>
        </div>
      </div>
    </div>
  );
}
