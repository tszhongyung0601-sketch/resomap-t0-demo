import { useEffect, useState, type ReactNode } from "react";

export type Tab = "explore" | "map" | "trips" | "deals" | "profile";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "explore", label: "探索", icon: <Compass /> },
  { id: "map", label: "地圖", icon: <Pin /> },
  { id: "trips", label: "行程", icon: <Route /> },
  { id: "deals", label: "優惠", icon: <TagIcon /> },
  { id: "profile", label: "我的", icon: <Person /> },
];

/**
 * Five tabs, and the AI is not one of them.
 *
 * Putting an assistant in the tab bar makes it a destination you have to
 * remember to visit, which is exactly wrong: the whole point is that it turns
 * up when the trip needs it. So it lives in one floating button whose label
 * changes with where you are — 問 AI on the home screen, 附近推薦 on the map,
 * 調整行程 mid-trip — and disappears entirely on screens that already end in a
 * decision.
 */
export function AppShell({
  tab,
  onTab,
  showNav,
  ai,
  overlay,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
  ai: { label: string; onClick: () => void } | null;
  /**
   * Sheets, the story player, the toast.
   *
   * These are a sibling of the screen rather than part of it, because the
   * screen area is clipped and sits above the tab bar: anything rendered inside
   * it can neither cover the nav nor escape the clip. Handing them to the shell
   * is what lets a modal be modal.
   */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [phone, setPhone] = useState(true);

  useEffect(() => {
    const fit = () => {
      const narrow = window.innerWidth < 520;
      setPhone(!narrow);
      /* The bezel adds to the height that has to fit on screen, so it is part
         of the sum — otherwise the frame's bottom edge falls off the viewport. */
      setScale(narrow ? 1 : Math.min(1, (window.innerHeight - 40) / (SCREEN_H + BEZEL * 2)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const app = (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-bg">
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {ai && (
        <button
          onClick={ai.onClick}
          className="absolute z-30 flex items-center gap-2 rounded-full bg-brand py-3.5 pl-4 pr-5 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(255,98,16,.35)] transition active:scale-[.97]"
          style={{ right: 16, bottom: showNav ? 98 : 32 }}
        >
          <Sparkle />
          {ai.label}
        </button>
      )}

      {showNav && (
        /* pb leaves the home indicator its own strip, the way a phone's bottom
           safe area does — without it the labels and the bar sit on top of each
           other. */
        <nav className="z-20 flex shrink-0 items-stretch border-t border-line bg-bg/95 pb-[20px] pt-1.5 backdrop-blur">
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
                  className={`text-[11px] font-semibold ${on ? "text-brand" : "text-ink-3"}`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {overlay}
    </div>
  );

  /* On a real phone the device is already there. Drawing a second one around it
     would be silly, and the status bar would duplicate the operating system's. */
  if (!phone) {
    return <div className="flex h-full w-full flex-col">{app}</div>;
  }

  return (
    <div className="grid h-full w-full place-items-center">
      <div style={{ height: (SCREEN_H + BEZEL * 2) * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <div className="relative">
            {/* Side buttons sit behind the body so they read as part of it. */}
            <span className="absolute -left-[3px] top-[132px] h-8 w-[3px] rounded-l bg-[#2a2a2e]" />
            <span className="absolute -left-[3px] top-[186px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" />
            <span className="absolute -left-[3px] top-[254px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" />
            <span className="absolute -right-[3px] top-[212px] h-20 w-[3px] rounded-r bg-[#2a2a2e]" />

            {/* The body. The thin inner ring is the polished metal edge — one
                highlight is enough; a stack of gradients starts to look like a
                product render rather than a screen the app is running on. */}
            <div
              className="rounded-[60px] bg-[#17171a] shadow-[0_30px_70px_-12px_rgba(0,0,0,.45),0_0_0_1px_rgba(255,255,255,.07)_inset]"
              style={{ padding: BEZEL }}
            >
              <div
                className="relative flex flex-col overflow-hidden rounded-[46px] bg-bg"
                style={{ width: SCREEN_W, height: SCREEN_H }}
              >
                <StatusBar />
                {app}
                {/* Home indicator. Device chrome, so it stays above even a
                    full-screen overlay — as it does on a real phone. */}
                <span className="pointer-events-none absolute inset-x-0 bottom-[7px] z-[60] flex justify-center">
                  <span className="h-[5px] w-[134px] rounded-full bg-ink/25" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* iPhone 15/16 logical size, plus a bezel wide enough to read as a device. */
const SCREEN_W = 393;
const SCREEN_H = 852;
const BEZEL = 13;

/**
 * Device chrome, not app data.
 *
 * 9:41 is the convention every phone mock-up uses, which is exactly why it is
 * the right choice: nobody reads it as information. A live clock here would be
 * the only true number on a screen full of demo data, which is a strange thing
 * to spend attention on.
 */
function StatusBar() {
  return (
    <div className="relative z-30 flex h-[52px] shrink-0 items-end justify-between px-[30px] pb-1.5">
      <span className="num text-[15px] font-semibold tracking-tight text-ink">9:41</span>

      {/* Dynamic island. Drawn over the status bar, so nothing has to move. */}
      <span className="absolute left-1/2 top-[11px] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-[#0b0b0d]" />

      <span className="flex items-center gap-[5px] text-ink">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="7.5" width="3" height="4.5" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <path d="M8 11.2 5.9 8.9a3 3 0 0 1 4.2 0zM3.6 6.6 2 4.9a9 9 0 0 1 12 0l-1.6 1.7a6.7 6.7 0 0 0-8.8 0z" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
          <rect
            x="0.6"
            y="0.6"
            width="22"
            height="11.8"
            rx="3.6"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.38"
            strokeWidth="1.2"
          />
          <rect x="2.4" y="2.4" width="15" height="8.2" rx="2.2" fill="currentColor" />
          <path
            d="M24.2 4.4a2.6 2.6 0 0 1 0 4.2z"
            fill="currentColor"
            fillOpacity="0.38"
          />
        </svg>
      </span>
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
function TagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 11V5h6l9.5 9.5a2 2 0 010 2.8l-3.2 3.2a2 2 0 01-2.8 0z" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="1.3" />
    </svg>
  );
}
function Person() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5" strokeLinecap="round" />
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
