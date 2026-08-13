import { useState } from "react";
import { Screen, TopBar } from "../components/ui";

const F = [
  { id: "mau", label: "MAU", min: 1000, max: 200000, step: 1000, init: 20000, fmt: (v: number) => v.toLocaleString() },
  { id: "plan", label: "行程建立率", min: 0, max: 100, step: 1, init: 35, fmt: (v: number) => `${v}%` },
  { id: "click", label: "OTA 點擊率", min: 0, max: 60, step: 1, init: 18, fmt: (v: number) => `${v}%` },
  { id: "conv", label: "訂購轉換率", min: 0, max: 30, step: 1, init: 9, fmt: (v: number) => `${v}%` },
  { id: "aov", label: "平均訂購金額", min: 500, max: 8000, step: 100, init: 2600, fmt: (v: number) => `NT$${v.toLocaleString()}` },
  { id: "rate", label: "佣金率", min: 2, max: 15, step: 1, init: 7, fmt: (v: number) => `${v}%` },
] as const;

type Id = (typeof F)[number]["id"];

/**
 * Internal only, and reachable from More rather than the tab bar: it is a
 * business argument, not something a traveller ever needs to see.
 */
export function Ops({ onBack }: { onBack: () => void }) {
  const [v, setV] = useState<Record<Id, number>>(
    Object.fromEntries(F.map((f) => [f.id, f.init])) as Record<Id, number>,
  );
  const monthly =
    v.mau * (v.plan / 100) * (v.click / 100) * (v.conv / 100) * v.aov * (v.rate / 100);

  return (
    <Screen>
      <TopBar title="營運數據" onBack={onBack} />
      <div className="px-5 pt-2">
        <p className="text-[13.5px] leading-relaxed text-ink-3">
          OTA 月收入 = MAU × 行程建立率 × 點擊率 × 轉換率 × 客單價 × 佣金率
        </p>

        <div className="mt-4 space-y-4">
          {F.map((f) => (
            <div key={f.id}>
              <div className="flex items-baseline justify-between">
                <span className="text-[13.5px] text-ink-2">{f.label}</span>
                <span className="num text-[15px] font-bold text-ink">{f.fmt(v[f.id])}</span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={v[f.id]}
                onChange={(e) => setV((s) => ({ ...s, [f.id]: Number(e.target.value) }))}
                className="mt-1.5 w-full accent-brand"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-surface p-5 text-center">
          <div className="text-[12.5px] text-ink-3">月 OTA 佣金收入</div>
          <div className="num mt-1 text-[30px] font-bold text-ink">
            NT${Math.round(monthly).toLocaleString()}
          </div>
        </div>

        {v.plan === 0 ? (
          <p className="mt-3 rounded-xl bg-brand-wash p-3.5 text-[13.5px] leading-relaxed text-ink">
            行程建立率 0%，整條公式歸零。沒有行程規劃，行銷預算就是打水漂。
          </p>
        ) : (
          <button
            onClick={() => setV((s) => ({ ...s, plan: 0 }))}
            className="mt-3 w-full rounded-xl bg-surface p-3.5 text-left text-[13px] leading-relaxed text-ink-3"
          >
            把「行程建立率」拉到 0% 看看 —— 那是還沒有行程規劃時的 ResoMap。
          </button>
        )}
      </div>
      <div className="h-10" />
    </Screen>
  );
}
