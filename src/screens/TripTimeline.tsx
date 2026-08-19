import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  AFFILIATE_DISCLOSURE,
  BY_TRAVELLER,
  dealsForPoi,
  ME,
  poi,
  POIS,
} from "../data";
import { EXPENSES } from "../data/expenses";
import { DealCard } from "../components/DealCard";
import { PoiImage } from "../components/Cover";
import { dur } from "../lib/adapt";
import { distance, km } from "../lib/geo";
import {
  applyEdits,
  diffDay,
  earliestArrival,
  moveStop,
  removeStop,
  setTime,
  toClock,
  toMinutes,
  trackOffset,
  type DayEdits,
} from "../lib/reorder";
import { total } from "../lib/split";
import { track } from "../lib/track";
import { openDirections } from "../lib/maps";
import { useI18n } from "../i18n";
import { useNav } from "../nav";
import {
  Avatar,
  Button,
  Card,
  Headphones,
  Note,
  Row,
  Screen,
  Section,
  Sheet,
  TopBar,
} from "../components/ui";
import {
  LEG_LABEL,
  POI_KIND_LABELS,
  type Day,
  type Deal,
  type LegMode,
  type Poi,
  type Stop,
  type Track,
  type TravellerId,
  type Trip,
} from "../types";

/* ------------------------------------------------------ the traveller's edits */

/**
 * Days the traveller has rearranged by hand.
 *
 * The trip lives in App state and only App can write to it — this screen is
 * handed a `Trip` and a way to add a POI, and nothing else. So a reorder is
 * kept beside the trip and replayed over it on the way to the screen, the same
 * module-store shape lib/saved.ts and the receipts in Expenses.tsx already use,
 * and for the same reason: component state would lose the edit the moment
 * somebody tapped a stop to look at it, and an edit that survives being read is
 * the entire point of an edit.
 *
 * lib/reorder.ts does all the thinking; this is a `Record` and three lines of
 * plumbing. It is also the seam where a `nav.editDay` would land — see the
 * note in TripHome about which screens can and cannot see these edits.
 */
const key = (tripId: string, n: number) => `${tripId}:${n}`;

let edited: Record<string, DayEdits> = {};
const watchers = new Set<() => void>();

function subscribe(fn: () => void) {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}

/* The snapshot is the module object. A fresh one each call would hand React a
   new reference every render and loop forever. */
const snapshot = () => edited;

function commit(next: Record<string, DayEdits>) {
  edited = next;
  for (const fn of watchers) fn();
}

/**
 * Roll the day back to what the trip says.
 *
 * Nothing calls this yet. App.tsx's `reset()` should, next to `resetSaved()` —
 * a demo reset that rolls the itinerary back to the fixture and leaves last
 * run's reorder sitting on top of it is not a reset. It cannot be wired from
 * here, so it is exported and listed as a risk rather than left unsaid.
 */
export const resetDayEdits = () => commit({});

const remember = (tripId: string, n: number, e: DayEdits) =>
  commit({ ...edited, [key(tripId, n)]: e });

const forget = (id: string) => {
  if (!edited[id]) return;
  const next = { ...edited };
  delete next[id];
  commit(next);
};

/** The trip as the traveller has left it. */
function useEditedTrip(trip: Trip): Trip {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);

  return useMemo(() => {
    let touched = false;
    const days = trip.days.map((d) => {
      const e = all[key(trip.id, d.n)];
      /* `applyEdits` returns null when the day has moved underneath the edit —
         an AI adjustment applied, a scenario reloaded. The day the trip states
         wins, every time. */
      const next = e ? applyEdits(d, e) : null;
      if (!next) return d;
      touched = true;
      return next;
    });
    return touched ? { ...trip, days } : trip;
  }, [trip, all]);
}

/* ------------------------------------------------------------- trip home */

/**
 * The overview of one trip: who is coming, the days, and then the things the
 * trip might still need.
 *
 * The days come first. Somebody opening their own itinerary came to look at the
 * itinerary, and a screen that answers with a shopping block before the plan
 * has decided that its own traveller is a lead.
 *
 * 住宿 and 門票 used to be two stacked sections, which read as two shops rather
 * than one answer to one question. They are now one 這趟需要的 section, and it
 * is also where 優惠 is reached from: the tab is gone, so the shop opens from
 * the trip that gives it a reason to exist rather than from the bar.
 *
 * Every card in it appears only when this trip's own data justifies it —
 * `needsStay` for the stay card, a `ticketed: true` stop with a real listing
 * for a ticket card — and each states the fact rather than working the
 * traveller: "這趟行程共 4 晚" is a fact they can act on or ignore;
 * "還沒安排住宿，先訂起來比較安心" is a nudge with a deadline attached to somebody
 * else's checkout. That is the whole difference between a reminder and an ad —
 * and it is also why nothing in the section wears the brand-orange fill that
 * 加入行程 wears elsewhere in the app.
 */
