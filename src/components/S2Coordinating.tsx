import { useEffect, useState } from "react";
import {
  CONFLICTS,
  DEFAULT_PLAN_IDS,
  consensusOf,
  satisfactionFor,
} from "../data/consensus";
import { TRAVELLER_BY_ID } from "../data/people";
import { StatusBar } from "./S0Start";

/**
 * The vocabulary here is deliberate: it *coordinates*, it does not *schedule*.
 * Naming the four conflicts — and saying how many combinations were thrown out
 * because somebody's locked item would have been sacrificed — is what separates
 * this from every "generating your trip…" spinner on the market.
 */
export function S2Coordinating({ onDone }: { onDone: () => void }) {
  const lines = [
    { text: "收到 4 位旅伴的偏好與限制", kind: "step" as const },
    { text: `偵測到 ${CONFLICTS.length} 個衝突`, kind: "step" as const },
    ...CONFLICTS.map((c) => ({
      text: `${c.title}`,
      kind: "conflict" as const,
      sides: c.sides,
    })),
    { text: "套用限制：預算、營業時間、交通班次、體力上限…", kind: "step" as const },
    { text: "計算 127 種可行組合…", kind: "step" as const },
    { text: "排除 119 種（有人的不可妥協項被犧牲）", kind: "step" as const },
    {
      // Derived, so the stream can never claim a number the next screen contradicts.
      text: `找到共識度最高的方案：${consensusOf(satisfactionFor(DEFAULT_PLAN_IDS))}%`,
      kind: "done" as const,
    },
  ];

  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timers = lines.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), 130 + i * 300),
    );
    const finish = window.setTimeout(onDone, 130 + lines.length * 300 + 700);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-orange via-orange-deep to-ink">
      <StatusBar dark />
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mb-6 size-11 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
        {lines.slice(0, shown).map((l, i) => (
          <div
            key={i}
            className={`rm-rise mb-3 text-[14px] leading-snug ${
              l.kind === "done" ? "font-black text-[#B6FFD9]" : "text-white/95"
            }`}
          >
            {l.kind === "conflict" ? (
              <div className="ml-3 rounded-lg bg-black/20 px-3 py-2">
                <div className="text-[13px] font-bold text-white">· {l.text}</div>
                <div className="mt-1 space-y-0.5">
                  {l.sides.map((s) => (
                    <div
                      key={s.travellerId}
                      className="flex items-center gap-1.5 text-[11.5px] text-white/75"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ background: TRAVELLER_BY_ID[s.travellerId].color }}
                      />
                      {TRAVELLER_BY_ID[s.travellerId].name}：{s.claim}
                      {s.locked && " 🔒"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {l.kind === "done" ? "✓ " : "▸ "}
                {l.text}
              </>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onDone}
        className="absolute bottom-7 right-6 text-[12.5px] font-bold text-white/70"
      >
        跳過 ›
      </button>
    </div>
  );
}
