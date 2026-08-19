import { useEffect, useState, type ReactNode } from "react";
import type { Tab } from "../nav";
import { useI18n } from "../i18n";
import { TranslationNotice } from "../i18n/provider";
import { OverlayHost } from "./overlay";

/* iPhone 15/16 logical size, plus a bezel wide enough to read as a device.
   Declared before the component because `measure` reads them on the very first
   render, not just inside an effect. */
const SCREEN_W = 393;
const SCREEN_H = 852;
const BEZEL = 13;

/**
 * How the shell should draw itself, from the window it is drawing into.
 *
 * One function for the first paint and every resize after it. Seeding the state
 * with `useState(true)` instead meant a phone in a 400px window rendered a full
 * desktop bezel for one frame before the effect corrected it — a visible flash
 * of the wrong product on exactly the device the demo is shown on.
 */
function measure() {
  const narrow = window.innerWidth < 520;
  return {
    /** Draw the fake device, i.e. we are on something that is not a phone. */
    phone: !narrow,
    /* The bezel adds to the height that has to fit on screen, so it is part of
       the sum — otherwise the frame's bottom edge falls off the viewport. */
    scale: narrow ? 1 : Math.min(1, (window.innerHeight - 40) / (SCREEN_H + BEZEL * 2)),
  };
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "explore", label: "探索", icon: <Compass /> },
  { id: "library", label: "導覽庫", icon: <Headphones /> },
  { id: "trips", label: "行程", icon: <Route /> },
  { id: "together", label: "一起規劃", icon: <People /> },
];

/**
 * Four tabs, and no floating AI button.
 *
 * 地圖 was a way of finding a place rather than a place to go, and 我的 was a
 * list of 即將推出 — both left the tab bar. What replaced them is the one thing
 * the app is actually for: planning with other people.
 *
 * The floating assistant went too. One control with four different behaviours,
 * parked on top of the content, taught nobody what it did. The AI now appears
 * in the three specific moments it is useful, inside the screens that own those
 * moments.
 */
export function AppShell({
  tab,
  onTab,
  showNav,
  overlay,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
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
  const { t, translated } = useI18n();
  const [{ scale, phone }, setFrame] = useState(measure);
  /* Published to every screen through OverlayHost, so a `Sheet` opened deep
     inside one still lands here — above the tab bar, inside the clip. */
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    /* Returning `prev` unchanged is what keeps a drag-resize from re-rendering
       the whole app on every one of the hundred events it fires. */
    const fit = () =>
      setFrame((prev) => {
        const next = measure();
        return prev.phone === next.phone && prev.scale === next.scale ? prev : next;
      });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const app = (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-bg">
      {/* Above the screen, not inside it: every translated screen carries it, and
          a notice that scrolls away is a notice the reader may never have seen. */}
      <TranslationNotice translated={translated} />

      <div className="relative flex-1 overflow-hidden">
        <OverlayHost.Provider value={host}>{children}</OverlayHost.Provider>
      </div>

      {showNav && (
        /* The bottom padding is the home indicator's own strip. 20px is what the
           drawn bezel needs; on a real phone the strip is taller and the browser
           knows how tall, so take whichever is bigger.
           index.html ships `viewport-fit=cover`, which means iOS draws the page
           *under* the gesture bar — without the env() the labels end up beneath
           it, and the bottom row of the app is the part you cannot tap. On
           desktop the inset is 0 and this is exactly the old 20px. */
        <nav
          aria-label="主要導覽"
          className="z-20 flex shrink-0 items-stretch border-t border-line bg-bg/95 pb-[max(20px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur"
        >
          {/* `item`, not `t` — the translate function is called t and the map
             variable used to shadow it. */}
          {TABS.map((item) => {
            const on = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                /* min-h states the touch target instead of leaving it as a
                   by-product of icon + label height. */
                className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-1"
                aria-current={on ? "page" : undefined}
              >
                <span className={on ? "text-brand" : "text-ink-3"}>{item.icon}</span>
                <span
                  className={`text-[12px] font-semibold ${on ? "text-brand" : "text-ink-3"}`}
                >
                  {t(item.label)}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {overlay}

      {/* No position of its own, so a portalled `absolute inset-0` resolves
          against the shell above rather than against this. */}
      <div ref={setHost} />
    </div>
  );

  /* On a real phone the device is already there. Drawing a second one around it
     would be silly, and the status bar would duplicate the operating system's.

     But the drawn StatusBar was also doing a second job — holding the top of the
     app clear of the notch. Without it, and with `viewport-fit=cover` in
     index.html, every screen's sticky header renders under the real status bar.
     The env() inset is that job, done by the OS's own number. */
  if (!phone) {
    return <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)]">{app}</div>;
  }

  return (
    <div className="grid h-full w-full place-items-center">
      <div style={{ height: (SCREEN_H + BEZEL * 2) * scale }}>
        {/* `zoom`, not `transform: scale`.
            Both fit the device to a short window, but scale rasterises the app
            at 393px and then resamples the bitmap — every glyph, icon and
            gradient goes soft, which on a 1280x720 laptop meant the whole demo
            rendered at 77% and looked out of focus. `zoom` re-lays the page out
            at the target size, so text is rasterised crisply at the size it is
            actually shown. */}
        <div style={{ zoom: scale }}>
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
function Route() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6.5" cy="6.5" r="2.2" />
      <circle cx="17.5" cy="17.5" r="2.2" />
      <path d="M8.7 6.5h5.3a3.5 3.5 0 010 7h-4a3.5 3.5 0 000 7h5.3" strokeLinecap="round" />
    </svg>
  );
}
/* Two people, the back one only half drawn — the overlap is what says 一起. */
function People() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9.4" cy="8.8" r="3.2" />
      <path d="M3.4 19.4c.8-2.9 3.1-4.5 6-4.5s5.2 1.6 6 4.5" strokeLinecap="round" />
      <path d="M15.9 6.2a3.2 3.2 0 010 5.2" strokeLinecap="round" />
      <path d="M16.6 15.2c2 .5 3.4 1.9 4 4.2" strokeLinecap="round" />
    </svg>
  );
}
function Headphones() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4.5 14v-2a7.5 7.5 0 0115 0v2" strokeLinecap="round" />
      <rect x="2.6" y="13.6" width="4.2" height="6.2" rx="2.1" />
      <rect x="17.2" y="13.6" width="4.2" height="6.2" rx="2.1" />
    </svg>
  );
}
