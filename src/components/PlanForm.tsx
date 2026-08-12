import { useState } from "react";
import {
  COMPANION_LABELS,
  INTEREST_LABELS,
  TRANSPORT_LABELS,
  WALK_LABELS,
  type Companion,
  type Interest,
  type Transport,
  type TripPlanInput,
  type WalkTolerance,
} from "../types";

const DAY_OPTIONS: TripPlanInput["days"][] = [1, 2, 3];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-orange-deep">
      {children}
    </div>
  );
}

function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-3 text-sm text-left transition-colors ${
        selected
          ? "border-orange bg-orange-tint text-orange-deep font-semibold"
          : "border-line bg-card text-ink-soft hover:border-line-strong"
      }`}
    >
      {label}
    </button>
  );
}

export function PlanForm({
  onSubmit,
}: {
  onSubmit: (input: TripPlanInput) => void;
}) {
  const [days, setDays] = useState<TripPlanInput["days"]>(1);
  const [arrivalTime, setArrivalTime] = useState("09:00");
  const [departureTime, setDepartureTime] = useState("18:00");
  const [transport, setTransport] = useState<Transport>("public");
  const [interests, setInterests] = useState<Interest[]>(["history", "food"]);
  const [companion, setCompanion] = useState<Companion>("friends");
  const [walkTolerance, setWalkTolerance] = useState<WalkTolerance>("moderate");

  const toggleInterest = (tag: Interest) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const canSubmit = interests.length > 0;

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-8 text-center">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-orange-deep">
          ResoMap · AI 行程規劃
        </div>
        <h1 className="text-2xl font-extrabold text-ink">你想怎麼玩九份？</h1>
        <p className="mt-2 text-sm text-ink-mute">
          填幾個條件，AI 幫你排一條可以直接執行、還能買票的行程。
        </p>
      </div>

      <div className="mb-7">
        <SectionLabel>天數</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {DAY_OPTIONS.map((d) => (
            <ChoiceCard
              key={d}
              label={`${d} 天`}
              selected={days === d}
              onClick={() => setDays(d)}
            />
          ))}
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>抵達時間</SectionLabel>
          <input
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <SectionLabel>{days > 1 ? "最後一天離開時間" : "離開時間"}</SectionLabel>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div className="mb-7">
        <SectionLabel>交通方式</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TRANSPORT_LABELS) as Transport[]).map((t) => (
            <ChoiceCard
              key={t}
              label={TRANSPORT_LABELS[t]}
              selected={transport === t}
              onClick={() => setTransport(t)}
            />
          ))}
        </div>
      </div>

      <div className="mb-7">
        <SectionLabel>興趣偏好（至少選 1 項）</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INTEREST_LABELS) as Interest[]).map((tag) => {
            const selected = interests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleInterest(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "border-orange bg-orange text-white"
                    : "border-line-strong bg-card text-ink-soft"
                }`}
              >
                {INTEREST_LABELS[tag]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-7">
        <SectionLabel>同行對象</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(COMPANION_LABELS) as Companion[]).map((c) => (
            <ChoiceCard
              key={c}
              label={COMPANION_LABELS[c]}
              selected={companion === c}
              onClick={() => setCompanion(c)}
            />
          ))}
        </div>
      </div>

      <div className="mb-9">
        <SectionLabel>步行接受度</SectionLabel>
        <div className="flex flex-col gap-2">
          {(Object.keys(WALK_LABELS) as WalkTolerance[]).map((w) => (
            <ChoiceCard
              key={w}
              label={WALK_LABELS[w]}
              selected={walkTolerance === w}
              onClick={() => setWalkTolerance(w)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({
            days,
            arrivalTime,
            departureTime,
            transport,
            interests,
            companion,
            walkTolerance,
          })
        }
        className="w-full rounded-md bg-orange py-3.5 text-sm font-bold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        AI 幫我規劃行程
      </button>
    </div>
  );
}