export function TripHome({ trip: source }: { trip: Trip }) {
  const nav = useNav();
  /* The days as the traveller left them. Reading the raw trip here is how the
     Day 2 card ends up saying 7 個行程 above a timeline showing six — the
     itinerary contradicting itself one tap apart. The route map and the
     add-a-place sheet still read the raw trip, because they live in files this
     screen does not own; see the risks note about `nav.editDay`. */
  const trip = useEditedTrip(source);
  const tickets = ticketReminders(trip);
  /* No section at all when the trip needs neither. A heading that says
     這趟需要的 above nothing but a link to the shop is the shop window this
     screen exists to avoid. */
  const needs = trip.needsStay || tickets.deals.length > 0;
  /* The figure is the sum of this trip's receipts and nothing else — no
     budget, no projection, no "還差 N 元". A trip with no bills says so rather
     than showing NT$ 0, which reads as a total somebody worked out. */
  const bills = EXPENSES.filter((e) => e.tripId === trip.id);
  /* The roster minus the person holding the phone — the same rule 我的 already
     states in prose: counting yourself as your own 旅伴 is a small lie, and this
     screen was telling it. 東京 carries `travellers: [mickey, amy, john, susan]`
     and `ME` is mickey, so the row read 4 位旅伴 for a party of three companions.
     The stack drops him too, because three faces beside the word 三 is the only
     version of this row a reader can check. */
  const companions = trip.travellers.filter((t) => t !== ME.id);

  useEffect(() => {
    track("trip_view", { tripId: trip.id, destId: trip.destId });
  }, [trip.id, trip.destId]);

  return (
    <Screen>
      <TopBar
        title={trip.title}
        onBack={nav.back}
        right={
          <MapButton
            /* The day the traveller is actually on, not Day 1. The line
               directly below this button says 今天是第 2 天; opening the map on
               Day 1's route contradicts it on the same screen. DayPlan's copy
               of this button already passes the day it is showing. */
            onClick={() =>
              nav.go({
                k: "tripmap",
                tripId: trip.id,
                n: trip.phase === "ongoing" ? trip.today : 1,
              })
            }
          />
        }
      />

      <div className="num px-5 text-[14px] text-ink-3">
        {trip.dates}
        {trip.phase === "ongoing" && (
          <span className="font-semibold text-brand"> · 今天是第 {trip.today} 天</span>
        )}
      </div>

      {companions.length > 0 && (
        <button
          onClick={() => nav.go({ k: "travellers", tripId: trip.id })}
          className="mt-4 flex w-full items-center gap-3 px-5 py-3 text-left active:bg-surface"
        >
          <Stack who={companions} size={28} />
          <span className="flex-1 text-[14.5px] text-ink">
            {companions.length} 位旅伴 · 看大家想去哪
          </span>
          <span className="shrink-0 text-[15px] text-ink-3">›</span>
        </button>
      )}

      <Section title="每日行程">
        <div className="space-y-3 px-5">
          {trip.days.map((d) => (
            <DayCard key={d.n} trip={trip} day={d} />
          ))}
        </div>
      </Section>

      {/* Money sits with the plan, not in a wallet tab: the question "誰付了
          什麼" only ever comes up while looking at the days it was spent on. */}
      <div className="mt-4">
        <Row
          icon="💰"
          label="旅費"
          value={bills.length > 0 ? `NT$ ${total(bills).toLocaleString()}` : "還沒有紀錄"}
          onClick={() => nav.go({ k: "expenses", tripId: trip.id })}
        />
        {/* 「模擬」in the value, not only inside the screen it opens. Somebody
            scanning this list should not have to tap through to find out that
            the cloud sync is a demo of the idea rather than the thing itself. */}
        <Row
          icon="☁️"
          label="雲端同步・共同編輯"
          value="模擬"
          onClick={() => nav.go({ k: "coedit", tripId: trip.id })}
        />
      </div>

      {needs && (
        <Section title="這趟需要的">
          <div className="px-5">
            {trip.needsStay && (
              <div className="rounded-2xl bg-surface p-4">
                <div className="text-[15px] font-semibold text-ink">住宿</div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                  這趟行程共 {trip.nights} 晚。要找住宿的話，從這裡開始。
                </p>
                <div className="mt-3.5">
                  <Button
                    variant="onCard"
                    onClick={() => nav.go({ k: "stay", destId: trip.destId })}
                    full={false}
                  >
                    查看住宿
                  </Button>
                </div>
              </div>
            )}

            {tickets.deals.length > 0 && (
              <div className={trip.needsStay ? "mt-4" : ""}>
                {/* What is true — these places sell admission — and nothing
                    about what happens if you leave it. The line only exists
                    because the itinerary contains a venue that genuinely
                    charges entry; that fact is the reminder, and a deadline
                    stapled to it would be a sales line wearing a reminder's
                    clothes. It also names the places, which is what keeps this
                    section 這趟 rather than 熱門. */}
                <p className="text-[13px] leading-relaxed text-ink-3">
                  {tickets.names.join("、")}需要購票入場。
                </p>
                <div className="mt-2.5 space-y-2">
                  {tickets.deals.map((d) => (
                    <DealCard key={d.id} deal={d} onOpen={nav.openDeal} compact />
                  ))}
                </div>
              </div>
            )}

            {/* The way out to everything else, deliberately last and
                deliberately quiet: what this trip needs is the content, and the
                shop is the footnote to it — not the other way round. */}
            <button
              onClick={() => nav.go({ k: "deals" })}
              className="mt-1.5 flex min-h-11 w-full items-center gap-2 rounded-2xl px-1 text-left active:bg-surface"
            >
              <span className="flex-1 text-[14.5px] font-semibold text-ink">
                看全部優惠
              </span>
              <span className="shrink-0 text-[15px] text-ink-3">›</span>
            </button>
          </div>
          {/* Once, for the whole section — it covers the ticket prices above it
              and the 住宿 listings the card leads to. */}
          <Note>{AFFILIATE_DISCLOSURE}</Note>
        </Section>
      )}

      {/* `shrink-0`, or this spacer is not there at all. Screen is a flex
          column and a flex item defaults to shrink:1 with min-height:auto — an
          empty div's min-content is 0, so on any trip long enough to scroll
          (which is every one of them) it was the first thing the layout gave
          away: measured 0px on both the 3-day and the 5-day trip, and the last
          card sat flush against the tab bar. Same fix, same reason, as the
          spacer above 加入行程 on the POI page. */}
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

function DayCard({ trip, day }: { trip: Trip; day: Day }) {
  const nav = useNav();
  const stops = day.tracks.flatMap((t) => t.stops);
  const thumbs = [...new Set(stops.map((s) => s.poiId))].slice(0, 4);
  /* A day can legitimately be empty. Reading the first element unguarded put
     the literal string "undefined 出發" on the card. */
  const times = stops.map((s) => s.at).sort();
  const start = times.length > 0 ? times[0] : null;

  return (
    <Card
      onClick={() => nav.go({ k: "day", tripId: trip.id, n: day.n })}
      className="p-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-[15px] font-bold text-ink">Day {day.n}</span>
        <span className="truncate text-[13px] text-ink-3">
          {day.date} {day.weekday}
        </span>
      </div>

      {thumbs.length > 0 && (
        <div className="mt-2.5 flex gap-2">
          {thumbs.map((id) => {
            const p = poi(id);
            /* Emoji stays on at this size — four 48px landscapes with nothing
               on them are four identical stripes. PoiImage drops the glyph by
               itself the moment a real photograph exists for the place. */
            return <PoiImage key={id} poi={p} height={48} radius={12} className="w-12" />;
          })}
        </div>
      )}

      <div className="num mt-2.5 text-[12.5px] text-ink-3">
        {start && `${start} 出發 · `}
        {stops.length} 個行程
        {day.meetUp ? " · 分開走再會合" : ""}
      </div>
    </Card>
  );
}

/**
 * Tickets a traveller genuinely still needs: a place in this trip that really
 * sells admission, and a listing that exists for it. Two at most — the third
 * one turns a reminder into a shop.
 */
function ticketReminders(trip: Trip): { names: string[]; deals: Deal[] } {
  const ids = [
    ...new Set(trip.days.flatMap((d) => d.tracks.flatMap((t) => t.stops.map((s) => s.poiId)))),
  ];
  const names: string[] = [];
  const deals: Deal[] = [];

  for (const id of ids) {
    if (deals.length === 2) break;
    const p = poi(id);
    if (!p.ticketed) continue;
    const deal = dealsForPoi(id).find((d) => d.category === "ticket");
    if (!deal) continue;
    names.push(p.name);
    deals.push(deal);
  }
  return { names, deals };
}

/* -------------------------------------------------------------- day plan */

/**
 * One day, read like a timetable: time, place, how long, how you get to the
 * next one — and, on every stop that has one, the way into its story.
 *
 * The story button is the reason this screen matters. A traveller does not go
 * looking for audio guides; they look at what they are doing next. Putting the
 * headphones on the itinerary row is how they find out, while walking, that the
 * place they are walking to has something to listen to.
 */
export function DayPlan({
  trip: source,
  day,
  banner,
  onAdjust,
}: {
  trip: Trip;
  day: number;
  /** The in-trip AI card, injected above the timeline when something changed. */
  banner?: ReactNode;
  /** Opens the AI adjustment flow. Owned by App — this screen only asks. */
  onAdjust: () => void;
}) {
  const nav = useNav();
  const { t } = useI18n();
  const trip = useEditedTrip(source);
  /* Two copies of the same day on purpose: `d` is what the traveller sees and
     edits, `raw` is what the trip itself still says. Every edit is recorded as
     the difference between them, so the record stays meaningful when the trip
     changes underneath — see lib/reorder.ts's `diffDay`. */
  const raw = source.days.find((x) => x.n === day) ?? source.days[0];
  const d = trip.days.find((x) => x.n === day) ?? trip.days[0];

  const [editing, setEditing] = useState(false);
  /** Which stop's clock is open. */
  const [picking, setPicking] = useState<string | null>(null);
  /** An AI proposal is open on this day, and owns it until it is answered. */
  const proposing = Boolean(banner);

  /* `day` is in the deps because the event is per-day even though the payload
     has no field for it — walking Day 1 → Day 2 is two views, not one. */
  useEffect(() => {
    track("day_view", { tripId: trip.id });
  }, [trip.id, day]);

  /* Edit mode does not follow you to another day. A half-finished drag handed
     to a different list is the kind of state that deletes the wrong stop. */
  useEffect(() => {
    setEditing(false);
    setPicking(null);
  }, [trip.id, day]);

  /* Nor does it survive an AI proposal. `editMode` already stands down while a
     card is open, but `editing` and `picking` used to sit there waiting: answer
     the card and the day came back wearing drag handles nobody re-enabled, with
     a 調整時間 sheet popping open on a stop the applied adjustment may have just
     rewritten. Handing the day back means handing it back to be read. */
  useEffect(() => {
    if (!proposing) return;
    setEditing(false);
    setPicking(null);
  }, [proposing]);

  /* An edit the day has outgrown is thrown away rather than kept and ignored,
     or replaying a demo scenario would bring it back from the dead. */
  useEffect(() => {
    const id = key(trip.id, day);
    const e = edited[id];
    if (raw && e && !applyEdits(raw, e)) forget(id);
  }, [raw, trip.id, day]);

  if (!d || !raw) return null;

  /* The shared track is the one that meets at the meeting point, so a split
     day renders as "two groups, then everyone" without hard-coded track ids.
     The place decides which track and the last such track wins — everybody
     meets at the end of the day, not in the middle of it.

     It used to require the clock to match `meetUp.at` as well, which was more
     precise and is no longer survivable: that time is now something the
     traveller can change, and one tap on 18:30 made the divider stop
     recognising its own track — turning "分開走再會合" into three anonymous
     groups. So the printed time comes from the stop rather than from
     `meetUp`, and the two can no longer drift apart. */
  const meet = d.meetUp;
  const shared = meet
    ? [...d.tracks].reverse().find((tr) => tr.stops.some((s) => s.poiId === meet.poiId))
    : undefined;
  const meetAt =
    meet && shared
      ? (shared.stops.find((s) => s.poiId === meet.poiId)?.at ?? meet.at)
      : undefined;
  const own = d.tracks.filter((tr) => tr !== shared);
  const split = own.length > 1;

  /* Somewhere you are already going is not a discovery, so the whole day —
     both tracks of a split one — is excluded from the "on the way" line. */
  const planned = new Set(d.tracks.flatMap((tr) => tr.stops.map((s) => s.poiId)));

  const stops = d.tracks.flatMap((tr) => tr.stops);
  /**
   * Nothing to reorder is nothing to edit, and an 編輯 button above an empty
   * day is a control that does nothing.
   *
   * It also stands down while the AI has a proposal open on this day. That
   * card is written about the plan as it is — "你們還在赤崁樓", "保留 赤崁樓" —
   * and it is rendered by App from the trip, not from this screen's copy of it.
   * Rearranging underneath it produces a card describing an afternoon that no
   * longer exists, and applying it then discards the traveller's work anyway
   * (see `applyEdits`). Answering the card is one tap either way, and after
   * that the day is theirs again.
   */
  const canEdit = stops.length > 0 && !proposing;
  /* Derived, not stored, even though the effect above also clears `editing`:
     that effect runs after the render it belongs to, so for one paint `editing`
     is still true while the AI card is already on screen. Deriving it means the
     drag handles never appear under a proposal at all — the state is tidied up
     behind them rather than being the only thing holding them back. */
  const editMode = editing && canEdit;
  const picked = editMode && picking ? (stops.find((s) => s.id === picking) ?? null) : null;

  /**
   * The day as the store has it *now*, not as it was when this render ran.
   *
   * `d` is a render-time value, and an edit does not always commit in the render
   * that started it: deleting a stop closes the row over 210 ms first. A second
   * delete inside that window was computed against `d` — the day from before the
   * first one landed — and `diffDay` faithfully recorded a day in which the
   * first stop had never been deleted. One tap undid the other, and the stop
   * came back. Reading the store at commit time is the whole fix; it is the same
   * derivation `useEditedTrip` does, for the one day this screen is showing.
   */
  const current = (): Day => {
    const e = edited[key(trip.id, day)];
    return (e && applyEdits(raw, e)) || raw;
  };

  const keep = (edit: (from: Day) => Day) => {
    const was = current();
    const next = edit(was);
    if (next === was) return;
    remember(trip.id, day, diffDay(raw, next));
  };

  const timeline = (tr: Track) =>
    editMode ? (
      <EditList
        stops={tr.stops}
        offset={trackOffset(d, tr.id)}
        onMove={(stopId, from, to) =>
          keep((cur) => {
            /* The indices were measured against the list as it was painted. If
               a delete has committed since — its row animates for 210 ms — they
               now point at the stops either side of the gap, so the move is
               refused rather than approximated. `moveStop` refuses a
               cross-track drop for the same reason: a guess about which stop
               the traveller meant is worse than nothing happening. */
            const flat = cur.tracks.flatMap((x) => x.stops);
            return flat[from]?.id === stopId ? moveStop(cur, from, to) : cur;
          })
        }
        onRemove={(id) => keep((cur) => removeStop(cur, id))}
        onTime={setPicking}
      />
    ) : (
      <Timeline stops={tr.stops} planned={planned} />
    );

  return (
    <Screen>
      <TopBar
        title={trip.title}
        onBack={() => nav.go({ k: "trip", id: trip.id })}
        right={
          <>
            {/* Text, not a filled pill. Turning the plan orange would put the
                loudest thing on the screen on a mode switch, above an
                itinerary whose stops are deliberately all equals. */}
            {canEdit && (
              <button
                onClick={() => {
                  setEditing((v) => !v);
                  setPicking(null);
                }}
                className={`min-h-11 rounded-full px-2.5 text-[14.5px] font-semibold transition active:bg-surface ${
                  editing ? "text-brand" : "text-ink-2"
                }`}
              >
                {editing ? t("完成") : t("編輯")}
              </button>
            )}
            <MapButton
              onClick={() => nav.go({ k: "tripmap", tripId: trip.id, n: day })}
            />
          </>
        }
        below={
          <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar">
            {trip.days.map((x) => (
              <button
                key={x.n}
                onClick={() => nav.go({ k: "day", tripId: trip.id, n: x.n })}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 text-[13.5px] font-semibold transition ${
                  x.n === day ? "bg-ink text-white" : "bg-surface text-ink-2 active:bg-surface-2"
                }`}
              >
                Day {x.n}
              </button>
            ))}
          </div>
        }
      />

      {banner && <div className="px-5 pt-1">{banner}</div>}

      <div className="px-5 pt-2 text-[15px] font-bold text-ink">
        {d.date} <span className="font-normal text-ink-3">{d.weekday}</span>
      </div>

      {/* In the page, not floating over it. A plan that changes is the normal
          case on a trip, so the way to change it belongs in the reading order
          rather than parked on top of the last stop of the day. Quiet fill: the
          one loud thing on this screen is whatever the AI then proposes.

          It steps aside in edit mode, where the traveller is already doing the
          adjusting themselves and does not need to be offered help with it. */}
      {editMode ? (
        <p className="px-5 pt-3 text-[12.5px] leading-relaxed text-ink-3">
          {t("拖曳左邊的把手可以換順序，點時間可以改時間。")}
        </p>
      ) : (
        <div className="px-5 pt-3">
          <button
            onClick={onAdjust}
            className="flex w-full items-center gap-2.5 rounded-2xl bg-surface px-4 py-3.5 text-left active:bg-surface-2"
          >
            <span className="text-[15px]">✨</span>
            <span className="flex-1 text-[14.5px] font-semibold text-ink">
              行程有變？讓 AI 幫你改
            </span>
            <span className="shrink-0 text-[15px] text-ink-3">›</span>
          </button>
        </div>
      )}

      <div className="px-5 pb-28 pt-4">
        {split ? (
          <div className="space-y-6">
            {own.map((tr) => (
              <div key={tr.id}>
                <TrackHeader track={tr} />
                {timeline(tr)}
              </div>
            ))}
          </div>
        ) : (
          own.map((tr) => <div key={tr.id}>{timeline(tr)}</div>)
        )}

        {shared && meet && (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="num text-[12.5px] font-semibold text-ink-3">
                {meetAt} 會合
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            {timeline(shared)}
          </>
        )}

        <div className="mt-5">
          <Button variant="ghost" onClick={() => nav.addTo(trip.id, day)}>
            ＋ 加入景點
          </Button>
        </div>
      </div>

      {picked && (
        <TimeSheet
          key={picked.id}
          stop={picked}
          floor={earliestArrival(d, picked.id)}
          onClose={() => setPicking(null)}
          onSave={(at) => {
            keep((cur) => setTime(cur, picked.id, at));
            setPicking(null);
          }}
        />
      )}
    </Screen>
  );
}

function TrackHeader({ track: t }: { track: Track }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Stack who={t.who} size={22} />
      {t.label && <span className="text-[13.5px] font-semibold text-ink-2">{t.label}</span>}
    </div>
  );
}

function Timeline({ stops, planned }: { stops: Stop[]; planned: Set<string> }) {
  const nav = useNav();

  const found = stops.map((s, i) => {
    const prev = stops[i - 1];
    return prev && s.from ? passedOnTheWay(prev, s, planned) : null;
  });
  /* One mention per place. A shop that sits between three stops qualifies for
     all three legs, and the same name twice in a column reads as a bug rather
     than a discovery — so it is kept only on the leg it is nearest to. */
  const keep = new Map<string, number>();
  found.forEach((v, i) => {
    if (!v) return;
    const held = keep.get(v.poi.id);
    if (held === undefined || v.metres < (found[held]?.metres ?? Infinity)) {
      keep.set(v.poi.id, i);
    }
  });
  const vias = found.map((v, i) => (v && keep.get(v.poi.id) === i ? v.poi : null));

  return (
    <div>
      {stops.map((s, i) => (
        <div key={s.id}>
          {i > 0 && s.from && <Leg to={s} via={vias[i]} />}
          <StopRow
            stop={s}
            prev={i > 0 ? stops[i - 1] : undefined}
            onClick={() => nav.go({ k: "poi", id: s.poiId })}
          />
        </div>
      ))}
    </div>
  );
}

const LEG_ICON: Record<LegMode, string> = {
  walk: "🚶",
  train: "🚇",
  bus: "🚌",
  taxi: "🚕",
  drive: "🚗",
};

/**
 * The gap between two stops — now purely something to read.
 *
 * 怎麼走 moved onto the stop itself, which left this line free to say the one
 * thing a person in the gap can actually use: what they will walk past. It is
 * computed, never written: a place near the midpoint that is not already in the
 * day. If nothing qualifies the line is simply absent, because inventing a
 * landmark on a route is the fastest way to make the whole itinerary suspect.
 */
function Leg({ to, via }: { to: Stop; via: Poi | null }) {
  if (!to.from) return null;
  const { mode, min, metres } = to.from;

  return (
    <div className="pl-[56px]">
      <div className="border-l-[1.5px] border-line py-2 pl-3.5">
        <div className="text-[12.5px] text-ink-3">
          {LEG_ICON[mode]} {LEG_LABEL[mode]} {min} 分鐘 · {km(metres)}
        </div>
        {via && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
            途中會經過：{via.name}（{viaNote(via)}）
          </div>
        )}
      </div>
    </div>
  );
}

/** How close to the straight-line midpoint still counts as "on the way". */
const VIA_RADIUS = 250;

interface Via {
  poi: Poi;
  metres: number;
}

/**
 * Free things are the pleasant surprise, so a non-ticketed place wins even when
 * a ticketed one sits closer to the midpoint; distance only breaks the tie.
 */
function passedOnTheWay(from: Stop, to: Stop, planned: Set<string>): Via | null {
  const a = poi(from.poiId);
  const b = poi(to.poiId);
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };

  const near = POIS.filter(
    (p) =>
      p.destId === a.destId &&
      !planned.has(p.id) &&
      distance(mid, p) <= VIA_RADIUS,
  ).sort(
    (x, y) =>
      Number(Boolean(x.ticketed)) - Number(Boolean(y.ticketed)) ||
      distance(mid, x) - distance(mid, y),
  );

  const best = near[0];
  return best ? { poi: best, metres: distance(mid, best) } : null;
}

/**
 * "免費" is only information where you could otherwise have been charged to get
 * in, so it is reserved for the places that sell admission elsewhere. A noodle
 * street is described by what it is.
 */
function viaNote(p: Poi): string {
  if (p.ticketed) return "需門票";
  if (p.kind === "attraction" || p.kind === "nature") return "免費";
  return POI_KIND_LABELS[p.kind];
}

function StopRow({
  stop,
  prev,
  onClick,
}: {
  stop: Stop;
  prev?: Stop;
  onClick: () => void;
}) {
  const nav = useNav();
  const p = poi(stop.poiId);
  const mode = stop.from?.mode ?? "walk";
  const hasStory = Boolean(p.storyId);

  /* Both actions are secondary on purpose. The itinerary is a list of equals —
     the moment one stop's headphones turn orange, every other stop reads as the
     boring one. */
  const action =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-surface px-4 text-[13px] font-semibold text-ink transition active:bg-surface-2";

  return (
    <div className="py-1">
      <button
        onClick={onClick}
        className="-mx-2 flex w-full gap-3 rounded-2xl px-2 py-1.5 text-left active:bg-surface"
      >
        <div className="num w-11 shrink-0 pt-1 text-[14px] font-bold text-ink">
          {stop.at}
        </div>
        {/* The width is explicit because the component only owns its height:
            in a flex row a picture with no intrinsic content collapses. */}
        <PoiImage poi={p} height={72} radius={12} emoji={false} className="w-[92px]" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15.5px] font-semibold text-ink">{p.name}</span>
            {stop.meal && (
              <span className="shrink-0 text-[12px] text-ink-3">
                {stop.meal === "lunch" ? "午餐" : "晚餐"}
              </span>
            )}
          </div>
          {stop.stayMin > 0 && (
            <div className="mt-0.5 text-[12.5px] text-ink-3">停留 {dur(stop.stayMin)}</div>
          )}
          {stop.changed && (
            <div className="mt-1.5 inline-block rounded-md bg-brand-wash px-1.5 py-0.5 text-[11px] font-semibold text-brand">
              {stop.changed}
            </div>
          )}
        </div>
      </button>

      <div className="mt-1.5 flex gap-2 pl-[56px]">
        {hasStory && (
          <button
            onClick={() => {
              track("story_open", { poiId: p.id });
              nav.play(p.id, "full");
            }}
            className={`${action} flex-1`}
          >
            <Headphones size={13} />
            聽故事
          </button>
        )}
        <button
          onClick={() => openDirections(prev ? poi(prev.poiId) : null, p, mode)}
          className={`${action} ${hasStory ? "flex-1" : "ml-auto"}`}
        >
          怎麼走
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ edit mode */

/**
 * The same day, in the hand.
 *
 * Photos shrink and the legs come off. What a leg says between two stops is
 * in flux for as long as stops are being moved, and a distance that is about
 * to be wrong is worse than one that is briefly absent — the recomputed lines
 * are back the moment 完成 is pressed, which is also when they can be trusted.
 * Losing them keeps a seven-stop day inside one screen, so a drag never has to
 * fight the scroll.
 *
 * Dragging is raw Pointer Events: one capture on the handle, rectangles
 * measured once when the finger goes down, and arithmetic after that. No
 * library, and no mouse-only assumptions — `touch-action: none` on the handle
 * alone means a thumb on the handle drags and a thumb anywhere else still
 * scrolls the list.
 */
function EditList({
  stops,
  offset,
  onMove,
  onRemove,
  onTime,
}: {
  stops: Stop[];
  /** Where this track starts in the day-wide index `moveStop` speaks. */
  offset: number;
  /** The stop that was grabbed, so the receiver can check the indices still fit. */
  onMove: (stopId: string, from: number, to: number) => void;
  onRemove: (stopId: string) => void;
  onTime: (stopId: string) => void;
}) {
  const { t } = useI18n();
  const calm = useReducedMotion();

  const rows = useRef<(HTMLDivElement | null)[]>([]);
  /* Measured once, at pointerdown. Everything that moves afterwards moves by
     transform, so the layout these describe stays true for the whole drag. */
  const rects = useRef<(DOMRect | null)[]>([]);
  const from = useRef(0);

  /* The gesture lives in a ref and is mirrored into state for drawing.
     Reading it back out of state would make each handler depend on a render
     having happened since the last event — true often enough to look fine and
     false exactly when two events land in one task, at which point the drop is
     silently dropped. A ref is the thing being manipulated; the state is a
     picture of it. */
  const live = useRef<{ index: number; to: number } | null>(null);
  const [drag, setDrag] = useState<{ index: number; dy: number; to: number } | null>(null);
  const [leaving, setLeaving] = useState<{ id: string; h: number; shut: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  /**
   * The removal the closing row is on its way to committing.
   *
   * Held rather than left to the timeout alone, because there are three ways to
   * arrive at the end of that 210 ms other than waiting: another delete, 完成,
   * and an AI card taking edit mode away. Only the last timeout used to be
   * tracked, so a second delete inside the window silently abandoned the first
   * one's handle, and leaving edit mode mid-animation cleared the timer and lost
   * the delete outright — the row had already closed, so the receipt was on
   * screen for a change that never happened.
   */
  const pending = useRef<(() => void) | null>(null);

  /** Commit whatever is closing, now. Safe to call when nothing is. */
  const flush = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const go = pending.current;
    pending.current = null;
    go?.();
  };

  /* Reads refs only, so the cleanup captured on mount stays correct. */
  useEffect(() => () => flush(), []);

  /**
   * Where the stop would land: how many of the others the finger has passed.
   * That count is exactly the index for `splice(to, 0, moved)` on the list
   * with the dragged stop taken out, which is what `moveStop` expects.
   */
  const slotFor = (y: number, index: number) => {
    let to = 0;
    rects.current.forEach((r, i) => {
      if (i === index || !r) return;
      if (y > r.top + r.height / 2) to += 1;
    });
    return Math.max(0, Math.min(stops.length - 1, to));
  };

  const down = (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    rects.current = stops.map((_, i) => rows.current[i]?.getBoundingClientRect() ?? null);
    from.current = e.clientY;
    live.current = { index, to: index };
    setDrag({ index, dy: 0, to: index });
  };

  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const v = live.current;
    if (!v) return;
    const to = slotFor(e.clientY, v.index);
    live.current = { index: v.index, to };
    setDrag({ index: v.index, dy: e.clientY - from.current, to });
  };

  const up = () => {
    const v = live.current;
    if (!v) return;
    live.current = null;
    setDrag(null);
    /* `stops` can have shrunk under the finger — a delete's row finishing its
       close mid-drag — in which case `index` no longer names the stop that was
       grabbed and there is nothing safe to move. */
    const grabbed = stops[v.index];
    if (grabbed && v.to !== v.index) onMove(grabbed.id, offset + v.index, offset + v.to);
  };

  /* A cancelled gesture is not a quiet one. The system took the pointer away —
     a call, a swipe-back — and finishing the move on its behalf would land a
     stop somewhere nobody let go of. */
  const cancel = () => {
    live.current = null;
    setDrag(null);
  };

  /**
   * Gone on the way out, not gone after a question. One stop is a small enough
   * loss that a confirm dialog costs more attention than the mistake would —
   * the row closing up is the receipt.
   */
  const drop = (id: string, i: number) => {
    /* Whatever was already closing commits first, so the two deletes land in
       the order they were tapped and the second one is computed against a day
       that has the first one in it. */
    flush();
    const h = rows.current[i]?.offsetHeight ?? 0;
    if (calm || !h) {
      onRemove(id);
      return;
    }
    pending.current = () => onRemove(id);
    setLeaving({ id, h, shut: false });
    requestAnimationFrame(() =>
      setLeaving((l) => (l && l.id === id ? { ...l, shut: true } : l)),
    );
    timer.current = window.setTimeout(() => {
      setLeaving(null);
      flush();
    }, 210);
  };

  /* Which row the landing line is drawn against. `to` counts the post-removal
     list, so anything at or after the gap the dragged stop left behind sits one
     row further down in the list actually on screen. */
  const landing = drag && drag.to !== drag.index ? (drag.to < drag.index ? drag.to : drag.to + 1) : -1;

  return (
    <div className={drag ? "select-none" : ""}>
      {stops.map((s, i) => {
        const p = poi(s.poiId);
        const lift = drag && drag.index === i ? drag : null;
        const going = leaving && leaving.id === s.id ? leaving : null;

        return (
          <div
            key={s.id}
            ref={(el) => {
              rows.current[i] = el;
            }}
            className={`relative rounded-2xl ${
              lift ? "bg-bg shadow-[0_10px_26px_rgba(0,0,0,.16)]" : ""
            }`}
            style={{
              transform: lift ? `translateY(${lift.dy}px)` : undefined,
              zIndex: lift ? 10 : undefined,
              maxHeight: going ? (going.shut ? 0 : going.h) : undefined,
              opacity: going?.shut ? 0 : 1,
              overflow: going ? "hidden" : undefined,
              transition: going && !calm ? "max-height .2s ease, opacity .16s ease" : undefined,
            }}
          >
            {landing === i && <Landing />}
            {landing === stops.length && i === stops.length - 1 && <Landing bottom />}

            <div className="flex items-center gap-2 py-1">
              {/* One stop cannot be reordered, so it gets no handle to try it
                  with — but it keeps the space, because on a split day the
                  one-stop tracks sit above the two-stop ones and a time column
                  that indents itself by 44px halfway down is not a column. */}
              {stops.length > 1 ? (
                <button
                  aria-label={t("拖曳排序")}
                  onPointerDown={(e) => down(e, i)}
                  onPointerMove={move}
                  onPointerUp={up}
                  onPointerCancel={cancel}
                  style={{ touchAction: "none" }}
                  className="grid size-11 shrink-0 cursor-grab place-items-center rounded-full text-ink-3 active:bg-surface"
                >
                  <Grip />
                </button>
              ) : (
                <span className="size-11 shrink-0" />
              )}

              <button
                onClick={() => onTime(s.id)}
                className="num relative min-h-11 shrink-0 px-1 text-[14px] font-bold text-ink after:absolute after:inset-y-0 after:-inset-x-1 after:content-['']"
              >
                {s.at}
              </button>

              <PoiImage poi={p} height={40} radius={10} className="w-10" />

              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold text-ink">{p.name}</div>
                {s.stayMin > 0 && (
                  <div className="mt-0.5 truncate text-[12px] text-ink-3">
                    停留 {dur(s.stayMin)}
                  </div>
                )}
              </div>

              <button
                aria-label={t("刪除這一站")}
                onClick={() => drop(s.id, i)}
                className="grid size-11 shrink-0 place-items-center rounded-full text-ink-3 active:bg-surface"
              >
                <Cross />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Where the dragged stop will land. Absolute, so the list never reflows. */
function Landing({ bottom }: { bottom?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute inset-x-0 z-20 h-[2.5px] rounded-full bg-brand ${
        bottom ? "-bottom-px" : "-top-px"
      }`}
    />
  );
}

/**
 * One stop's clock.
 *
 * Steppers rather than a native time field: the demo runs inside a device
 * frame on a desktop browser, where `<input type="time">` is a text box with a
 * spinner and nothing like the control this screen is describing.
 *
 * The minus stops at the earliest the stop can actually be reached, and says
 * so underneath. Letting somebody dial in 10:00 and then quietly storing 11:34
 * is worse than not offering 10:00 — one is a boundary, the other is the app
 * changing their answer without mentioning it.
 */
function TimeSheet({
  stop,
  floor,
  onClose,
  onSave,
}: {
  stop: Stop;
  /** Earliest arrival, or null for the stop that starts the track. */
  floor: string | null;
  onClose: () => void;
  onSave: (at: string) => void;
}) {
  const { t } = useI18n();
  const p = poi(stop.poiId);
  const min = floor ? toMinutes(floor) : 0;
  const [at, setAt] = useState(() => Math.max(toMinutes(stop.at), min));

  const nudge = (by: number) => setAt((v) => Math.max(min, Math.min(23 * 60 + 59, v + by)));

  return (
    <Sheet open onClose={onClose} title={t("調整時間")}>
      <div className="px-5 pb-2">
        <div className="truncate text-[14px] text-ink-3">{p.name}</div>

        <div className="num mt-3 text-center text-[38px] font-bold leading-none text-ink">
          {toClock(at)}
        </div>

        <div className="mt-4 space-y-2">
          <Stepper label={t("小時")} onLess={() => nudge(-60)} onMore={() => nudge(60)} floored={at - 60 < min} />
          <Stepper label={t("分鐘")} onLess={() => nudge(-5)} onMore={() => nudge(5)} floored={at - 5 < min} />
        </div>

        {floor && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
            {t("走完前一站，最早能到的時間")}
            <span className="num">：{floor}</span>
          </p>
        )}

        <div className="mt-4 space-y-1">
          <Button onClick={() => onSave(toClock(at))}>{t("儲存")}</Button>
          <Button variant="ghost" onClick={onClose}>
            {t("取消")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function Stepper({
  label,
  onLess,
  onMore,
  floored,
}: {
  label: string;
  onLess: () => void;
  onMore: () => void;
  /** At the earliest possible arrival — there is nothing below this. */
  floored: boolean;
}) {
  const key =
    "grid size-11 shrink-0 place-items-center rounded-full bg-bg text-[19px] font-bold text-ink transition active:bg-surface-2 disabled:opacity-35";
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface p-1.5 pl-3.5">
      <span className="flex-1 text-[14px] font-semibold text-ink-2">{label}</span>
      <button disabled={floored} onClick={onLess} className={key}>
        −
      </button>
      <button onClick={onMore} className={key}>
        ＋
      </button>
    </div>
  );
}

/**
 * Honour the setting rather than assume it never changes: somebody who turns
 * reduced motion on mid-session has said something, and it applies now.
 */
function useReducedMotion() {
  const [calm, setCalm] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const on = () => setCalm(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  return calm;
}

function Grip() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

function Cross() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ bits */

function Stack({ who, size }: { who: TravellerId[]; size: number }) {
  return (
    <div className="flex shrink-0 -space-x-1.5">
      {who.map((id) => {
        const t = BY_TRAVELLER[id];
        return (
          <span key={id} className="rounded-full ring-2 ring-bg">
            <Avatar name={t.name} color={t.color} initial={t.initial} size={size} />
          </span>
        );
      })}
    </div>
  );
}

function MapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="地圖"
      className="grid size-11 place-items-center rounded-full text-ink active:bg-surface"
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" strokeLinejoin="round" />
        <path d="M9 4.5v12.7M15 6.8v12.7" />
      </svg>
    </button>
  );
}
