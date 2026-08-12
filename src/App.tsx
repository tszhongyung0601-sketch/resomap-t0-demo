import { useState } from "react";
import { PlanForm } from "./components/PlanForm";
import { GeneratingScreen } from "./components/GeneratingScreen";
import { ItineraryView } from "./components/ItineraryView";
import { generateItinerary } from "./lib/itineraryGenerator";
import type { Itinerary, TripPlanInput } from "./types";

type Screen = "form" | "generating" | "result";

export default function App() {
  const [screen, setScreen] = useState<Screen>("form");
  const [pendingInput, setPendingInput] = useState<TripPlanInput | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  function handleSubmit(input: TripPlanInput) {
    setPendingInput(input);
    setScreen("generating");
  }

  function handleGenerated() {
    if (!pendingInput) return;
    setItinerary(generateItinerary(pendingInput));
    setScreen("result");
  }

  function handleRestart() {
    setItinerary(null);
    setPendingInput(null);
    setScreen("form");
  }

  if (screen === "generating") {
    return <GeneratingScreen onDone={handleGenerated} />;
  }

  if (screen === "result" && itinerary) {
    return <ItineraryView itinerary={itinerary} onRestart={handleRestart} />;
  }

  return <PlanForm onSubmit={handleSubmit} />;
}
