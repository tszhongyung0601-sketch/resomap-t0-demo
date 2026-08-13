import { useState } from "react";
import { previewAdapt } from "../lib/adapt";
import type { Adapt, Trip } from "../types";

/** "90" -> "1 小時 30 分". Used so the delay is never written down twice. */
export function dur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} 分`;
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`;
}

/**
 * The in-trip AI, as an Action Card rather than a chat thread.
 *
 * It moves in two beats on purpose. First it says what it noticed and offers a
 * few directions — it does not rewrite the day behind your back. Only when you
 * ask does it show a concrete diff: what goes, what stays, when you now get
 * back. Every number here is computed from the same function that applies the
 * change, so the card cannot promise a time the timeline then contradicts.
 */
export function AdaptCard({
  adapt,
  trip,
  onApply,
  onDismiss,
}: {
  adapt: Adapt;
  trip: Trip;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const [proposed, setProposed] = useState(false);
  const p = previewAdapt(trip, adapt);

  return (
    <div className="rm-in mb-3 overflow-hidden rounded-2xl border border-brand/25 bg-brand-wash">
      <div className="p-4">
        <div className="flex items-start gap-2.5">
          <span className="text-[18px] leading-none">{adapt.icon}</span>
          <div className="flex-1">
            <div className="text-[15.5px] font-bold text-ink">{adapt.headline}</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
              {adapt.consequence}
              {adapt.delayMin ? (
                <>
                  {" "}
                  比原定晚了 <span className="num font-semibold">{dur(adapt.delayMin)}</span>
                  ，照這樣走晚餐會延到{" "}
                  <span className="num font-semibold">{p.doNothingEndAt}</span>。
                </>
              ) : null}
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="關閉"
            className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-[15px] text-ink-3"
          >
            ✕
          </button>
        </div>

        {!proposed ? (
          <>
            <div className="mt-3 space-y-1.5">
              {adapt.choices.map((c) => (
                <div key={c} className="flex items-center gap-2 text-[13.5px] text-ink-2">
                  <span className="size-1.5 rounded-full bg-brand" />
                  {c}
                </div>
              ))}
            </div>
            <button
              onClick={() => setProposed(true)}
              className="mt-3.5 h-12 w-full rounded-full bg-brand text-[14.5px] font-bold text-white active:bg-brand-press"
            >
              {adapt.cta}
            </button>
          </>
        ) : (
          <div className="rm-in mt-3.5 rounded-xl bg-bg p-3.5">
            <div className="text-[12.5px] font-bold text-ink-3">建議調整</div>

            {p.swappedFrom && p.swappedTo && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[14px] text-ink-3 line-through">{p.swappedFrom}</span>
                <span className="text-[13px] text-ink-3">→</span>
                <span className="text-[14.5px] font-bold text-ink">{p.swappedTo}</span>
              </div>
            )}

            {p.droppedNames.length > 0 && (
              <div className="mt-2.5">
                <span className="text-[12.5px] text-ink-3">取消</span>
                <div className="mt-0.5 text-[14.5px] font-semibold text-ink">
                  {p.droppedNames.join("、")}
                </div>
              </div>
            )}

            <div className="mt-2.5">
              <span className="text-[12.5px] text-ink-3">保留</span>
              <div className="mt-0.5 text-[14.5px] text-ink">{adapt.plan.keeps.join("、")}</div>
            </div>

            <div className="mt-3 flex gap-6 border-t border-line pt-3">
              <div>
                <div className="text-[12px] text-ink-3">新的抵達時間</div>
                <div className="num text-[16px] font-bold text-ink">{p.endAt}</div>
              </div>
              {p.savedMetres > 0 && (
                <div>
                  <div className="text-[12px] text-ink-3">今天少走</div>
                  <div className="num text-[16px] font-bold text-ink">
                    {(p.savedMetres / 1000).toFixed(1)} km
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onApply}
              className="mt-3.5 h-12 w-full rounded-full bg-brand text-[14.5px] font-bold text-white active:bg-brand-press"
            >
              套用新行程
            </button>
            <button
              onClick={onDismiss}
              className="mt-1 h-10 w-full text-[13.5px] font-semibold text-ink-3"
            >
              不要修改
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
