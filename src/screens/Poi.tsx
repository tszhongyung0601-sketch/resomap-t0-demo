import { useEffect, useMemo, useState } from "react";
import { AFFILIATE_DISCLOSURE, POIS, TRIPS, dealsForPoi, poi } from "../data";
import { story } from "../data/stories";
import { DealCard } from "../components/DealCard";
import { Button, Note, Screen, Section, Thumb } from "../components/ui";
import { distance, km } from "../lib/geo";
import { dur } from "../lib/adapt";
import { track } from "../lib/track";
import { useNav } from "../nav";
import { POI_KIND_LABELS } from "../types";

/**
 * One place, one decision: put it in the itinerary.
 *
 * Everything else on the page is deliberately quieter than that. The audio
 * story, the walk over, the ticket — each is worth a tap once you have decided
 * to go, and none of them is worth competing with the only button that changes
 * your trip.
 *
 * The ticket block is gated on `ticketed` AND on the record actually being a
 * ticket — not on "are there deals attached to this place". A free temple that
 * shows a 門票 CTA is an app selling something that does not exist, and one of
 * those is enough to lose the traveller for good.
 *
 * 在地優惠 is a different promise: merchant supply nobody has signed yet. It
 * gets its own block, keeps its 即將推出 label and is never bookable, because
 * the one thing worse than not having local deals is pretending you do.
 */
export function Poi({ id }: { id: string }) {
  const nav = useNav();
  const p = poi(id);

  const [saved, setSaved] = useState(false);
  const [navHint, setNavHint] = useState(false);

  useEffect(() => {
    track("poi_view", { poiId: id });
  }, [id]);

  /**
   * Real distances from real coordinates — the one number on this page a
   * traveller can check against the map.
   *
   * Restricted to this destination on purpose. Sorting every POI in the dataset
   * by distance and taking three works fine in 台南, where there are twelve of
   * them; in 首爾, where there are three, the third row is 東京 at 1,160 km
   * under a heading that says 附近. "Nearby" has to mean nearby or it means
   * nothing.
   */
  const nearby = useMemo(() => {
    if (!p) return [];
    return POIS.filter((o) => o.id !== p.id && o.destId === p.destId)
      .map((place) => ({ place, metres: distance(p, place) }))
      .sort((a, b) => a.metres - b.metres)
      .slice(0, 3);
  }, [p]);

  if (!p) return null;

  const st = story(p.storyId);

  /* Two blocks, two promises: a ticket only where the venue genuinely sells
     admission, a local offer only ever as 即將推出. Filtering by category is
     what stops a 在地優惠 record from rendering under a heading that says
     門票. */
  const attached = dealsForPoi(id);
  const tickets = p.ticketed ? attached.filter((d) => d.category === "ticket") : [];
  const localOffers = attached.filter((d) => d.category === "local");

  function addToTrip() {
    const mine = TRIPS.filter((t) => t.destId === p.destId);
    if (mine.length !== 1) {
      nav.go({ k: "create", destId: p.destId });
      return;
    }
    /* The confirmation is nav.addPoi's own toast. Firing a second one here —
       and a second poi_add with it — double-counted the funnel and told the
       traveller twice about one tap. */
    nav.addPoi(mine[0].id, mine[0].today, id);
  }

  return (
    <Screen>
      <div
        className="relative grid h-[220px] shrink-0 place-items-center text-[64px]"
        style={{ background: p.tint }}
      >
        {p.emoji}
        <button
          onClick={() => nav.back()}
          aria-label="返回"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-bg/90 text-[19px] text-ink active:bg-bg"
        >
          ‹
        </button>
        <button
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "取消收藏" : "收藏"}
          className={`absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-bg/90 text-[18px] active:bg-bg ${
            saved ? "text-brand" : "text-ink-2"
          }`}
        >
          {saved ? "♥️" : "♡"}
        </button>
      </div>

      <div className="px-5 pt-5">
        <h1 className="text-[22px] font-bold leading-snug text-ink">{p.name}</h1>
        <div className="mt-1.5 text-[13.5px] text-ink-3">
          {p.area} · {POI_KIND_LABELS[p.kind]} · 建議停留 {dur(p.stayMin)}
        </div>
        {p.about && (
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">{p.about}</p>
        )}
      </div>

      {/* Gated on the story, not on the id: a 試聽 button that opens an empty
          player is worse than no button. */}
      {st && (
        <div className="px-5 pt-5">
          <button
            onClick={() => nav.play(id)}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
          >
            <span className="text-[22px]">🎧</span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-ink">聽這裡的故事</div>
              <div className="num mt-0.5 truncate text-[12.5px] text-ink-3">
                {st.minutes} 分鐘 · {st.narrator}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-bg px-4 py-2 text-[12.5px] font-bold text-ink">
              試聽
            </span>
          </button>
        </div>
      )}

      {/* One secondary action. 收藏 already lives on the heart in the hero;
          shipping both meant two controls, one state, and a toggle that
          appeared to change on its own. */}
      <div className="px-5 pt-5">
        <Button variant="secondary" onClick={() => setNavHint(true)}>
          導航
        </Button>
      </div>

      {navHint && <Note>Demo 版本不會開啟導航。正式版會交給手機上的地圖 App。</Note>}

      {tickets.length > 0 && (
        <Section title="需要門票？" tight>
          <div className="space-y-2 px-5">
            {tickets.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
            ))}
          </div>
        </Section>
      )}

      {localOffers.length > 0 && (
        <Section title="在地優惠" tight>
          <div className="space-y-2 px-5">
            {localOffers.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
            ))}
          </div>
        </Section>
      )}

      {(tickets.length > 0 || localOffers.length > 0) && (
        <Note>{AFFILIATE_DISCLOSURE}</Note>
      )}

      {nearby.length > 0 && (
        <Section title="附近">
          <div className="px-5">
            {nearby.map(({ place, metres }) => (
              <button
                key={place.id}
                onClick={() => nav.go({ k: "poi", id: place.id })}
                className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-0 active:bg-surface"
              >
                <Thumb emoji={place.emoji} tint={place.tint} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-ink">
                    {place.name}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                    {place.area} · {POI_KIND_LABELS[place.kind]}
                  </div>
                </div>
                <span className="num shrink-0 text-[12.5px] text-ink-3">
                  {km(metres)}
                </span>
                <span className="shrink-0 text-[15px] text-ink-3">›</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <div className="h-8" />

      {/* In flow as well as sticky, so the last row is never covered by it. */}
      <div className="sticky bottom-0 z-20 mt-auto border-t border-line bg-bg/95 px-5 pb-5 pt-3 backdrop-blur">
        <Button onClick={addToTrip}>加入行程</Button>
      </div>
    </Screen>
  );
}
