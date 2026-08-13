import {
  CONFLICTS,
  CONFLICT_BY_ID,
  TRADEOFFS,
  consensusOf,
  planOf,
  satisfactionFor,
} from "../data/consensus";
import { TRAVELLER_BY_ID } from "../data/people";
import { track } from "../lib/track";
import type { TravellerId } from "../types";
import { Avatar, PrimaryButton, SatisfactionRing } from "./bits";
import { StatusBar } from "./S0Start";

/**
 * Not an itinerary — a negotiable agreement.
 *
 * Two rules hold this screen together and must not be relaxed:
 *   1. every plan lists at least one cost, and names who pays it;
 *   2. swapping a plan re-scores all four people at once, so the trade-off is
 *      visible as movement rather than described in prose.
 */
export function S3Consensus({
  selected,
  onSelect,
  onOpenTrip,
  onBack,
}: {
  selected: Record<string, string>;
  onSelect: (tradeoffId: string, planId: string) => void;
  onOpenTrip: () => void;
  onBack: () => void;
}) {
  const sat = satisfactionFor(selected);
  const consensus = consensusOf(sat);
  const silent = CONFLICTS.filter((c) => c.resolvedSilently);

  return (
    <div className="flex h-full flex-col">
      <StatusBar />

      <div className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar">
        <div className="rounded-3xl border border-line bg-cream-raise p-5 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-mute">
            共識度
          </div>
          <div
            className="num font-serif text-[56px] font-bold leading-none text-orange"
            style={{ transition: "color .3s" }}
          >
            {consensus}%
          </div>
          <div className="mt-4 flex justify-between px-1">
            {(["che", "yu", "kai", "ting"] as TravellerId[]).map((id) => (
              <SatisfactionRing key={id} id={id} value={sat[id]} />
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">
            4 個衝突全部有解，其中 <b>3 個需要有人讓步</b> —— 下面說明是誰、換到了什麼。
          </p>
        </div>

        {TRADEOFFS.map((t, i) => {
          const conflict = CONFLICT_BY_ID[t.conflictId];
          const activeId = selected[t.id];
          const plan = planOf(t.id, activeId);
          const idx = t.plans.findIndex((p) => p.id === activeId);

          return (
            <div key={t.id} className="mt-4 rounded-2xl border border-line bg-white p-4">
              <div className="text-[10.5px] font-black uppercase tracking-[0.12em] text-ink-mute">
                衝突 {i + 1}
              </div>
              <div className="mt-1 text-[14px] font-black leading-snug text-ink">
                {conflict.title}
              </div>
              <div className="mt-2 space-y-1">
                {conflict.sides.map((s) => (
                  <div key={s.travellerId} className="flex items-center gap-1.5">
                    <Avatar id={s.travellerId} size={17} />
                    <span className="text-[11.5px] text-ink-mute">
                      {s.claim}
                      {s.locked && " 🔒"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl bg-cream-raise p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-orange-deep">
                    解法 · {plan.label}
                  </span>
                  <span className="num text-[10.5px] font-bold text-ink-mute">
                    {idx + 1} / {t.plans.length}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                  {plan.resolution}
                </p>

                <div className="mt-2.5 space-y-1">
                  {plan.satisfies.map((s) => (
                    <div key={s.travellerId} className="flex items-start gap-1.5">
                      <span className="mt-px text-[11px] text-good">✓</span>
                      <Avatar id={s.travellerId} size={15} />
                      <span className="text-[11.5px] leading-snug text-ink-soft">
                        {s.because}
                      </span>
                    </div>
                  ))}
                  {plan.costs.map((c, k) => (
                    <div key={k} className="flex items-start gap-1.5">
                      <span className="mt-px text-[11px] text-bad">△</span>
                      {c.travellerId === "all" ? (
                        <span className="grid size-[15px] place-items-center rounded-full bg-ink/15 text-[8px] font-black text-ink-soft">
                          全
                        </span>
                      ) : (
                        <Avatar id={c.travellerId} size={15} />
                      )}
                      <span className="text-[11.5px] leading-snug text-ink-mute">
                        {c.because}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const next = t.plans[(idx + 1) % t.plans.length];
                    track("tradeoff_swap", {
                      tradeoff: t.id,
                      from: activeId,
                      to: next.id,
                      consensusBefore: consensus,
                    });
                    onSelect(t.id, next.id);
                  }}
                  className="mt-3 w-full rounded-full border-[1.5px] border-orange/40 bg-white py-2 text-[12px] font-black text-orange-deep transition active:scale-[.98]"
                >
                  換一個方案 →{" "}
                  {t.plans[(idx + 1) % t.plans.length].label}
                </button>
              </div>
            </div>
          );
        })}

        {silent.map((c) => (
          <div
            key={c.id}
            className="mt-4 rounded-2xl border border-good/25 bg-good-tint p-4"
          >
            <div className="text-[10.5px] font-black uppercase tracking-[0.12em] text-good">
              已自動解決 · 不需任何人讓步
            </div>
            <div className="mt-1 text-[13px] font-black text-ink">{c.title}</div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
              {c.silentResolution}
            </p>
          </div>
        ))}

        <div className="mt-5 rounded-xl bg-ink/5 p-3 text-[11px] leading-relaxed text-ink-mute">
          共識度上限鎖在 92%。任何宣稱四個人都 100% 滿意的方案，都是把衝突藏起來。
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-line px-5 py-3.5">
        <PrimaryButton onClick={onOpenTrip}>看完整行程</PrimaryButton>
        <button
          onClick={onBack}
          className="w-full py-1 text-[12px] font-bold text-ink-mute"
        >
          再調整偏好
        </button>
      </div>
    </div>
  );
}

/** Used by the ops screen for the "who moved" readout. */
export function travellerName(id: TravellerId) {
  return TRAVELLER_BY_ID[id].name;
}
