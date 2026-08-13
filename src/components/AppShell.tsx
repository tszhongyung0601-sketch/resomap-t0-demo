import { useEffect, useState, type ReactNode } from "react";

export type Tab = "explore" | "spots" | "trip" | "deals" | "more";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "explore", label: "探索", icon: <Compass /> },
  { id: "spots", label: "景點", icon: <Pin /> },
  { id: "trip", label: "旅程", icon: <Route /> },
  { id: "deals", label: "優惠", icon: <Tag /> },
  { id: "more", label: "更多", icon: <Dots /> },
];

/**
 * Phone-first. On a wide screen the app sits in a plain device viewport rather
 * than stretching into a desktop layout — the product is a phone app, and
 * pretending otherwise is how dashboards creep back in.
 */
export function AppShell({
  tab,
  onTab,
  showNav,
  ai,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
  /** The floating action changes with context; null hides it entirely. */
  ai: { label: string; onClick: () => void } | null;
  children: ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [phone, setPhone] = useState(true);

  useEffect(() => {
    const fit = () => {
      const narrow = window.innerWidth < 520;
      setPhone(!narrow);
      setScale(narrow ? 1 : Math.min(1, (window.innerHeight - 48) / 852));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const app = (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg">
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {ai && (
        <button
          onClick={ai.onClick}
          className="absolute z-30 flex items-center gap-2 rounded-full bg-brand py-3.5 pl-4 pr-5 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(255,98,16,.35)] transition active:scale-[.97]"
          style={{ right: 16, bottom: showNav ? 86 : 24 }}
        >
          <Sparkle />
          {ai.label}
        </button>
      )}

      {showNav && (
        <nav className="z-20 flex shrink-0 items-stretch border-t border-line bg-bg/95 pb-2 pt-1.5 backdrop-blur">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className="flex flex-1 flex-col items-center gap-0.5 py-1"
                aria-current={on}
              >
                <span className={on ? "text-brand" : "text-ink-3"}>{t.icon}</span>
                <span
                  className={`text-[10.5px] font-semibold ${
                    on ? "text-brand" : "text-ink-3"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );

  if (!phone) return <div className="h-full w-full">{app}</div>;

  return (
    <div className="grid h-full w-full place-items-center">
      <div style={{ height: 852 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <div className="h-[852px] w-[393px] overflow-hidden rounded-[38px] bg-bg shadow-[0_18px_50px_rgba(0,0,0,.18)] ring-1 ring-black/5">
            {app}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- icons: hairline strokes, no fills, so the nav stays quiet ---------- */

function Compass() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-2 4.5-4 2 2-4.5z" strokeLinejoin="round" />
    </svg>
  );
}
function Pin() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21c4-4.5 6-7.6 6-10.2A6 6 0 006 10.8C6 13.4 8 16.5 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}
function Route() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6.5" cy="6.5" r="2.2" />
      <circle cx="17.5" cy="17.5" r="2.2" />
      <path d="M8.7 6.5h5.3a3.5 3.5 0 010 7h-4a3.5 3.5 0 000 7h5.3" strokeLinecap="round" />
    </svg>
  );
}
function Tag() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 11V5h6l9.5 9.5a2 2 0 010 2.8l-3.2 3.2a2 2 0 01-2.8 0z" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="1.3" />
    </svg>
  );
}
function Dots() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function Sparkle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
      <path d="M18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity=".75" />
    </svg>
  );
}
