import { useMemo, useState } from "react";
import { CONFLICTS } from "../data/consensus";
import { DEFAULT_PREFERENCES, TRAVELLERS, TRAVELLER_BY_ID } from "../data/people";
import { SPOT_BY_ID } from "../data/spots";
import { track } from "../lib/track";
import {
  INTEREST_EMOJI,
  INTEREST_LABELS,
  TRANSPORT_PREF_LABELS,
  WALK_CAP_LABELS,
} from "../types";
import type {
  InterestId,
  Preference,
  TransportPref,
  TravellerId,
  WalkCap,
} from "../types";
import { Avatar, PrimaryButton, SectionLabel } from "./bits";
import { StatusBar } from "./S0Start";

const MUST_GO_CHOICES = ["disney", "sensoji", "daibutsu", "shibuya", "meiji"];

/**
 * Constraints, not wishes. Everything on this card is something the coordinator
 * must respect — which is why the conflict counter can start ticking before
 * anything has been generated.
 */
export function S1Preferences({
  prefs,
  onChange,
  onSubmit,
}: {
  prefs: Record<TravellerId, Preference>;
  onChange: (next: Record<TravellerId, Preference>) => void;
  onSubmit: () => void;
}) {
  const [active, setActive] = useState<TravellerId>("che");
  const [showConflicts, setShowConflicts] = useState(false);
  const pref = prefs[active];
  const traveller = TRAVELLER_BY_ID[active];

  /** Conflicts are only claimed once both sides have actually submitted. */
  const liveConflicts = useMemo(
    () =>
      CONFLICTS.filter((c) => c.sides.every((s) => prefs[s.travellerId].submitted)),
    [prefs],
  );
  const allSubmitted = TRAVELLERS.every((t) => prefs[t.id].submitted);

  function patch(next: Partial<Preference>) {
    onChange({ ...prefs, [active]: { ...pref, ...next, submitted: true } });
  }

  function toggleInterest(id: InterestId) {
    const has = pref.interests.includes(id);
    patch({
      interests: has
        ? pref.interests.filter((x) => x !== id)
        : [...pref.interests, id],
    });
  }

  function toggleMustGo(id: string) {
    const has = pref.mustGo.includes(id);
    if (!has && pref.mustGo.length >= 2) return;
    patch({ mustGo: has ? pref.mustGo.filter((x) => x !== id) : [...pref.mustGo, id] });
  }

  function fillAll() {
    onChange({ ...DEFAULT_PREFERENCES });
    TRAVELLERS.forEach((t) =>
      track("preference_submit", { traveller: t.id, preset: true }),
    );
  }

  return (
    <div className="flex h-full flex-col">
      <StatusBar />

      <div className="shrink-0 border-b border-line px-5 pb-3">
        <h2 className="font-serif text-[22px] text-ink">每個人的限制</h2>
        <button
          onClick={() => setShowConflicts((v) => !v)}
          className={`mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
            liveConflicts.length
              ? "border-bad/30 bg-bad-tint"
              : "border-line bg-cream-raise"
          }`}
        >
          <span className="text-[12.5px] font-black text-ink">
            {liveConflicts.length
              ? `⚠ 已偵測到 ${liveConflicts.length} 個衝突`
              : "尚未偵測到衝突"}
          </span>
          <span className="text-[11px] font-bold text-ink-mute">
            {showConflicts ? "收合" : "看清單"}
          </span>
        </button>
        {showConflicts && (
          <ul className="rm-rise mt-2 space-y-1.5">
            {liveConflicts.map((c) => (
              <li
                key={c.id}
                className="rounded-lg bg-white px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft"
              >
                <b className="text-ink">{c.title}</b>
                <div className="mt-1 space-y-0.5">
                  {c.sides.map((s) => (
                    <div key={s.travellerId} className="flex items-center gap-1.5">
                      <Avatar id={s.travellerId} size={16} />
                      <span className="text-ink-mute">
                        {s.claim}
                        {s.locked && " 🔒"}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
            {liveConflicts.length === 0 && (
              <li className="px-1 text-[11.5px] text-ink-mute">
                至少要有兩個人填完，才知道有沒有衝突。
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 gap-1.5 px-5 py-3">
        {TRAVELLERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-[1.5px] py-2 transition ${
              active === t.id ? "bg-cream-raise" : "border-transparent"
            }`}
            style={{ borderColor: active === t.id ? t.color : undefined }}
          >
            <Avatar id={t.id} size={26} dim={!prefs[t.id].submitted} />
            <span className="text-[10.5px] font-bold text-ink-soft">{t.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 no-scrollbar">
        <div
          className="rounded-2xl border-[1.5px] p-4"
          style={{ borderColor: traveller.color, background: traveller.colorSoft }}
        >
          <div className="flex items-center gap-2.5">
            <Avatar id={active} size={34} />
            <div>
              <div className="text-[15px] font-black text-ink">{traveller.name}</div>
              <div className="text-[11px] font-semibold text-ink-mute">
                {traveller.blurb}
              </div>
            </div>
          </div>
        </div>

        <Field label="預算上限">
          <Slider
            caption="住宿 每晚／人"
            value={pref.lodgingCap}
            min={4000}
            max={16000}
            step={500}
            format={(v) => `¥${v.toLocaleString()}`}
            hint={`≈ NT$${Math.round(pref.lodgingCap / 3.25).toLocaleString()}`}
            color={traveller.color}
            onChange={(v) => patch({ lodgingCap: v })}
          />
          <Slider
            caption="每日花費／人"
            value={pref.dailyCap}
            min={4000}
            max={20000}
            step={500}
            format={(v) => `¥${v.toLocaleString()}`}
            color={traveller.color}
            onChange={(v) => patch({ dailyCap: v })}
          />
        </Field>

        <Field label="必去（最多 2 個，標記後不會被刪）">
          <div className="flex flex-wrap gap-1.5">
            {MUST_GO_CHOICES.map((id) => {
              const on = pref.mustGo.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleMustGo(id)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11.5px] font-bold transition ${
                    on
                      ? "border-orange bg-orange-tint text-orange-deep"
                      : "border-line bg-white text-ink-mute"
                  }`}
                >
                  {on && "🔒 "}
                  {SPOT_BY_ID[id]?.name ?? id}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="不想去">
          <div className="flex flex-wrap gap-1.5">
            {["disney", "yanaka"].map((id) => {
              const on = pref.wontGo.includes(id);
              return (
                <button
                  key={id}
                  onClick={() =>
                    patch({
                      wontGo: on
                        ? pref.wontGo.filter((x) => x !== id)
                        : [...pref.wontGo, id],
                    })
                  }
                  className={`rounded-full border px-2.5 py-1.5 text-[11.5px] font-bold transition ${
                    on
                      ? "border-bad/40 bg-bad-tint text-bad"
                      : "border-line bg-white text-ink-mute"
                  }`}
                >
                  {on && "🚫 "}
                  {SPOT_BY_ID[id]?.name ?? id}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="興趣主題">
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(INTEREST_LABELS) as InterestId[]).map((id) => {
              const on = pref.interests.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleInterest(id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border-[1.5px] py-2 text-[10.5px] font-bold transition ${
                    on ? "border-orange bg-orange-tint text-orange-deep" : "border-line bg-white text-ink-mute"
                  }`}
                >
                  <span className="text-[15px]">{INTEREST_EMOJI[id]}</span>
                  {INTEREST_LABELS[id]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="每日步行上限">
          <Segmented
            options={(Object.keys(WALK_CAP_LABELS) as WalkCap[]).map((k) => ({
              id: k,
              label: WALK_CAP_LABELS[k],
            }))}
            value={pref.walkCap}
            color={traveller.color}
            onChange={(v) => patch({ walkCap: v as WalkCap })}
          />
        </Field>

        <Field label="最早出門時間">
          <Slider
            caption=""
            value={hhmmToMin(pref.earliestStart)}
            min={420}
            max={660}
            step={30}
            format={minToHHMM}
            color={traveller.color}
            onChange={(v) => patch({ earliestStart: minToHHMM(v) })}
          />
        </Field>

        <Field label="交通偏好">
          <Segmented
            options={(Object.keys(TRANSPORT_PREF_LABELS) as TransportPref[]).map((k) => ({
              id: k,
              label: TRANSPORT_PREF_LABELS[k],
            }))}
            value={pref.transport}
            color={traveller.color}
            onChange={(v) => patch({ transport: v as TransportPref })}
          />
        </Field>

        <button
          onClick={fillAll}
          className="mt-5 w-full rounded-xl border border-dashed border-line-strong bg-cream-raise py-2.5 text-[12px] font-bold text-ink-mute"
        >
          一鍵套用四人設定（Demo）
        </button>
      </div>

      <div className="shrink-0 border-t border-line px-5 py-3.5">
        <PrimaryButton disabled={!allSubmitted} onClick={onSubmit}>
          {allSubmitted
            ? `開始協調 · ${liveConflicts.length} 個衝突`
            : "還有人沒填完"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- controls */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  );
}

function Slider({
  caption,
  value,
  min,
  max,
  step,
  format,
  hint,
  color,
  onChange,
}: {
  caption: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  hint?: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] font-semibold text-ink-mute">{caption}</span>
        <span className="num font-serif text-[19px] font-bold" style={{ color }}>
          {format(value)}
          {hint && (
            <span className="ml-1.5 font-sans text-[10.5px] font-bold text-ink-mute">
              {hint}
            </span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-orange"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function Segmented({
  options,
  value,
  color,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  color: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex-1 rounded-xl border-[1.5px] py-2 text-[11.5px] font-bold transition ${
              on ? "text-white" : "border-line bg-white text-ink-mute"
            }`}
            style={on ? { background: color, borderColor: color } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function minToHHMM(v: number) {
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
