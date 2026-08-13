import { useEffect, useMemo, useState } from "react";
import { AFFILIATE_DISCLOSURE, POIS, dealsForPoi, poi } from "../data";
import { story } from "../data/stories";
import { DealCard } from "../components/DealCard";
import { Button, Headphones, Note, Screen, Section, StoryBadge, Thumb } from "../components/ui";
import { distance, km } from "../lib/geo";
import { dur } from "../lib/adapt";
import { openDirections } from "../lib/maps";
import { track } from "../lib/track";
import { useNav } from "../nav";
import { POI_KIND_LABELS } from "../types";

/**
 * One place, one decision: put it in the itinerary.
 *
 * Everything below that reads in a fixed order — story, then walking there,
 * then the ticket — and each step down that list is quieter than the one above
 * it. The story is the thing only ResoMap has, so it sits directly under the
 * description with both edits on offer; the ticket is a link to somebody else's
 * checkout, so it is a compact row a long way further down. Selling louder than
 * that would mean out-shouting 加入行程, which is the only tap on this page that
 * changes the traveller's trip.
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
    /* nav.trips, not the TRIPS export. The export is the starting fixture: it
       still lists a 台南 trip after the demo has been reset, so this reported
       "已加入 Day 2" against a trip that no longer existed and nothing moved. */
    const mine = nav.trips.filter((t) => t.destId === p.destId);
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
          aria-pressed={saved}
          className={`absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-bg/90 text-[18px] active:bg-bg ${
            saved ? "text-brand" : "text-ink-2"
          }`}
        >
          {/* U+2665 without the U+FE0F variation selector. With it the filled
              heart renders in emoji presentation — a red glyph at its own size
              that ignores `text-brand` — so the two states came out in
              different colours and sizes and the toggle read as a glitch. */}
          {saved ? "♥" : "♡"}
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

        {/* Gated on the story, not on the id: a 試聽 button that opens an empty
            player is worse than no button.

            Two buttons rather than one because the choice is real. Thirty
            seconds is what somebody standing in a queue will actually play;
            three minutes is what they choose once the place has earned it.
            Making them pick inside the player, after committing, is how the
            long edit gets abandoned at sentence two. */}
        {st && (
          <div className="mt-5 rounded-2xl bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-[22px] leading-none">🎧</span>
              <div className="min-w-0 flex-1">
                {/* The title already ends with the hook — "赤崁樓・荷蘭人蓋的，
                    鄭成功接手的" — so printing both says the same thing twice.
                    The hook earns its place on cards that have no room for a
                    title; here the title is the better line. */}
                <div className="text-[15px] font-bold leading-snug text-ink">
                  {st.title}
                </div>
                <div className="mt-1.5 truncate text-[12.5px] text-ink-3">
                  {st.narrator}
                </div>
              </div>
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                onClick={() => nav.play(id, "short")}
                className="num inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-bg px-3 text-[14px] font-bold text-ink active:bg-surface-2"
              >
                30 秒
              </button>
              <button
                onClick={() => nav.play(id, "full")}
                className="num inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-bg px-3 text-[14px] font-bold text-ink active:bg-surface-2"
              >
                <Headphones size={13} />聽 {st.minutes} 分鐘
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Genuinely hands off to the phone's map app. ResoMap owns the plan;
          turn-by-turn is a product that already exists and is better. */}
      <div className="px-5 pt-5">
        <Button variant="secondary" onClick={() => openDirections(null, p, "walk")}>
          導航
        </Button>
      </div>

      {/* Compact on purpose. This is a link to somebody else's checkout, and it
          sits below both the story and 導航 in every dimension it can. */}
      {tickets.length > 0 && (
        <Section title="門票" tight>
          <div className="space-y-2 px-5">
            {tickets.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} compact />
            ))}
          </div>
        </Section>
      )}

      {localOffers.length > 0 && (
        <Section title="在地優惠" tight>
          <div className="space-y-2 px-5">
            {localOffers.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} compact />
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
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14.5px] font-semibold text-ink">
                      {place.name}
                    </span>
                    {/* The headphone alone in a dense row — the label would be
                        longer than the place name it sits next to. */}
                    {place.storyId && <StoryBadge label={false} />}
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

      {/* `shrink-0`, or this does nothing at all. Screen is a flex column, and a
          flex item defaults to shrink:1 with min-height:auto — an empty div's
          min-content is 0, so on any page long enough to scroll (which is every
          POI with a story) this collapsed to zero and the last 附近 row ran
          straight into the bar below. */}
      <div className="h-8 shrink-0" />

      {/* In flow as well as sticky, so the last row is never covered by it. */}
      <div className="sticky bottom-0 z-20 mt-auto shrink-0 border-t border-line bg-bg/95 px-5 pb-5 pt-3 backdrop-blur">
        <Button onClick={addToTrip}>加入行程</Button>
      </div>
    </Screen>
  );
}
