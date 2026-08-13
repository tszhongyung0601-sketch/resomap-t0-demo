import { useEffect, useState } from "react";
import { CONFLICTS } from "../data/consensus";
import { clearEvents, readEvents } from "../lib/track";
import type { TrackedEvent } from "../types";

/**
 * The competitive report's revenue formula, made draggable.
 *
 * Its punchline is the reason this whole demo exists: with no itinerary
 * planner, trip-creation rate is zero, so every other factor multiplies to
 * nothing. Setting that one slider to 0 should visibly zero the revenue.
 */
const FACTORS = [
  { id: "mau", label: "MAU", min: 1000, max: 200000, step: 1000, init: 20000, fmt: (v: number) => v.toLocaleString() },
  { id: "planRate", label: "行程建立率", min: 0, max: 100, step: 1, init: 35, fmt: (v: number) => `${v}%` },
  { id: "clickRate", label: "OTA 點擊率", min: 0, max: 60, step: 1, init: 18, fmt: (v: number) => `${v}%` },
  { id: "convRate", label: "訂購轉換率", min: 0, max: 30, step: 1, init: 9, fmt: (v: number) => `${v}%` },
  { id: "aov", label: "平均訂購金額", min: 500, max: 8000, step: 100, init: 2600, fmt: (v: number) => `NT$${v.toLocaleString()}` },
  { id: "rate", label: "佣金率", min: 2, max: 15, step: 1, init: 7, fmt: (v: number) => `${v}%` },
] as const;

type FactorId = (typeof FACTORS)[number]["id"];

export function S9Ops({ onBack }: { onBack: () => void }) {
  const [vals, setVals] = useState<Record<FactorId, number>>(
    Object.fromEntries(FACTORS.map((f) => [f.id, f.init])) as Record<FactorId, number>,
  );
  const [, force] = useState(0);

  useEffect(() => {
    const h = () => force((n) => n + 1);
    window.addEventListener("resomap:event", h);
    return () => window.removeEventListener("resomap:event", h);
  }, []);

  const events = readEvents();
  const count = (t: TrackedEvent) => events.filter((e) => e.type === t).length;

  const monthly =
    vals.mau *
    (vals.planRate / 100) *
    (vals.clickRate / 100) *
    (vals.convRate / 100) *
    vals.aov *
    (vals.rate / 100);

  const funnel = [
    { label: "行程建立", n: count("consensus_generated"), base: 1240 },
    { label: "OTA 卡曝光", n: count("ota_impression"), base: 4180 },
    { label: "OTA 點擊", n: count("ota_click"), base: 742 },
    { label: "導向 OTA", n: count("voice_cta_click") + count("ota_click"), base: 742 },
    { label: "回傳成交", n: 0, base: 68 },
  ];

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex h-[46px] shrink-0 items-end justify-between px-6 pb-1 text-[12.5px] font-bold">
        <span className="num">09:41</span>
        <span className="text-[11px] tracking-wider">▮▮▮ 5G ▓</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2">
        <button
          onClick={onBack}
          className="grid size-8 place-items-center rounded-full bg-white/10 text-[14px] font-bold"
        >
          ‹
        </button>
        <span className="font-serif text-[18px]">營運後台</span>
        <button
          onClick={clearEvents}
          className="ml-auto rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] font-bold text-white/60"
        >
          ⟲ 重置
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
        {/* funnel ------------------------------------------------- */}
        <div className="text-[10.5px] font-black uppercase tracking-[0.16em] text-orange">
          A · 轉換漏斗
        </div>
        <div className="mt-2 space-y-1.5">
          {funnel.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11.5px] font-bold text-white/70">
                {f.label}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-white/10">
                <div
                  className="h-full rounded bg-gradient-to-r from-orange to-[#FF8A44]"
                  style={{ width: `${Math.min(100, ((f.base + f.n) / 4180) * 100)}%` }}
                />
              </div>
              <span className="num w-16 text-right text-[12px] font-black">
                {(f.base + f.n).toLocaleString()}
                {f.n > 0 && <b className="ml-1 text-orange">+{f.n}</b>}
              </span>
            </div>
          ))}
        </div>

        {/* formula ------------------------------------------------ */}
        <div className="mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-orange">
          B · 收入公式
        </div>
        <div className="mt-2 space-y-3 rounded-2xl bg-white/6 p-3.5">
          {FACTORS.map((f) => (
            <div key={f.id}>
              <div className="flex items-baseline justify-between text-[12px] font-bold">
                <span className="text-white/75">{f.label}</span>
                <span className="num font-serif text-[17px] text-orange">
                  {f.fmt(vals[f.id])}
                </span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={vals[f.id]}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [f.id]: Number(e.target.value) }))
                }
                className="mt-1 w-full accent-orange"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-orange/30 bg-orange/12 p-4 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#FFB98C]">
            月 OTA 佣金收入
          </div>
          <div className="num mt-1 font-serif text-[38px] font-bold leading-none">
            NT${Math.round(monthly).toLocaleString()}
          </div>
        </div>

        {vals.planRate === 0 ? (
          <div className="mt-3 rounded-xl border-l-[3px] border-orange bg-orange/14 p-3 text-[12.5px] font-bold leading-relaxed">
            行程建立率 0% ⇒ 整條公式鎖死為零。這正是現況：沒有行程規劃，
            行銷預算全打水漂。
          </div>
        ) : (
          <button
            onClick={() => setVals((v) => ({ ...v, planRate: 0 }))}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/6 p-3 text-left text-[12px] leading-relaxed text-white/70"
          >
            把「行程建立率」拉到 <b className="text-orange">0%</b> 看看 —— 那就是 ResoMap
            的現況。
          </button>
        )}

        {/* coordination metrics ---------------------------------- */}
        <div className="mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-orange">
          C · 協調專屬指標
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Metric label="平均衝突數／趟" value={CONFLICTS.length.toFixed(1)} />
          <Metric label="共識度中位數" value="84%" />
          <Metric
            label="折衷卡換方案率"
            value={`${Math.min(99, 41 + count("tradeoff_swap") * 3)}%`}
            delta={count("tradeoff_swap")}
          />
          <Metric
            label="旅途中重排觸發率"
            value={`${Math.min(99, 63 + count("adapt_trigger") * 2)}%`}
            delta={count("adapt_trigger")}
          />
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/55">
          換方案率證明使用者真的在談判；重排觸發率證明 Companion 有需求。
          兩者都是護城河資產 —— 現在幾乎都是零，要靠時間累積。
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/6 p-3">
      <div className="text-[11px] font-bold text-white/60">{label}</div>
      <div className="num mt-1 font-serif text-[26px] font-bold leading-none">{value}</div>
      {delta ? <div className="text-[10.5px] font-black text-orange">本次 +{delta}</div> : null}
    </div>
  );
}
