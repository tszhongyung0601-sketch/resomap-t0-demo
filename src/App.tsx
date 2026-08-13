import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAN_IDS, consensusOf, satisfactionFor } from "./data/consensus";
import { DEFAULT_PREFERENCES, emptyPreferences } from "./data/people";
import { ADAPT_SCENARIOS, TRIP } from "./data/trip";
import { applyAdapt } from "./lib/coordinator";
import { clearEvents, track } from "./lib/track";
import { stopSpeaking } from "./lib/speech";
import { S0Start } from "./components/S0Start";
import { S1Preferences } from "./components/S1Preferences";
import { S2Coordinating } from "./components/S2Coordinating";
import { S3Consensus } from "./components/S3Consensus";
import { S4Itinerary } from "./components/S4Itinerary";
import { S5Map } from "./components/S5Map";
import { S7Voice } from "./components/S7Voice";
import { S8Tools } from "./components/S8Tools";
import { S9Ops } from "./components/S9Ops";
import { Shell, type ScreenId } from "./components/Shell";
import { ADAPT_LABELS } from "./types";
import type {
  AdaptOption,
  AdaptScenario,
  AdaptTrigger,
  Preference,
  TravellerId,
  Trip,
} from "./types";

export default function App() {
  const [screen, setScreen] = useState<ScreenId>("s0");
  const [prefs, setPrefs] = useState<Record<TravellerId, Preference>>(() => ({
    ...DEFAULT_PREFERENCES,
  }));
  const [selected, setSelected] = useState<Record<string, string>>({
    ...DEFAULT_PLAN_IDS,
  });
  const [trip, setTrip] = useState<Trip>(TRIP);
  const [activeDay, setActiveDay] = useState(1);
  const [adapt, setAdapt] = useState<AdaptScenario | null>(null);
  /** Mid-trip choices dent satisfaction; kept apart from the tradeoff scores so
   *  swapping a tradeoff later does not silently erase them. */
  const [adaptPenalty, setAdaptPenalty] = useState<Partial<Record<TravellerId, number>>>({});
  const [voiceSpot, setVoiceSpot] = useState<string | null>(null);

  const satisfaction = useMemo(() => {
    const base = satisfactionFor(selected);
    const out = { ...base };
    for (const [id, delta] of Object.entries(adaptPenalty)) {
      const key = id as TravellerId;
      out[key] = Math.max(0, Math.min(100, out[key] + (delta ?? 0)));
    }
    return out;
  }, [selected, adaptPenalty]);

  const consensus = consensusOf(satisfaction);

  const go = useCallback((next: ScreenId) => {
    stopSpeaking();
    setScreen(next);
  }, []);

  /* Keyboard, so the presenter never has to hunt for a button. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const flow: ScreenId[] = ["s0", "s1", "s2", "s3", "s4", "s8", "s9"];
      const i = flow.indexOf(screen);
      if (e.key === "ArrowRight") go(flow[Math.min(flow.length - 1, (i < 0 ? 0 : i) + 1)]);
      if (e.key === "ArrowLeft") go(flow[Math.max(0, i - 1)]);
      if (e.key.toLowerCase() === "d") go(screen === "s9" ? "s4" : "s9");
      if (e.key.toLowerCase() === "m") go(screen === "s5" ? "s4" : "s5");
      if (e.key === "Escape") go("s4");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, go]);

  function handleAdaptTrigger(t: AdaptTrigger) {
    const scenario = ADAPT_SCENARIOS.find((s) => s.trigger === t);
    if (!scenario) return;
    setActiveDay(scenario.day);
    setAdapt(scenario);
    go("s4");
    track("adapt_trigger", { trigger: t, day: scenario.day });
  }

  function handleAdaptChoose(option: AdaptOption) {
    if (!adapt) return;
    setTrip((prev) => applyAdapt(prev, adapt.day, option, ADAPT_LABELS[adapt.trigger].label));
    setAdaptPenalty((prev) => {
      const next = { ...prev };
      for (const [id, d] of Object.entries(option.satisfactionDelta)) {
        const key = id as TravellerId;
        next[key] = (next[key] ?? 0) + (d ?? 0);
      }
      return next;
    });
    track("adapt_choose", {
      trigger: adapt.trigger,
      option: option.id,
      impact: option.impact.travellerId,
    });
    setAdapt(null);
  }

  function handleReset() {
    stopSpeaking();
    clearEvents();
    setPrefs({ ...DEFAULT_PREFERENCES });
    setSelected({ ...DEFAULT_PLAN_IDS });
    setTrip(TRIP);
    setAdaptPenalty({});
    setAdapt(null);
    setActiveDay(1);
    setVoiceSpot(null);
    setScreen("s0");
  }

  const body = (() => {
    switch (screen) {
      case "s0":
        return (
          <S0Start
            prefs={prefs}
            onStart={() => {
              setPrefs(emptyPreferences());
              go("s1");
            }}
          />
        );
      case "s1":
        return (
          <S1Preferences
            prefs={prefs}
            onChange={setPrefs}
            onSubmit={() => {
              track("conflict_detected", { count: 4 });
              go("s2");
            }}
          />
        );
      case "s2":
        return (
          <S2Coordinating
            onDone={() => {
              track("consensus_generated", { consensus, satisfaction });
              go("s3");
            }}
          />
        );
      case "s3":
        return (
          <S3Consensus
            selected={selected}
            onSelect={(t, p) => setSelected((s) => ({ ...s, [t]: p }))}
            onOpenTrip={() => go("s4")}
            onBack={() => go("s1")}
          />
        );
      case "s5":
        return (
          <S5Map
            trip={trip}
            activeDay={activeDay === 0 ? 1 : activeDay}
            setActiveDay={setActiveDay}
            onClose={() => go("s4")}
            onOpenVoice={(id) => {
              setVoiceSpot(id);
              go("s7");
            }}
          />
        );
      case "s7":
        return <S7Voice spotId={voiceSpot ?? "sensoji"} onBack={() => go("s4")} />;
      case "s8":
        return <S8Tools trip={trip} onBack={() => go("s4")} />;
      case "s9":
        return <S9Ops onBack={() => go("s4")} />;
      default:
        return (
          <S4Itinerary
            trip={trip}
            prefs={prefs}
            consensus={consensus}
            activeDay={activeDay}
            setActiveDay={(d) => {
              setActiveDay(d);
              if (d === 2) track("split_group_view", {});
            }}
            onTripChange={setTrip}
            onRecoordinate={() => {
              setTrip(TRIP);
              setAdaptPenalty({});
              go("s2");
            }}
            adapt={adapt}
            onAdaptChoose={handleAdaptChoose}
            onAdaptDismiss={() => setAdapt(null)}
            onOpenVoice={(id) => {
              setVoiceSpot(id);
              go("s7");
            }}
            onOpenMap={() => go("s5")}
            onOpenTools={() => go("s8")}
          />
        );
    }
  })();

  return (
    <Shell
      screen={screen}
      onNav={go}
      onAdapt={handleAdaptTrigger}
      onReset={handleReset}
      adaptDisabled={screen === "s0" || screen === "s1" || screen === "s2"}
    >
      {body}
    </Shell>
  );
}
