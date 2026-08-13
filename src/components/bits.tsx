import type { ReactNode } from "react";
import { TRAVELLER_BY_ID } from "../data/people";
import type { TravellerId } from "../types";

/* --------------------------------------------------------------- avatars */

export function Avatar({
  id,
  size = 28,
  dim = false,
}: {
  id: TravellerId;
  size?: number;
  dim?: boolean;
}) {
  const t = TRAVELLER_BY_ID[id];
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: t.color,
        opacity: dim ? 0.35 : 1,
      }}
      title={t.name}
    >
      {t.initial}
    </span>
  );
}

/** The dots on a stop card that say who this stop is here for. */
export function OwnerDots({ ids }: { ids: TravellerId[] }) {
  if (ids.length === 0) {
    return (
      <span className="flex items-center gap-1">
        {(["che", "yu", "kai", "ting"] as TravellerId[]).map((id) => (
          <span
            key={id}
            className="size-1.5 rounded-full"
            style={{ background: TRAVELLER_BY_ID[id].color }}
          />
        ))}
        <span className="ml-1 text-[10px] font-semibold text-ink-mute">大家都想去</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      {ids.map((id) => (
        <span
          key={id}
          className="size-2 rounded-full"
          style={{ background: TRAVELLER_BY_ID[id].color }}
        />
      ))}
      <span
        className="text-[10px] font-bold"
        style={{ color: TRAVELLER_BY_ID[ids[0]].color }}
      >
        {ids.map((id) => TRAVELLER_BY_ID[id].name).join("・")}
        {ids.length === 1 ? " 想去" : " 想去"}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- rings */

export function SatisfactionRing({
  id,
  value,
  size = 56,
}: {
  id: TravellerId;
  value: number;
  size?: number;
}) {
  const t = TRAVELLER_BY_ID[id];
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={t.colorSoft}
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={t.color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
            style={{ transition: "stroke-dashoffset .5s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <span
          className="num absolute inset-0 grid place-items-center text-[13px] font-black"
          style={{ color: t.color }}
        >
          {value}
        </span>
      </div>
      <span className="text-[11px] font-bold text-ink-soft">{t.name}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- chrome */

export function Chip({
  children,
  tone = "plain",
  onClick,
  active,
}: {
  children: ReactNode;
  tone?: "plain" | "orange" | "locked" | "block";
  onClick?: () => void;
  active?: boolean;
}) {
  const tones: Record<string, string> = {
    plain: "border-line bg-white text-ink-soft",
    orange: "border-orange bg-orange text-white",
    locked: "border-orange/40 bg-orange-tint text-orange-deep",
    block: "border-bad/30 bg-bad-tint text-bad",
  };
  const Cmp = onClick ? "button" : "span";
  return (
    <Cmp
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none transition ${
        active ? tones.orange : tones[tone]
      }`}
    >
      {children}
    </Cmp>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-mute">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-orange px-5 py-3.5 text-base font-black text-white shadow-[0_6px_18px_rgba(255,98,16,.32)] transition active:scale-[.98] disabled:cursor-not-allowed disabled:bg-line-strong disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-line-strong px-5 py-3 text-sm font-bold text-ink-soft transition active:scale-[.98]"
    >
      {children}
    </button>
  );
}
