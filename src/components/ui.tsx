import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlayHost } from "./overlay";

/* Small, boring primitives. Every one of them defaults to "no border, no
   shadow" — hierarchy comes from background, spacing and type size, so a screen
   can use ten of them without turning into a dashboard. */

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain bg-bg no-scrollbar">
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
  transparent,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
  /** Rides along inside the same sticky block — a day picker, a filter row.
      Kept here rather than given its own `top-[Npx]` so it can never be
      clipped when the bar above it changes height. */
  below?: ReactNode;
  transparent?: boolean;
}) {
  return (
    <div
      className={`sticky top-0 z-20 ${
        transparent ? "" : "bg-bg/95 backdrop-blur"
      }`}
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="返回"
            className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-[19px] text-ink active:bg-surface"
          >
            ‹
          </button>
        )}
        {title && (
          <h1
            className={`truncate font-bold text-ink ${
              large ? "text-[24px]" : "text-[17px]"
            }`}
          >
            {title}
          </h1>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">{right}</div>
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
            <button
              onClick={onAction}
              className="-my-2.5 -mr-2 px-2 py-2.5 text-[13px] font-semibold text-ink-3"
            >
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
  /** `onCard` is `secondary` for use inside a bg-surface Card — see below. */
  variant?: "primary" | "secondary" | "ghost" | "onCard";
  disabled?: boolean;
  full?: boolean;
}) {
  const base =
    "inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold transition active:scale-[.985] disabled:opacity-40";
  const styles = {
    primary: "bg-brand text-white active:bg-brand-press",
    secondary: "bg-surface text-ink active:bg-surface-2",
    /* A `secondary` button inside a Card is bg-surface on bg-surface — the same
       token, 1:1 contrast, no border, no shadow. It disappears completely and
       the most important tap on the home screen renders as a line of bold text.
       On a card, the fill has to be the page white. */
    onCard: "bg-bg text-ink active:bg-surface-2",
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
  /* The pill stays 34px because a row of 44px chips looks like a row of
     buttons. The tap target is extended past it with a pseudo-element, which
     is how you satisfy the 44px rule without paying for it visually. */
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition after:absolute after:inset-x-0 after:-inset-y-[5px] after:content-[''] ${
        active ? "bg-brand text-white" : "bg-surface text-ink-2 active:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

/** Underlined tab strip. Used inside a destination and inside a trip. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-5 overflow-x-auto px-5 no-scrollbar">
      {items.map((i) => {
        const on = i.id === value;
        return (
          <button
            key={i.id}
            onClick={() => onChange(i.id)}
            /* The underline has to sit tight under the label, so the tap target
               is extended past the visual with a pseudo-element rather than by
               padding it out — same trick as Chip. */
            className={`relative shrink-0 pb-2.5 pt-1 text-[14.5px] transition after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] ${
              on ? "font-bold text-ink" : "font-medium text-ink-3"
            }`}
          >
            {i.label}
            {on && (
              <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-brand" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Two-state pill. The list/map switch, and nothing else — keep it rare. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-surface p-1">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onChange(i.id)}
          /* The pill measures ~30px, because a segmented control drawn 44px tall
             reads as a row of buttons. The tap target is pushed out past the
             visual with a pseudo-element instead — the same trick Chip and Tabs
             use, and the reason this control was the one place in the app you
             could miss with a thumb. */
          className={`relative rounded-full px-4 py-1.5 text-[13px] font-semibold transition after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-[''] ${
            i.id === value ? "bg-bg text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-ink-3"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
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

/** Bottom sheet. Arrival, more services, quick add, contextual offers. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const host = useOverlayHost();
  if (!open) return null;

  /* Absolute against the shell, not against the screen. The screen area is
     clipped and sits *beside* the tab bar, so a sheet rendered where it was
     declared gets cut off at the bottom edge and leaves the four tabs lit and
     tappable behind its own scrim — a modal that is not modal.
     Screens declare the sheet where it belongs in the code and it renders where
     it belongs on the glass; App.tsx's `overlay` slot stays the right answer for
     the app-wide sheets it already owns. The fallback keeps the component usable
     if it is ever rendered outside a shell. */
  const body = (
    <div className="absolute inset-0 z-40">
      <div className="rm-fade absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="rm-up absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-3xl bg-bg pb-6 no-scrollbar">
        <div className="sticky top-0 z-10 bg-bg pt-2.5">
          <div className="flex justify-center pb-1">
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
          {title && (
            <div className="px-5 pb-2 pt-1.5 text-[17px] font-bold text-ink">
              {title}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  return host ? createPortal(body, host) : body;
}

export function Empty({
  icon,
  text,
  action,
  onAction,
}: {
  icon: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid place-items-center px-8 py-16 text-center">
      <div>
        <div className="text-4xl">{icon}</div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-3">{text}</p>
        {action && (
          <div className="mt-5">
            <Button onClick={onAction} full={false}>
              {action}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A list row. Interactivity follows `onClick`, and so does the chevron.
 *
 * Rendering the › unconditionally made every not-yet-built row on 我的 look
 * live: fifteen rows, thirteen of them with an arrow and a press highlight and
 * nothing behind them. Tapping one taught the traveller that the app ignores
 * them, which is a worse outcome than the row simply saying it is not ready —
 * which is what MapTab already does for its unbuilt filters.
 */
export function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  const live = Boolean(onClick);
  return (
    <button
      onClick={onClick}
      disabled={!live}
      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left ${
        live ? "active:bg-surface" : ""
      }`}
    >
      {icon && (
        <span
          className={`w-6 shrink-0 text-center text-[17px] ${live ? "" : "opacity-45"}`}
        >
          {icon}
        </span>
      )}
      <span className={`flex-1 text-[15px] ${live ? "text-ink" : "text-ink-3"}`}>
        {label}
      </span>
      {value && <span className="shrink-0 text-[13px] text-ink-3">{value}</span>}
      {live ? (
        <span className="shrink-0 text-[15px] text-ink-3">›</span>
      ) : (
        <Tag kind="later" />
      )}
    </button>
  );
}

/**
 * The label that has to appear on anything commercial or fabricated.
 *
 * `sponsored` marks paid placement, `demo` marks made-up numbers. Both exist so
 * that nothing in this prototype can be mistaken for either an organic
 * recommendation or a real commercial relationship.
 */
export function Tag({ kind }: { kind: "sponsored" | "demo" | "later" }) {
  const map = {
    sponsored: { text: "贊助", cls: "bg-surface-2 text-ink-3" },
    demo: { text: "Demo 資料", cls: "bg-surface-2 text-ink-3" },
    later: { text: "即將推出", cls: "bg-brand-wash text-brand" },
  }[kind];
  return (
    <span
      className={`inline-block shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${map.cls}`}
    >
      {map.text}
    </span>
  );
}

/** Quiet footnote for a screen that shows prices or metrics. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 py-4 text-[11.5px] leading-relaxed text-ink-3">{children}</p>
  );
}

/**
 * The mark for a place ResoMap has recorded a story about.
 *
 * It appears on every surface a POI can appear on — explore, map, search,
 * itinerary — because its job is recognition: after seeing it twice, a
 * traveller knows what it means without being told. Which is also why it stays
 * quiet. Only a minority of places have a story, and that scarcity is what
 * makes the mark worth anything; dressed up in brand orange it would read as
 * an advert and appear to be on everything.
 */
export function StoryBadge({
  minutes,
  label = true,
}: {
  minutes?: number;
  /** Off in dense rows where the headphone alone carries it. */
  label?: boolean;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">
      <Headphones />
      {label && <span>{minutes ? `${minutes} 分鐘故事` : "有語音故事"}</span>}
    </span>
  );
}

export function Headphones({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      aria-hidden
    >
      <path d="M4 14v-2a8 8 0 0116 0v2" strokeLinecap="round" />
      <rect x="2.4" y="13.4" width="4.6" height="7.2" rx="2.3" fill="currentColor" stroke="none" />
      <rect x="17" y="13.4" width="4.6" height="7.2" rx="2.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
