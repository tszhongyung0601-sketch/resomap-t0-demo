import { useState } from "react";
import { DESTINATIONS, TRAVELLERS } from "../data/demo";
import { INTEREST_LABELS, type InterestId } from "../types";
import { Avatar, Button, Chip, Screen, TopBar } from "../components/ui";

type Who = "solo" | "partner" | "friends" | "family";

const WHO: { id: Who; label: string; emoji: string }[] = [
  { id: "solo", label: "自己", emoji: "🙋" },
  { id: "partner", label: "伴侶", emoji: "💑" },
  { id: "friends", label: "朋友", emoji: "🧑‍🤝‍🧑" },
  { id: "family", label: "家人", emoji: "👨‍👩‍👧" },
];

const STEPS = ["去哪裡？", "什麼時候？", "跟誰？", "你們喜歡什麼？"];

/**
 * Four questions, one per screen. Anything the coordinator needs beyond this —
 * budgets, pace, hard limits — is collected later, from each traveller, and
 * only once there is a trip worth constraining.
 */
export function CreateTrip({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("tokyo");
  const [who, setWho] = useState<Who>("friends");
  const [likes, setLikes] = useState<InterestId[]>(["food", "culture"]);
  const [invited, setInvited] = useState(false);

  if (invited) {
    return (
      <Screen>
        <TopBar onBack={() => setInvited(false)} />
        <div className="flex flex-1 flex-col px-5 pt-4">
          <h1 className="text-[24px] font-bold leading-snug text-ink">
            要邀請旅伴一起加入嗎？
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-3">
            他們可以各自填自己想去哪、不想去哪。之後行程有衝突時，ResoMap 才知道要怎麼喬。
          </p>

          <div className="mt-6 flex items-center gap-2">
            {TRAVELLERS.map((t) => (
              <Avatar key={t.id} {...t} size={40} />
            ))}
          </div>

          <div className="mt-6 space-y-2.5">
            {[
              { icon: "💬", label: "用 LINE 邀請" },
              { icon: "🟢", label: "用 WhatsApp 邀請" },
              { icon: "🔗", label: "複製邀請連結" },
            ].map((o) => (
              <button
                key={o.label}
                onClick={onDone}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-4 text-left active:bg-surface-2"
              >
                <span className="text-[19px]">{o.icon}</span>
                <span className="text-[15px] font-semibold text-ink">{o.label}</span>
                <span className="ml-auto text-ink-3">›</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pb-6 pt-6">
            <Button variant="ghost" onClick={onDone}>
              之後再說
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const canNext = step !== 3 || likes.length > 0;

  return (
    <Screen>
      <TopBar onBack={() => (step === 0 ? onCancel() : setStep(step - 1))} />

      <div className="px-5">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-surface-2"}`}
            />
          ))}
        </div>
        <h1 className="mt-6 text-[26px] font-bold text-ink">{STEPS[step]}</h1>
      </div>

      <div className="flex-1 px-5 pt-6">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {DESTINATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setCity(d.id)}
                className="text-left"
              >
                <div
                  className={`grid h-[96px] place-items-center rounded-2xl text-[32px] ${
                    city === d.id ? "ring-2 ring-brand" : ""
                  }`}
                  style={{ background: d.tint }}
                >
                  {d.emoji}
                </div>
                <div className="mt-1.5 text-[14.5px] font-bold text-ink">{d.name}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="rounded-2xl bg-surface p-5 text-center">
              <div className="num text-[24px] font-bold text-ink">8/20 - 8/24</div>
              <div className="mt-1 text-[13px] text-ink-3">5 天 4 夜</div>
            </div>
            {/* A real August 2026 grid: the 1st is a Saturday, so 8/20 lands on
                the Thursday the itinerary calls Day 1. */}
            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[12px] text-ink-3">
              {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 6 }, (_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                const on = d >= 20 && d <= 24;
                return (
                  <div
                    key={d}
                    className={`num grid h-10 place-items-center rounded-lg text-[13px] ${
                      on ? "bg-brand font-bold text-white" : "text-ink-3"
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {WHO.map((w) => (
              <button
                key={w.id}
                onClick={() => setWho(w.id)}
                className={`flex flex-col items-start gap-2 rounded-2xl p-4 text-left ${
                  who === w.id ? "bg-brand-wash ring-2 ring-brand" : "bg-surface"
                }`}
              >
                <span className="text-[26px]">{w.emoji}</span>
                <span className="text-[15px] font-bold text-ink">{w.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INTEREST_LABELS) as InterestId[]).map((k) => (
              <Chip
                key={k}
                active={likes.includes(k)}
                onClick={() =>
                  setLikes((v) =>
                    v.includes(k) ? v.filter((x) => x !== k) : [...v, k],
                  )
                }
              >
                {INTEREST_LABELS[k]}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-bg px-5 pb-6 pt-3">
        <Button
          disabled={!canNext}
          onClick={() => (step === 3 ? setInvited(true) : setStep(step + 1))}
        >
          {step === 3 ? "建立旅程" : "下一步"}
        </Button>
      </div>
    </Screen>
  );
}
