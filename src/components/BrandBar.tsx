import { useState } from "react";
import { ME } from "../data";
import { focusTrip } from "../lib/trip";
import { useNav } from "../nav";
import { Avatar, Row, Sheet } from "./ui";

/**
 * The orange bar, on the four tab roots.
 *
 * This is brand, not action — which is the whole risk of putting it back. The
 * app's own rule (src/index.css) reserves orange for the primary action, the
 * selected state and the AI mark, and a screen may only have one loud orange
 * thing. A full-width orange bar plus an orange 開始今天行程 button is two.
 *
 * The bar wins that argument by not competing: it is a flat field with no
 * button on it, sitting above the fold as a title. Nothing in it is a call to
 * action, so the one filled orange button further down the page is still the
 * only thing asking to be pressed. Every drill-down screen keeps the white
 * TopBar, because there the back arrow and the title are the job.
 */

export function BrandBar({ title }: { title?: string }) {
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const trip = focusTrip(nav.trips);

  return (
    <>
      <div className="shrink-0 bg-brand">
        <div className="flex items-center gap-1 px-2 pb-2.5 pt-2.5">
          <button
            onClick={() => setMenu(true)}
            aria-label="選單"
            className="grid size-11 shrink-0 place-items-center rounded-full text-white active:bg-black/10"
          >
            <Burger />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white text-[12px] font-black text-brand">
              R
            </span>
            <span className="truncate text-[16.5px] font-bold tracking-tight text-white">
              {title ?? "ResoMap"}
            </span>
          </div>

          <button
            onClick={() => nav.go({ k: "profile" })}
            aria-label="我的"
            className="grid size-11 shrink-0 place-items-center rounded-full active:bg-black/10"
          >
            {/* A white ring, so the avatar reads as a control against orange
                rather than as a coloured blob that happens to be there. */}
            <span className="grid size-8 place-items-center rounded-full ring-2 ring-white/70">
              <Avatar name={ME.name} color={ME.color} initial={ME.initial} size={28} />
            </span>
          </button>
        </div>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="ResoMap">
        {/* Only rows that do something. A drawer of 即將推出 is the pattern this
            app removed from 我的, and re-adding it behind a hamburger would be
            the same lie in a new place. */}
        <div className="pb-2">
          {trip && (
            <Row
              icon="🧾"
              label="旅費"
              value={trip.title}
              onClick={() => {
                setMenu(false);
                nav.go({ k: "expenses", tripId: trip.id });
              }}
            />
          )}
          <Row
            icon="🗺️"
            label="在地圖上找"
            onClick={() => {
              setMenu(false);
              nav.go({ k: "map" });
            }}
          />
          <Row
            icon="📊"
            label="Demo：商業模式"
            onClick={() => {
              setMenu(false);
              nav.go({ k: "business" });
            }}
          />
          <Row
            icon="🎬"
            label="Demo 情境"
            onClick={() => {
              setMenu(false);
              nav.go({ k: "demo" });
            }}
          />
          <Row
            icon="👤"
            label="我的"
            onClick={() => {
              setMenu(false);
              nav.go({ k: "profile" });
            }}
          />
        </div>
      </Sheet>
    </>
  );
}

function Burger() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
