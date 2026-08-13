import type { ReactNode } from "react";

/* Small, boring primitives. Every one of them defaults to "no border, no
   shadow" — hierarchy comes from background and spacing, so a screen can add
   ten of these without turning into a dashboard. */

export function Screen({
  children,
  pad = true,
}: {
  children: ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col overflow-y-auto overscroll-contain bg-bg no-scrollbar ${
        pad ? "" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function TopBar({
  title,
  onBack,
  right,
  large,
  below,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
  /** Rides along inside the same sticky block — a day picker, a filter row.
      Kept here rather than given its own `top-[Npx]` so it can never be
      clipped when the bar above it changes height. */
  below?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="返回"
            className="-ml-2 grid size-11 place-items-center rounded-full text-[19px] text-ink active:bg-surface"
          >
            ‹
          </button>
        )}
        {title && (
          <h1 className={`font-bold text-ink ${large ? "text-[24px]" : "text-[17px]"}`}>
            {title}
          </h1>
        )}
        <div className="ml-auto flex items-center gap-1">{right}</div>
      </div>
      {below}
    </div>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
  tight,
}: {
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  tight?: boolean;
}) {
  return (
    <section className={tight ? "mt-6" : "mt-8"}>
      {title && (
        <div className="mb-3 flex items-baseline justify-between px-5">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          {action && (
            <button onClick={onAction} className="text-[13px] font-semibold text-ink-3">
              {action}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  full = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  full?: boolean;
}) {
  const base =
    "inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold transition active:scale-[.985] disabled:opacity-40";
  const styles = {
    primary: "bg-brand text-white active:bg-brand-press",
    secondary: "bg-surface text-ink active:bg-surface-2",
    ghost: "text-ink-2 active:bg-surface",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full rounded-2xl bg-surface text-left transition ${
        onClick ? "active:bg-surface-2" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Stands in for a photo: a flat tint plus one emoji. Nothing to load. */
export function Thumb({
  emoji,
  tint,
  size = 56,
  radius = 14,
}: {
  emoji: string;
  tint: string;
  size?: number;
  radius?: number;
}) {
  return (
    <div
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tint,
        fontSize: size * 0.42,
      }}
    >
      {emoji}
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
        active ? "bg-brand text-white" : "bg-surface text-ink-2 active:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export function Avatar({
  name,
  color,
  initial,
  size = 32,
}: {
  name?: string;
  color: string;
  initial: string;
  size?: number;
}) {
  return (
    <span
      title={name}
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}

/** Bottom sheet. Used for arrival, deals in context and the story player. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40">
      <div className="rm-fade absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="rm-up absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-3xl bg-bg pb-6 no-scrollbar">
        <div className="sticky top-0 flex justify-center bg-bg pb-1 pt-2.5">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="grid place-items-center px-8 py-16 text-center">
      <div>
        <div className="text-4xl">{icon}</div>
        <p className="mt-3 text-[14px] text-ink-3">{text}</p>
      </div>
    </div>
  );
}

export function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon?: string;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-surface"
    >
      {icon && <span className="w-6 text-center text-[17px]">{icon}</span>}
      <span className="flex-1 text-[15px] text-ink">{label}</span>
      {value && <span className="text-[13px] text-ink-3">{value}</span>}
      <span className="text-[15px] text-ink-3">›</span>
    </button>
  );
}
