import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { POIS, poi, poisForDest } from "../data";
import { distance, km } from "../lib/geo";
import { useNav } from "../nav";
import { Row, Sheet, Thumb } from "../components/ui";
import { POI_KIND_LABELS, type Poi } from "../types";

/**
 * Adding a place is a two-second job, so it stays a sheet over the day you are
 * looking at. Opening a full-screen search — losing the itinerary, adding, then
 * finding your way back to the same day — is how planners turn one decision
 * into four taps and a moment of "wait, where was I?".
 */
export function AddPoiSheet({
  tripId,
  day,
  onClose,
}: {
  tripId: string;
  day: number;
  onClose: () => void;
}) {
  const nav = useNav();
  const [q, setQ] = useState("");
  /* The live trip, not the static fixture. Reading BY_TRIP meant a trip created
     during the demo had no entry at all (the sheet was empty), and an existing
     one kept re-offering places you had just added. */
  const trip = nav.trips.find((t) => t.id === tripId);

  const { anchor, nearby, more } = useMemo<{
    anchor: Poi | null;
    nearby: Poi[];
    more: Poi[];
  }>(() => {
    if (!trip) return { anchor: null, nearby: [], more: [] };
    const pool = poisForDest(trip.destId);
    const inTrip = new Set(
      trip.days.flatMap((d) => d.tracks.flatMap((t) => t.stops.map((s) => s.poiId))),
    );
    const thisDay = new Set(
      trip.days
        .filter((d) => d.n === day)
        .flatMap((d) => d.tracks.flatMap((t) => t.stops.map((s) => s.poiId))),
    );

    /* Where this day currently ends — the exact stop a new place is appended
       after. Ranking from there is what lets the list say 附近 and mean it;
       "nearby" measured from nothing is just the dataset's original order. */
    const target = trip.days.find((d) => d.n === day);
    const lastTrack = target?.tracks[target.tracks.length - 1];
    const lastStop = lastTrack?.stops[lastTrack.stops.length - 1];
    const anchor = lastStop ? poi(lastStop.poiId) : null;

    /* Prefer places the trip has not used at all; a short demo city can run out
       of those, and an empty section is worse than one offering a place that is
       planned for another day. Never offer something already on THIS day —
       tapping it would append a duplicate stop. */
    const unused = pool.filter((p) => !inTrip.has(p.id));
    const base = unused.length > 0 ? unused : pool.filter((p) => !thisDay.has(p.id));
    const ranked = anchor
      ? [...base].sort((a, b) => distance(anchor, a) - distance(anchor, b))
      : base;

    return { anchor, nearby: ranked.slice(0, 5), more: ranked.slice(5, 8) };
  }, [trip, day]);

  const results = useMemo<Poi[]>(() => {
    const k = q.trim();
    if (!k) return [];
    const hits = POIS.filter((p) => p.name.includes(k) || p.area.includes(k));
    /* Somewhere in the city you are already in is almost always the answer. */
    const here = trip?.destId;
    return [
      ...hits.filter((p) => p.destId === here),
      ...hits.filter((p) => p.destId !== here),
    ].slice(0, 8);
  }, [q, trip]);

  if (!trip) return null;

  const add = (poiId: string) => {
    nav.addPoi(tripId, day, poiId);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="加入景點">
      <div className="px-5 pb-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋地點或區域"
          className="h-11 w-full rounded-full bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-ink-3"
        />
      </div>

      {q.trim() ? (
        <Group title="搜尋結果">
          {results.length > 0 ? (
            results.map((p) => <PoiRow key={p.id} poi={p} onClick={() => add(p.id)} />)
          ) : (
            <p className="px-5 py-3 text-[13.5px] text-ink-3">
              找不到符合的地點，換個關鍵字或直接從地圖挑。
            </p>
          )}
        </Group>
      ) : (
        <>
          {nearby.length > 0 && (
            <Group title={anchor ? "附近推薦" : "可以加進這天的地方"}>
              {nearby.map((p) => (
                <PoiRow
                  key={p.id}
                  poi={p}
                  metres={anchor ? distance(anchor, p) : undefined}
                  onClick={() => add(p.id)}
                />
              ))}
            </Group>
          )}

          {more.length > 0 && (
            <Group title="其他地方">
              {more.map((p) => (
                <PoiRow key={p.id} poi={p} onClick={() => add(p.id)} />
              ))}
            </Group>
          )}
        </>
      )}

      <Group title="從地圖選擇">
        <Row
          icon="🗺️"
          label="在地圖上挑一個地方"
          onClick={() => {
            onClose();
            nav.go({ k: "tripmap", tripId, n: day });
          }}
        />
      </Group>
    </Sheet>
  );
}

/** `metres` is only passed where it was actually measured from somewhere. */
function PoiRow({
  poi: p,
  metres,
  onClick,
}: {
  poi: Poi;
  metres?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-2.5 text-left active:bg-surface"
    >
      <Thumb emoji={p.emoji} tint={p.tint} size={44} radius={12} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-ink">{p.name}</div>
        <div className="truncate text-[12.5px] text-ink-3">
          {p.area} · {POI_KIND_LABELS[p.kind]}
          {metres === undefined ? "" : ` · ${km(metres)}`}
        </div>
      </div>
      <span className="shrink-0 text-[19px] text-ink-3">＋</span>
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="px-5 pb-1 text-[13px] font-semibold text-ink-3">{title}</h3>
      {children}
    </section>
  );
}
